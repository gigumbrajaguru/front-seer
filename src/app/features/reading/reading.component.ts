import { Component, inject } from '@angular/core';
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
  readonly hasDrawnCards = this.readingService.hasDrawnCards;
  readonly canSubmit = this.readingService.canSubmit;

  onSystemChange(system: DivinationSystem): void {
    this.readingService.setSystem(system);
  }

  onSpreadChange(event: { type: SpreadType; customCount?: number }): void {
    this.readingService.setSpreadType(event.type, event.customCount);
  }

  drawCards(): void {
    const { system, spreadType, customCount } = this.session();
    const cards = this.divinationService.drawCards(system, spreadType, customCount);
    this.readingService.setDrawnCards(cards);
  }

  revealCard(index: number): void {
    this.readingService.revealCard(index);
  }

  revealAll(): void {
    this.readingService.revealAll();
  }

  proceed(): void {
    this.router.navigate(['/results']);
  }

  reset(): void {
    this.readingService.reset();
  }
}
