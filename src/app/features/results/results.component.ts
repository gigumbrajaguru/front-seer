import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReadingService } from '../../core/services/reading.service';
import { ReadingApiService } from '../../core/services/reading-api.service';
import { StarFieldComponent } from '../../shared/components/star-field/star-field.component';
import { ApiReadingResponse, OracleReading } from '../../core/models/session.model';
import { DivinationSystem } from '../../core/models/card.model';

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
  readonly isLoading = signal(false);
  readonly finalResult = signal<ApiReadingResponse | null>(null);
  readonly apiResults = signal<(ApiReadingResponse | null)[]>([]);
  readonly apiErrors = signal<(string | null)[]>([]);
  readonly showOverviewLoading = computed(() => this.isLoading() && !this.finalResult());
  readonly completedMethodCount = computed(() =>
    this.apiResults().filter(result => !!result).length + this.apiErrors().filter(error => !!error).length
  );

  readonly systemLabels: Record<DivinationSystem, string> = {
    'tarot': 'Tarot',
    'lenormand': 'Lenormand',
    'runes': 'Runes',
    'iching': 'I Ching',
    'belline': 'Belline',
    'playing-cards': 'Playing Cards',
    'kipper': 'Kipper',
    'sibilla': 'Sibilla',
    'oracle-marseille': 'Oracle Marseille',
    'oracle-etteilla': 'Oracle Etteilla',
    'oracle-generic': 'Oracle Generic',
  };

  readonly systemIcons: Record<DivinationSystem, string> = {
    'tarot': '🌟',
    'lenormand': '🍀',
    'runes': 'ᚠ',
    'iching': '䷀',
    'belline': '🔮',
    'playing-cards': '♠',
    'kipper': '🪄',
    'sibilla': '🌙',
    'oracle-marseille': '☀️',
    'oracle-etteilla': '⚜️',
    'oracle-generic': '✨',
  };

  /** Builds the top finalized summary from the combined backend result or fallback text. */
  readonly finalSummary = computed(() => {
    // Prefer the backend's combined summary so the top section is one answer for all methods.
    const finalResult = this.finalResult();
    if (finalResult) {
      const summaryParts = [
        this.finalVerdictText(finalResult) ? `Final verdict: ${this.finalVerdictText(finalResult)}` : '',
        this.finalizedAnswerText(finalResult) ? `Finalized answer: ${this.finalizedAnswerText(finalResult)}` : '',
      ].filter(Boolean);

      return summaryParts.length > 0 ? summaryParts.join('\n\n') : null;
    }

    if (this.isLoading()) return null;

    const completedResults = this.apiResults()
      .map(result => {
        return result
          ? {
              finalVerdict: this.finalVerdictText(result),
              finalizedAnswer: this.finalizedAnswerText(result),
            }
          : null;
      })
      .filter((result): result is {
        finalVerdict: string;
        finalizedAnswer: string;
      } => result !== null);

    if (completedResults.length === 0) return null;

    const finalVerdict = this.joinSummaryText(completedResults.map(result => result.finalVerdict));
    const finalizedAnswer = this.joinSummaryText(completedResults.map(result => result.finalizedAnswer));
    const summaryParts = [
      finalVerdict ? `Final verdict: ${finalVerdict}` : '',
      finalizedAnswer ? `Finalized answer: ${finalizedAnswer}` : '',
    ].filter(Boolean);

    return summaryParts.length > 0 ? summaryParts.join('\n\n') : null;
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

  /** Requests the combined summary and each per-oracle interpretation for the results screen. */
  private fetchInterpretations(): void {
    const s = this.session();
    const readings = s.oracleReadings;

    this.isLoading.set(true);
    this.finalResult.set(null);
    this.apiResults.set(new Array(readings.length).fill(null));
    this.apiErrors.set(new Array(readings.length).fill(null));

    // Results are requested only after the user presses "Get Your Reading" and enters this route.
    // The combined request drives the top summary; per-oracle requests drive card insights below.
    let completed = 0;
    const totalRequests = readings.length + 1;

    const finish = () => {
      completed++;
      if (completed >= totalRequests) this.isLoading.set(false);
    };

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
          finish();
        },
        error: () => {
          finish();
        },
      });

    readings.forEach((reading, index) => {
      this.readingApiService
        .submitReading({
          question: s.question,
          fileContent: s.fileContent,
          system: reading.system,
          spreadType: reading.spreadLabel ?? reading.spreadType,
          cards: reading.drawnCards.map(dc => ({
            id: dc.card.id,
            name: dc.card.name,
            position: dc.positionLabel,
            isReversed: dc.isReversed,
          })),
        })
        .subscribe({
          next: result => {
            this.apiResults.update(arr => {
              const updated = [...arr];
              updated[index] = result;
              return updated;
            });
            finish();
          },
          error: err => {
            const msg = err?.error?.detail ?? 'Reading unavailable — check API configuration.';
            this.apiErrors.update(arr => {
              const updated = [...arr];
              updated[index] = msg;
              return updated;
            });
            finish();
          },
        });
    });
  }

  /** Finds the AI insight for a specific drawn card in one oracle result. */
  getCardInsight(oracleIndex: number, cardId: number): string | null {
    return this.apiResults()[oracleIndex]?.cardInsights?.find(i => i.cardId === cardId)?.insight ?? null;
  }

  /** Extracts final verdict text from either backend naming convention. */
  private finalVerdictText(result: ApiReadingResponse | null | undefined): string {
    return (result?.finalVerdict ?? result?.final_verdict ?? '').trim();
  }

  /** Extracts finalized answer text with interpretation as the display fallback. */
  private finalizedAnswerText(result: ApiReadingResponse | null | undefined): string {
    return (result?.finalized_answer ?? result?.interpretation ?? '').trim();
  }

  /** Joins fallback per-oracle summary text into one paragraph. */
  private joinSummaryText(values: string[]): string {
    return values.map(value => value.trim()).filter(Boolean).join(' ');
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
