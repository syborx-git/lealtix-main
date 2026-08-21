import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-lealbot-header',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-header">
      <div class="bot-info">
        <div class="avatar-container">
          <i class="pi pi-bolt avatar-icon"></i>
          <span class="status-indicator"></span>
        </div>
        <div class="text-info">
          <h3 class="bot-name">LealBot</h3>
          <span class="bot-subtitle">Tu Asistente Virtual</span>
        </div>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="action-btn"
          pTooltip="Ver Carrito"
          tooltipPosition="bottom"
          (click)="openCart.emit()"
        >
          <i class="pi pi-shopping-cart"></i>
          <span *ngIf="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
        </button>

        <button
          type="button"
          class="action-btn close-btn"
          pTooltip="Cerrar Chat"
          tooltipPosition="bottom"
          (click)="closeChat.emit()"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>
  `
})
export class LealbotHeaderComponent {
  @Input() cartCount = 0;
  @Output() openCart = new EventEmitter<void>();
  @Output() closeChat = new EventEmitter<void>();
}
