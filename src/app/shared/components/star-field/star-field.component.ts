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

  ngOnInit(): void {
    this.stars = Array.from({ length: 180 }, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${1 + Math.random() * 2.5}px`,
      opacity: 0.3 + Math.random() * 0.7,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 4}s`
    }));
  }
}
