import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ILealbotStepHandler, LealbotHandlerContext, LealbotStepResult } from './lealbot-step-handler.interface';
import { ConversationState, CreateOrderRequest, OrderItem } from '../models/lealbot.models';
import { LealbotService } from '../../../lealbot/services/lealbot.service';

@Injectable({
  providedIn: 'root'
})
export class OrderFlowHandler implements ILealbotStepHandler {

  constructor(private lealbotService: LealbotService) {}

  canHandle(state: ConversationState): boolean {
    return [
      ConversationState.REVIEW_ORDER,
      ConversationState.ORDER_CONFIRMED
    ].includes(state);
  }

  handle(input: string, context: LealbotHandlerContext): Observable<LealbotStepResult> {
    const action = input.trim().toUpperCase();

    if (action === 'CANCEL' || action === 'CANCELAR') {
      return of({
        botMessage: 'Tu orden no ha sido procesada. Puedes seguir editando tu carrito cuando gustes.',
        nextState: ConversationState.BROWSING,
        quickReplies: [
          { label: 'Ver Menú', value: 'MENU' },
          { label: 'Ver Carrito', value: 'CART' }
        ]
      });
    }

    if (context.cart.length === 0) {
      return of({
        botMessage: 'Tu carrito está vacío. Elige productos de nuestro menú antes de confirmar:',
        nextState: ConversationState.BROWSING,
        quickReplies: [{ label: 'Ver Menú', value: 'MENU' }]
      });
    }

    const orderItems: OrderItem[] = context.cart.map((item) => ({
      productId: item.productId,
      cantidad: item.quantity,
      precioUnitario: item.price,
      comentarios: item.comments || ''
    }));

    const orderPayload: CreateOrderRequest = {
      tenantId: context.tenantId,
      sessionId: context.sessionId,
      customerId: context.customer?.id,
      customerName: context.customer?.name || 'Cliente',
      customerPhone: context.customer?.phone || '',
      customerEmail: context.customer?.email || '',
      items: orderItems,
      couponCode: context.appliedCoupon?.couponCode || undefined,
      descuento: context.discount,
      subtotal: context.subtotal,
      totalFinal: context.total,
      source: 'CHATBOT'
    };

    return this.lealbotService.createOrder(orderPayload).pipe(
      map((res) => {
        const order = res.object;
        const orderNum = order?.id || Math.floor(1000 + Math.random() * 9000);

        return {
          botMessage: `¡Tu pedido #${orderNum} ha sido confirmado con éxito! 🎉 Total: $${context.total.toFixed(2)}. Nuestro equipo lo está preparando ahora mismo.`,
          nextState: ConversationState.ORDER_CONFIRMED,
          quickReplies: [
            { label: 'Pedir Más', value: 'MENU' },
            { label: 'Cerrar Chat', value: 'CLOSE' }
          ],
          updatedCart: [],
          orderResponse: order
        };
      }),
      catchError((err) => {
        return of({
          botMessage: 'Hubo un error al procesar tu pedido. Por favor intenta confirmar nuevamente.',
          nextState: ConversationState.REVIEW_ORDER,
          quickReplies: [
            { label: 'Reintentar Confirmación', value: 'CONFIRM' },
            { label: 'Ver Carrito', value: 'CART' }
          ]
        });
      })
    );
  }
}
