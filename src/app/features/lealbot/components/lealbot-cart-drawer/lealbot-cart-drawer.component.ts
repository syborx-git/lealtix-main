import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CartItem, CouponValidationData } from '../../models/lealbot.models';

@Component({
  selector: 'app-lealbot-cart-drawer',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="isOpen" class="cart-drawer-overlay" (click)="close.emit()">
      <div class="cart-drawer-content" (click)="$event.stopPropagation()">
        <div class="cart-header">
          <h3><i class="pi pi-shopping-cart me-2"></i> Mi Pedido</h3>
          <button type="button" class="close-btn" (click)="close.emit()">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="cart-body">
          <div *ngIf="cart.length === 0" class="empty-cart">
            <i class="pi pi-shopping-bag empty-icon"></i>
            <p>Tu carrito está vacío</p>
          </div>

          <div *ngIf="cart.length > 0" class="cart-items-list">
            <div *ngFor="let item of cart" class="cart-item-row">
              <div class="item-info">
                <span class="item-name">{{ item.productName }}</span>
                <span class="item-price">\${{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
              <div class="item-controls">
                <button type="button" class="qty-btn" (click)="removeItem.emit(item.productId)">-</button>
                <span class="qty-label">{{ item.quantity }}</span>
                <button type="button" class="qty-btn" (click)="addItem.emit(item)">+</button>
              </div>
            </div>
          </div>

          <!-- Resumen de Costos -->
          <div *ngIf="cart.length > 0" class="cart-summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>\${{ subtotal.toFixed(2) }}</span>
            </div>
            <div *ngIf="discount > 0" class="summary-row discount-row">
              <span>Descuento ({{ appliedCoupon?.campaignTitle || 'Cupón' }}):</span>
              <span>-\${{ discount.toFixed(2) }}</span>
            </div>
            <div class="summary-row total-row">
              <strong>Total:</strong>
              <strong>\${{ total.toFixed(2) }}</strong>
            </div>
          </div>
        </div>

        <div *ngIf="cart.length > 0" class="cart-footer">
          <p-button
            label="Confirmar Pedido"
            icon="pi pi-check"
            styleClass="checkout-btn w-full"
            (onClick)="checkout.emit()"
          ></p-button>
        </div>
      </div>
    </div>
  `
})
export class LealbotCartDrawerComponent {
  @Input() isOpen = false;
  @Input() cart: readonly CartItem[] = [];
  @Input() subtotal = 0;
  @Input() discount = 0;
  @Input() total = 0;
  @Input() appliedCoupon: CouponValidationData | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() addItem = new EventEmitter<CartItem>();
  @Output() removeItem = new EventEmitter<number>();
  @Output() checkout = new EventEmitter<void>();
}
