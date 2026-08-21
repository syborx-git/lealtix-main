import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-lealbot-menu-catalog',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="isOpen" class="menu-catalog-overlay" (click)="close.emit()">
      <div class="menu-catalog-content" (click)="$event.stopPropagation()">
        <div class="catalog-header">
          <h3><i class="pi pi-book me-2"></i> Menú de Productos</h3>
          <button type="button" class="close-btn" (click)="close.emit()">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Categorías -->
        <div class="category-tabs" *ngIf="categories.length > 0">
          <button
            *ngFor="let cat of categories"
            type="button"
            class="category-tab-btn"
            [class.active]="cat.name === selectedCategory"
            (click)="selectCategory.emit(cat.name)"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- Lista de productos de la categoría seleccionada -->
        <div class="catalog-products-list">
          <div *ngFor="let p of currentProducts" class="product-card">
            <div class="product-info">
              <h4 class="product-title">{{ p.name || p.productName || p.nombre }}</h4>
              <p class="product-desc">{{ p.description || p.descripcion }}</p>
              <span class="product-price">\${{ (p.price || p.precio || 0).toFixed(2) }}</span>
            </div>
            <button
              pButton
              type="button"
              icon="pi pi-plus"
              label="Agregar"
              class="p-button-sm p-button-outlined add-btn"
              (click)="addProduct.emit(p)"
            ></button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LealbotMenuCatalogComponent {
  @Input() isOpen = false;
  @Input() categories: { name: string; products: any[] }[] = [];
  @Input() selectedCategory: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() selectCategory = new EventEmitter<string>();
  @Output() addProduct = new EventEmitter<any>();

  get currentProducts(): any[] {
    if (!this.selectedCategory) return [];
    const cat = this.categories.find((c) => c.name === this.selectedCategory);
    return cat ? cat.products : [];
  }
}
