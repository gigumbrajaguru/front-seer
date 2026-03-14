import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReadingService } from '../../core/services/reading.service';
import { ReadingApiService } from '../../core/services/reading-api.service';
import { StarFieldComponent } from '../../shared/components/star-field/star-field.component';
import { ApiReadingResponse } from '../../core/models/session.model';

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
  readonly apiResult = signal<ApiReadingResponse | null>(null);
  readonly apiError = signal<string | null>(null);

  ngOnInit(): void {
    if (this.session().drawnCards.length === 0) {
      this.router.navigate(['/']);
      return;
    }
    this.fetchInterpretation();
  }

  private fetchInterpretation(): void {
    const s = this.session();
    this.isLoading.set(true);
    this.readingApiService
      .submitReading({
        question: s.question,
        fileContent: s.fileContent,
        system: s.system,
        spreadType: s.spreadType,
        cards: s.drawnCards.map((dc) => ({
          id: dc.card.id,
          name: dc.card.name,
          position: dc.positionLabel,
          isReversed: dc.isReversed,
        })),
      })
      .subscribe({
        next: (result) => {
          this.apiResult.set(result);
          this.isLoading.set(false);
        },
        error: () => {
          this.apiError.set(null);
          this.isLoading.set(false);
        },
      });
  }

  getCardInsight(cardId: number): string | null {
    return this.apiResult()?.cardInsights?.find((i) => i.cardId === cardId)?.insight ?? null;
  }

  newReading(): void {
    this.readingService.reset();
    this.router.navigate(['/']);
  }
}
