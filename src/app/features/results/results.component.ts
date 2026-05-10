import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReadingService } from '../../core/services/reading.service';
import { ReadingApiService } from '../../core/services/reading-api.service';
import { StarFieldComponent } from '../../shared/components/star-field/star-field.component';
import {
  ApiReadingResponse,
  CardInsight,
  FinalSummaryMethod,
  FinalSummaryResponse,
  OracleReading,
} from '../../core/models/session.model';
import { DivinationSystem, DrawnCard } from '../../core/models/card.model';
import { SYSTEM_ICONS, SYSTEM_LABELS } from '../../core/models/oracle.constants';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, StarFieldComponent],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss',
})
export class ResultsComponent implements OnInit {
  private readonly readingService = inject(ReadingService);
  private readonly readingApiService = inject(ReadingApiService);
  private readonly router = inject(Router);

  readonly session = this.readingService.session;
  private _fetchStarted = false;
  readonly isLoading = signal(false);
  readonly finalResult = signal<FinalSummaryResponse | null>(null);
  readonly apiResults = signal<(ApiReadingResponse | null)[]>([]);
  readonly apiErrors = signal<(string | null)[]>([]);
  readonly showOverviewLoading = computed(() => this.isLoading() && !this.finalResult());
  readonly completedMethodCount = computed(() =>
    this.apiResults().filter(result => !!result).length + this.apiErrors().filter(error => !!error).length
  );

  readonly systemLabels = SYSTEM_LABELS;
  readonly systemIcons = SYSTEM_ICONS;

  /** Builds the top finalized summary from the combined backend result. */
  readonly finalSummary = computed(() => {
    const finalResult = this.finalResult();
    if (!finalResult) return null;
    return finalResult.finalized_answer_verdict?.trim() || null;
  });

  /** Redirects empty sessions and starts backend interpretation requests for completed readings. */
  ngOnInit(): void {
    const readings = this.session().oracleReadings;
    if (!readings || readings.length === 0 || readings.every(r => r.drawnCards.length === 0)) {
      this.router.navigate(['/']);
      return;
    }
    this.fetchInterpretations();
  }

  /** Requests the combined final-summary once and derives per-oracle card insights from it. */
  private fetchInterpretations(): void {
    if (this._fetchStarted) return;
    this._fetchStarted = true;

    const s = this.session();
    const readings = s.oracleReadings;

    this.isLoading.set(true);
    this.finalResult.set(null);
    this.apiResults.set(new Array(readings.length).fill(null));
    this.apiErrors.set(new Array(readings.length).fill(null));

    this.readingApiService
      .submitFinalSummary({
        question: s.question,
        fileContent: s.fileContent,
        readings: readings.map(reading => ({
          system: reading.system,
          spreadType: reading.spreadLabel ?? reading.spreadType,
          cards: reading.drawnCards.map(dc => ({
            id: dc.card.id,
            name: dc.card.name,
            position: dc.positionLabel,
            isReversed: dc.isReversed,
          })),
        })),
      })
      .subscribe({
        next: result => {
          this.finalResult.set(result);
          this.apiResults.set(
            readings.map((reading, i) => {
              const method = result.methods[i];
              return method ? this.parseMethodResult(method, reading.drawnCards) : null;
            })
          );
          this.isLoading.set(false);
        },
        error: err => {
          const msg = err?.error?.detail ?? 'Reading unavailable — check API configuration.';
          this.apiErrors.set(readings.map(() => msg));
          this.isLoading.set(false);
        },
      });
  }

  /** Converts one FinalSummaryMethod into the ApiReadingResponse shape the template consumes. */
  private parseMethodResult(method: FinalSummaryMethod, drawnCards: DrawnCard[]): ApiReadingResponse {
    const positions = method.spreads?.[0]?.positions ?? [];
    const cardInsights: CardInsight[] = positions
      .slice(0, drawnCards.length)
      .map((pos, i) => ({
        cardId: drawnCards[i].card.id,
        insight: (pos.Interpretation ?? pos.meaning ?? '').trim(),
      }))
      .filter(ci => ci.insight);

    return {
      interpretation: (method.final_answer ?? method.summary ?? '').trim(),
      methodSummaries: method.summary ? [{ method: method.method, summary: method.summary }] : [],
      cardInsights,
    };
  }

  /** Finds the AI insight for a specific drawn card in one oracle result. */
  getCardInsight(oracleIndex: number, cardId: number): string | null {
    return this.apiResults()[oracleIndex]?.cardInsights?.find(i => i.cardId === cardId)?.insight ?? null;
  }

  /** Whether the given oracle result includes method-level summaries. */
  hasMethodSummaries(oracleIndex: number): boolean {
    return (this.apiResults()[oracleIndex]?.methodSummaries?.length ?? 0) > 0;
  }

  /** Whether the given oracle is still waiting for either a result or an error. */
  isOraclePending(oracleIndex: number): boolean {
    return !this.apiResults()[oracleIndex] && !this.apiErrors()[oracleIndex];
  }

  /** Returns the loading label shown in the overview loader for one oracle method. */
  loadingLabelForOracle(oracleIndex: number): string {
    if (this.apiResults()[oracleIndex]) return 'Ready';
    if (this.apiErrors()[oracleIndex]) return 'Fallback ready';
    return 'Reading…';
  }

  /** Returns the spread label selected or suggested for display. */
  displaySpreadLabel(reading: OracleReading): string {
    return reading.spreadLabel ?? reading.spreadType;
  }

  /** Clears the session and returns the user to the first reading step. */
  newReading(): void {
    this.readingService.reset();
    this.router.navigate(['/']);
  }
}
