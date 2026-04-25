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
  readonly apiResults = signal<(ApiReadingResponse | null)[]>([]);
  readonly apiErrors = signal<(string | null)[]>([]);

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

  readonly finalSummary = computed(() => {
    if (this.isLoading()) return null;

    const readings = this.session().oracleReadings;
    const completedResults = this.apiResults()
      .map((result, index) => {
        const system = readings[index]?.system;
        return result?.interpretation
          ? {
              interpretation: result.interpretation,
              label: system ? this.systemLabels[system] : 'Oracle',
            }
          : null;
      })
      .filter((result): result is { interpretation: string; label: string } => result !== null);

    if (completedResults.length === 0) return null;
    if (completedResults.length === 1) return completedResults[0].interpretation;

    return completedResults
      .map(result => `${result.label}: ${result.interpretation}`)
      .join('\n\n');
  });

  ngOnInit(): void {
    const readings = this.session().oracleReadings;
    if (!readings || readings.length === 0 || readings.every(r => r.drawnCards.length === 0)) {
      this.router.navigate(['/']);
      return;
    }
    this.fetchInterpretations();
  }

  private fetchInterpretations(): void {
    const s = this.session();
    const readings = s.oracleReadings;

    this.isLoading.set(true);
    this.apiResults.set(new Array(readings.length).fill(null));
    this.apiErrors.set(new Array(readings.length).fill(null));

    let completed = 0;

    const finish = () => {
      completed++;
      if (completed >= readings.length) this.isLoading.set(false);
    };

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

  getCardInsight(oracleIndex: number, cardId: number): string | null {
    return this.apiResults()[oracleIndex]?.cardInsights?.find(i => i.cardId === cardId)?.insight ?? null;
  }

  displaySpreadLabel(reading: OracleReading): string {
    return reading.spreadLabel ?? reading.spreadType;
  }

  newReading(): void {
    this.readingService.reset();
    this.router.navigate(['/']);
  }
}
