import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { StripeErrorDetails } from '../../../../core/services/stripe-payment-gateway.service';

@Component({
  selector: 'app-step-payment-stripe',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="step-content">
      <div class="step-header">
        <h3 class="step-title">
          <i class="pi pi-credit-card step-icon"></i>
          Método de Pago
        </h3>
        <p class="step-description">Configura tu método de pago para completar el registro</p>
      </div>

      <!-- Payment Element Container -->
      <div class="payment-section">
        <div class="payment-element-container" style="position:relative">
          <div id="payment-element"></div>

          <div *ngIf="paymentElementLoading" class="payment-loading-overlay">
            <div class="overlay-content">
              <p-progressSpinner strokeWidth="3" fill="transparent" animationDuration="1s"></p-progressSpinner>
              <p>Cargando método de pago seguro...</p>
            </div>
          </div>

          <div *ngIf="paymentError" class="payment-error" style="margin-top:1rem">
            <i class="pi pi-exclamation-triangle"></i>
            <span class="friendly-message">{{ paymentError }}</span>

            <button
              type="button"
              class="details-toggle p-button p-component p-button-text"
              *ngIf="paymentErrorDetails"
              (click)="toggleDetails.emit()"
              style="margin-left:0.75rem"
            >
              <span class="p-button-label">{{ showErrorDetails ? 'Ocultar detalles' : 'Ver detalles' }}</span>
            </button>

            <div *ngIf="showErrorDetails && paymentErrorDetails" class="error-details" style="margin-top:0.75rem; font-size:0.9rem; color:#6b7280">
              <div *ngIf="paymentErrorDetails.stripeMessage"><strong>Mensaje:</strong> {{ paymentErrorDetails.stripeMessage }}</div>
              <div *ngIf="paymentErrorDetails.code"><strong>Código:</strong> {{ paymentErrorDetails.code }}</div>
              <div *ngIf="paymentErrorDetails.decline_code"><strong>Decline code:</strong> {{ paymentErrorDetails.decline_code }}</div>
              <div *ngIf="paymentErrorDetails.paymentIntentId"><strong>PaymentIntent:</strong> {{ paymentErrorDetails.paymentIntentId }}</div>
            </div>
          </div>

          <div *ngIf="paymentFailed" style="margin-top:0.5rem; font-size:0.85rem; color:#374151">
            <small>Nota: al reintentar el pago el formulario de tarjeta puede reiniciarse si es necesario. Si quieres probar con otra tarjeta, rellena los datos y presiona "Reintentar pago".</small>
          </div>
        </div>
      </div>

      <div class="step-actions">
        <p-button
          label="Anterior"
          icon="pi pi-arrow-left"
          iconPos="left"
          class="secondary-button"
          (onClick)="back.emit()"
          [disabled]="paymentConfirmed"
        ></p-button>

        <p-button
          [label]="paymentFailed ? 'Reintentar pago' : 'Procesar Pago'"
          [icon]="paymentFailed ? 'pi pi-refresh' : 'pi pi-check'"
          iconPos="right"
          class="primary-button"
          (onClick)="paymentFailed ? retry.emit() : pay.emit()"
          [loading]="isProcessingPayment || retryInProgress"
          [disabled]="paymentElementLoading || isProcessingPayment || retryInProgress || (!stripeInitialized && !paymentFailed)"
        ></p-button>
      </div>
    </div>
  `
})
export class StepPaymentStripeComponent {
  @Input() paymentElementLoading = false;
  @Input() paymentError: string | null = null;
  @Input() paymentErrorDetails: StripeErrorDetails | null = null;
  @Input() showErrorDetails = false;
  @Input() paymentFailed = false;
  @Input() paymentConfirmed = false;
  @Input() stripeInitialized = false;
  @Input() isProcessingPayment = false;
  @Input() retryInProgress = false;

  @Output() back = new EventEmitter<void>();
  @Output() pay = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();
  @Output() toggleDetails = new EventEmitter<void>();
}
