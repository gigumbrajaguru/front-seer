import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReadingService } from '../../core/services/reading.service';
import { DivinationService } from '../../core/services/divination.service';
import { SystemSelectorComponent } from '../../shared/components/system-selector/system-selector.component';
import { SpreadSelectorComponent } from '../../shared/components/spread-selector/spread-selector.component';
import { QuestionPanelComponent } from '../../shared/components/question-panel/question-panel.component';
import { StarFieldComponent } from '../../shared/components/star-field/star-field.component';
import { SpreadType } from '../../core/models/spread.model';
import { DivinationSystem } from '../../core/models/card.model';

@Component({
  selector: 'app-reading',
  standalone: true,
  imports: [
    CommonModule,
    SystemSelectorComponent,
    SpreadSelectorComponent,
    QuestionPanelComponent,
    StarFieldComponent,
  ],
  templateUrl: './reading.component.html',
  styleUrl: './reading.component.scss',
})
export class ReadingComponent {
  private readonly readingService = inject(ReadingService);
  private readonly divinationService = inject(DivinationService);
  private readonly router = inject(Router);

  readonly session = this.readingService.session;
  readonly currentOracle = this.readingService.currentOracle;
  readonly hasDrawnCards = this.readingService.hasDrawnCards;
  readonly canSubmitCurrentOracle = this.readingService.canSubmitCurrentOracle;
  readonly isLastOracle = this.readingService.isLastOracle;
  readonly allOraclesComplete = this.readingService.allOraclesComplete;

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

  submitQuestion(): void {
    const q = this.session().question.trim();
    if (!q) return;
    this.readingService.submitQuestion();
  }

  toggleOracle(system: DivinationSystem): void {
    this.readingService.toggleOracle(system);
  }

  submitOracles(): void {
    if (this.session().selectedOracles.length === 0) return;
    this.readingService.submitOracleSelection();
  }

  onSpreadChange(index: number, event: { type: SpreadType; customCount?: number }): void {
    this.readingService.setSpreadForOracle(index, event.type, event.customCount);
  }

  submitSpreads(): void {
    this.readingService.submitSpreadSelection();
  }

  drawCards(): void {
    const oracle = this.currentOracle();
    if (!oracle) return;
    const cards = this.divinationService.drawCards(oracle.system, oracle.spreadType, oracle.customCount);
    this.readingService.setDrawnCards(cards);
  }

  revealCard(index: number): void {
    this.readingService.revealCard(index);
  }

  revealAll(): void {
    this.readingService.revealAll();
  }

  nextOracle(): void {
    this.readingService.nextOracle();
  }

  proceed(): void {
    this.router.navigate(['/results']);
  }

  redraw(): void {
    this.readingService.resetCurrentOracle();
  }
}
