import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ILealbotStepHandler, LealbotHandlerContext, LealbotStepResult } from './lealbot-step-handler.interface';
import { ConversationState } from '../models/lealbot.models';
import { LealbotService } from '../../../lealbot/services/lealbot.service';
import { LEALBOT_MESSAGES } from '../../../lealbot/lealbot-messages';

@Injectable({
  providedIn: 'root'
})
export class CatalogFlowHandler implements ILealbotStepHandler {

  constructor(private lealbotService: LealbotService) {}

  canHandle(state: ConversationState): boolean {
    return [
      ConversationState.INITIAL,
      ConversationState.CUSTOMER_IDENTIFIED,
      ConversationState.BROWSING,
      ConversationState.PRODUCT_SELECTED,
      ConversationState.CROSS_SELL
    ].includes(state);
  }

  handle(input: string, context: LealbotHandlerContext): Observable<LealbotStepResult> {
    const action = input.trim().toUpperCase();

    if (action === 'COUPON' || action === 'CUPON' || action === 'TENGO UN CUPÓN') {
      return of({
        botMessage: '¡Excelente! Ingresa el código de tu cupón o promoción:',
        nextState: ConversationState.COUPON_VALIDATION,
        inputType: 'TEXT',
        inputPlaceholder: 'Código del cupón (ej: PROMO20)'
      });
    }

    if (action === 'REGISTER' || action === 'REGISTRARME' || action === 'SOY NUEVO') {
      return of({
        botMessage: '¡Con gusto te registro! ¿Cuál es tu nombre completo?',
        nextState: ConversationState.CUSTOMER_NEW,
        inputType: 'TEXT',
        inputPlaceholder: 'Tu nombre completo',
        updatedTempRegistration: {}
      });
    }

    if (action === 'IDENTIFY' || action === 'YA SOY CLIENTE') {
      return of({
        botMessage: 'Ingresa tu teléfono a 10 dígitos o tu correo registrado:',
        nextState: ConversationState.WAITING_CONTACT,
        inputType: 'CONTACT',
        inputPlaceholder: '5512345678 o tu@correo.com',
        updatedTempRegistration: {}
      });
    }

    if (action === 'CART' || action === 'CARRITO' || action === 'VER CARRITO') {
      if (context.cart.length === 0) {
        return of({
          botMessage: 'Tu carrito está vacío. Puedes elegir productos de nuestro catálogo:',
          nextState: ConversationState.BROWSING,
          quickReplies: [{ label: 'Ver Menú', value: 'MENU' }]
        });
      }
      return of({
        botMessage: `Tienes ${context.cart.length} producto(s) en tu carrito. Total: $${context.total.toFixed(2)}. ¿Deseas confirmar tu orden?`,
        nextState: ConversationState.REVIEW_ORDER,
        quickReplies: [
          { label: 'Confirmar Pedido', value: 'CONFIRM' },
          { label: 'Seguir Comprando', value: 'MENU' }
        ]
      });
    }

    if (action === 'CONFIRM' || action === 'CONFIRMAR' || action === 'PEDIR') {
      return of({
        botMessage: `¿Confirmamos tu pedido por un total de $${context.total.toFixed(2)}?`,
        nextState: ConversationState.REVIEW_ORDER,
        quickReplies: [
          { label: 'Sí, Confirmar Pedido', value: 'CONFIRM' },
          { label: 'Cancelar', value: 'CANCEL' }
        ]
      });
    }

    if (action === 'LO_DE_SIEMPRE' && context.customer?.id) {
      return this.lealbotService.getLastOrder(context.customer.id, context.tenantId).pipe(
        map((res) => {
          const products = res.object || [];
          if (products.length > 0) {
            return {
              botMessage: 'En tu última visita ordenaste estos productos. ¿Deseas agregarlos al carrito?',
              nextState: ConversationState.BROWSING,
              quickReplies: [
                { label: 'Agregar Todos', value: 'ADD_LAST_ORDER' },
                { label: 'Ver Menú Completo', value: 'MENU' }
              ]
            };
          }
          return {
            botMessage: 'Aún no tenemos registro de pedidos anteriores. ¡Explora nuestro menú para ordenar!',
            nextState: ConversationState.BROWSING,
            quickReplies: [{ label: 'Ver Menú', value: 'MENU' }]
          };
        }),
        catchError(() => {
          return of({
            botMessage: 'Explora nuestro menú para armar tu pedido:',
            nextState: ConversationState.BROWSING,
            quickReplies: [{ label: 'Ver Menú', value: 'MENU' }]
          });
        })
      );
    }

    // Default: mostrar opciones del menú
    return of({
      botMessage: '¿En qué te puedo ayudar hoy? Puedes explorar el menú, aplicar un cupón o ver tu pedido:',
      nextState: ConversationState.BROWSING,
      quickReplies: [
        { label: 'Ver Menú', value: 'MENU' },
        { label: 'Tengo un Cupón', value: 'COUPON' },
        { label: 'Ver Carrito', value: 'CART' }
      ]
    });
  }
}
