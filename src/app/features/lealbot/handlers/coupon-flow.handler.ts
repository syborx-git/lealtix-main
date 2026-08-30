import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ILealbotStepHandler, LealbotHandlerContext, LealbotStepResult } from './lealbot-step-handler.interface';
import { ConversationState } from '../models/lealbot.models';
import { LealbotService } from '../../../lealbot/services/lealbot.service';

@Injectable({
  providedIn: 'root'
})
export class CouponFlowHandler implements ILealbotStepHandler {

  constructor(private lealbotService: LealbotService) {}

  canHandle(state: ConversationState): boolean {
    return [
      ConversationState.COUPON_VALIDATION,
      ConversationState.COUPON_SELECTION
    ].includes(state);
  }

  handle(input: string, context: LealbotHandlerContext): Observable<LealbotStepResult> {
    const couponCode = input.trim().toUpperCase();

    if (!couponCode) {
      return of({
        botMessage: 'Por favor ingresa el código del cupón:',
        nextState: ConversationState.COUPON_VALIDATION,
        inputType: 'TEXT',
        inputPlaceholder: 'Ej: BIENVENIDO10'
      });
    }

    return this.lealbotService.validateCoupon({
      couponCode,
      tenantId: context.tenantId
    }).pipe(
      map((res) => {
        const couponData = res.data;

        if (couponData && couponData.isValid) {
          const discountDesc = couponData.description || 'Promoción activa';
          return {
            botMessage: `¡Cupón válido! 🎉 ${couponData.campaignTitle || couponCode}: ${discountDesc}.`,
            nextState: ConversationState.BROWSING,
            quickReplies: [
              { label: 'Ver Menú', value: 'MENU' },
              { label: 'Ver Mi Carrito', value: 'CART' }
            ],
            updatedAppliedCoupon: couponData
          };
        }

        const msg = couponData?.message || 'El cupón no es válido o ya ha expirado.';
        return {
          botMessage: `❌ ${msg} ¿Deseas intentar con otro código o ver el menú?`,
          nextState: ConversationState.BROWSING,
          quickReplies: [
            { label: 'Probar Otro Cupón', value: 'COUPON' },
            { label: 'Ver Menú', value: 'MENU' }
          ],
          updatedAppliedCoupon: null
        };
      }),
      catchError((err) => {
        return of({
          botMessage: 'Ocurrió un error al validar el cupón. Por favor verifica el código e intenta nuevamente.',
          nextState: ConversationState.BROWSING,
          quickReplies: [{ label: 'Ver Menú', value: 'MENU' }]
        });
      })
    );
  }
}
