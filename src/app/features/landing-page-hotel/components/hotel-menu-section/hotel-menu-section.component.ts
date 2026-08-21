import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hotel-menu-section',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="menu" class="hotel-menu-section">
      <div class="hotel-container">
        <div class="section-title-center">
          <span class="section-label">Alta Gastronomía & Room Service</span>
          <h2 class="section-heading">Menú Selecto</h2>
        </div>

        <!-- Filter tabs -->
        <div class="menu-categories-tabs" *ngIf="categoryNames.length > 1">
          <button
            *ngFor="let catName of categoryNames"
            type="button"
            class="hotel-tab-btn"
            [class.active]="catName === selectedCategory"
            (click)="selectCategory.emit(catName)"
          >
            {{ catName }}
          </button>
        </div>

        <!-- Product Cards Grid -->
        <div class="products-hotel-grid">
          <div *ngFor="let p of filteredProducts" class="hotel-product-card">
            <div class="product-img-box" *ngIf="p.img">
              <img [src]="p.img" [alt]="p.prod" class="product-img" />
            </div>
            <div class="product-details">
              <div class="product-header-line">
                <h4 class="product-name">{{ p.prod }}</h4>
                <span class="product-price">{{ p.precio }}</span>
              </div>
              <p class="product-description">{{ p.descProd }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HotelMenuSectionComponent {
  @Input() categoryNames: string[] = [];
  @Input() selectedCategory = 'Todos';
  @Input() filteredProducts: any[] = [];
  @Output() selectCategory = new EventEmitter<string>();
}
