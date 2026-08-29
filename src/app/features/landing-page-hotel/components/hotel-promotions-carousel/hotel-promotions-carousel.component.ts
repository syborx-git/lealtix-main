import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hotel-promotions-carousel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="promotions" class="hotel-promotions-section" *ngIf="hasPromotions">
      <div class="hotel-container">
        <div class="section-title-center">
          <span class="section-label">Ofertas Especiales</span>
          <h2 class="section-heading">Privilegios para Huéspedes</h2>
        </div>

        <div class="promotions-grid">
          <div *ngFor="let promo of promotions" class="promo-hotel-card">
            <div class="promo-badge">{{ promo.tag }}</div>
            <div class="promo-image-box">
              <img [src]="promo.imageUrl" [alt]="promo.title" class="promo-img" />
            </div>
            <div class="promo-content">
              <h3 class="promo-title">{{ promo.title }}</h3>
              <p class="promo-desc">{{ promo.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HotelPromotionsCarouselComponent {
  @Input() promotions: any[] = [];
  @Input() hasPromotions = false;
}
