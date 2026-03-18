import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReadingService } from '../../core/services/reading.service';
import { ReadingApiService } from '../../core/services/reading-api.service';
import { StarFieldComponent } from '../../shared/components/star-field/star-field.component';
import { ApiReadingResponse } from '../../core/models/session.model';
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
  readonly apiError = signal<string | null>(null);

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

    let completed = 0;

    readings.forEach((reading, index) => {
      this.readingApiService
        .submitReading({
          question: s.question,
          fileContent: s.fileContent,
          system: reading.system,
          spreadType: reading.spreadType,
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
            completed++;
            if (completed >= readings.length) {
              this.isLoading.set(false);
            }
          },
          error: () => {
            completed++;
            if (completed >= readings.length) {
              this.isLoading.set(false);
            }
          },
        });
    });
  }

  getCardInsight(oracleIndex: number, cardId: number): string | null {
    return this.apiResults()[oracleIndex]?.cardInsights?.find(i => i.cardId === cardId)?.insight ?? null;
  }

  newReading(): void {
    this.readingService.reset();
    this.router.navigate(['/']);
  }
}
