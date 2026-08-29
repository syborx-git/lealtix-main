import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hotel-about-section',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="about" class="hotel-about-section">
      <div class="hotel-container">
        <div class="about-grid">
          <div class="about-text-column">
            <span class="section-label">Tradición & Distinción</span>
            <h2 class="section-heading">{{ aboutData.since || 'Nuestra Historia' }}</h2>
            <p class="about-paragraph">{{ aboutData.story }}</p>
            <div *ngIf="aboutData.vision" class="vision-box">
              <h4>Nuestra Visión</h4>
              <p>{{ aboutData.vision }}</p>
            </div>
          </div>
          <div class="about-image-column">
            <div class="image-frame">
              <img
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
                alt="Hotel Experience"
                class="about-img"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HotelAboutSectionComponent {
  @Input() aboutData: any = {};
}
