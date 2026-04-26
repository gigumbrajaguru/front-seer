import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Star {
  top: string;
  left: string;
  size: string;
  opacity: number;
  duration: string;
  delay: string;
}

@Component({
  selector: 'app-star-field',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="star-field" aria-hidden="true">
      @for (star of stars; track $index) {
        <span class="star"
          [style.top]="star.top"
          [style.left]="star.left"
          [style.width]="star.size"
          [style.height]="star.size"
          [style.opacity]="star.opacity"
          [style.animationDuration]="star.duration"
          [style.animationDelay]="star.delay">
        </span>
      }
    </div>
  `,
  styleUrl: './star-field.component.scss'
})
export class StarFieldComponent implements OnInit {
  stars: Star[] = [];

  /** Generates random star positions and animation timings for the background. */
  ngOnInit(): void {
    this.stars = Array.from({ length: 220 }, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${0.8 + Math.random() * 2.6}px`,
      opacity: 0.25 + Math.random() * 0.65,
      duration: `${2.2 + Math.random() * 4.8}s`,
      delay: `${Math.random() * 5}s`
    }));
  }
}
