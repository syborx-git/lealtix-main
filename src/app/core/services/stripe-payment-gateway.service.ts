import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';

export interface StripeErrorDetails {
  code?: string;
  decline_code?: string;
  stripeMessage?: string;
  paymentIntentId?: string;
}

export interface StripePaymentConfirmationResult {
  success: boolean;
  error?: string;
  errorDetails?: StripeErrorDetails | null;
  paymentIntent?: any;
}

@Injectable({
  providedIn: 'root'
})
export class StripePaymentGatewayService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;
  private mountedClientSecret: string | null = null;

  /**
   * Carga e inicializa la instancia de Stripe JS con la clave pública
   */
  public async initializeStripe(publishableKey: string): Promise<Stripe | null> {
    if (!this.stripe) {
      this.stripe = await loadStripe(publishableKey);
    }
    return this.stripe;
  }

  /**
   * Crea y monta el Payment Element en un contenedor del DOM
   */
  public async mountPaymentElement(
    containerSelectorOrElement: HTMLElement,
    clientSecret: string,
    publishableKey: string
  ): Promise<boolean> {
    try {
      if (!this.stripe) {
        await this.initializeStripe(publishableKey);
      }

      if (!this.stripe) {
        throw new Error('No se pudo inicializar Stripe.');
      }

      // Si ya hay un elemento montado con el mismo clientSecret, conservarlo
      if (this.paymentElement && this.mountedClientSecret === clientSecret) {
        return true;
      }

      // Limpiar elemento previo si existe
      this.destroyPaymentElement();

      this.elements = this.stripe.elements({ clientSecret });
      this.paymentElement = this.elements.create('payment');
      this.paymentElement.mount(containerSelectorOrElement);
      this.mountedClientSecret = clientSecret;
      return true;
    } catch (error) {
      console.error('[StripePaymentGateway] Error al montar Payment Element:', error);
      return false;
    }
  }

  /**
   * Confirma el pago mediante Stripe Elements
   */
  public async confirmPayment(returnUrl?: string): Promise<StripePaymentConfirmationResult> {
    if (!this.stripe || !this.elements) {
      return {
        success: false,
        error: 'Stripe no está inicializado o los elementos no están listos.'
      };
    }

    try {
      const confirmOptions: any = {
        elements: this.elements,
        redirect: 'if_required'
      };

      if (returnUrl) {
        confirmOptions.confirmParams = { return_url: returnUrl };
      }

      const result = await this.stripe.confirmPayment(confirmOptions);

      if (result.error) {
        const errorDetails: StripeErrorDetails = {
          code: result.error.code,
          decline_code: result.error.decline_code,
          stripeMessage: result.error.message,
          paymentIntentId: result.error.payment_intent?.id
        };

        return {
          success: false,
          error: result.error.message || 'Error al procesar el pago.',
          errorDetails
        };
      }

      // Pago confirmado con éxito
      return {
        success: true,
        paymentIntent: result.paymentIntent
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Error inesperado durante la confirmación de Stripe.',
        errorDetails: { stripeMessage: String(error) }
      };
    }
  }

  /**
   * Destruye el elemento de pago montado y libera memoria
   */
  public destroyPaymentElement(): void {
    if (this.paymentElement) {
      try {
        this.paymentElement.destroy();
      } catch (e) {
        console.warn('[StripePaymentGateway] Error menor al destruir element:', e);
      }
      this.paymentElement = null;
    }
    this.elements = null;
    this.mountedClientSecret = null;
  }
}
