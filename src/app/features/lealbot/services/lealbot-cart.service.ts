import { Injectable } from '@angular/core';
import { CartItem, CouponValidationData, RedeemCouponData, TwoForOneDetails } from '../models/lealbot.models';

export interface CartCalculationResult {
  subtotal: number;
  discount: number;
  total: number;
  twoForOneDetails?: TwoForOneDetails | null;
}

@Injectable({
  providedIn: 'root'
})
export class LealbotCartService {

  /**
   * Calcula el subtotal puro del carrito sumando precio * cantidad
   */
  public calculateSubtotal(cart: CartItem[]): number {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  /**
   * Calcula el total, subtotal y descuento aplicado
   */
  public calculateTotals(
    cart: CartItem[],
    appliedCoupon: CouponValidationData | null,
    redeemedCoupon: RedeemCouponData | null
  ): CartCalculationResult {
    const subtotal = this.calculateSubtotal(cart);
    let discount = 0;
    let twoForOneDetails: TwoForOneDetails | null = null;

    if (redeemedCoupon) {
      discount = redeemedCoupon.discountAmount || 0;
      twoForOneDetails = redeemedCoupon.twoForOneDetails || null;
    } else if (appliedCoupon && appliedCoupon.isValid) {
      discount = this.estimateCouponDiscount(subtotal, cart, appliedCoupon);
    }

    const total = Math.max(0, subtotal - discount);

    return {
      subtotal,
      discount,
      total,
      twoForOneDetails
    };
  }

  /**
   * Estima el descuento de un cupón validado pero aún no redimido
   */
  private estimateCouponDiscount(
    subtotal: number,
    cart: CartItem[],
    coupon: CouponValidationData
  ): number {
    switch (coupon.rewardType) {
      case 'PERCENT_DISCOUNT': {
        const percent = coupon.rewardValue || 0;
        return (subtotal * percent) / 100;
      }
      case 'FIXED_AMOUNT': {
        const amount = coupon.rewardValue || 0;
        return Math.min(subtotal, amount);
      }
      case 'BUY_X_GET_Y': {
        // Estima 2x1 si hay al menos 2 items del mismo producto
        for (const item of cart) {
          if (item.quantity >= 2) {
            return item.price; // 1 gratis
          }
        }
        return 0;
      }
      case 'FREE_PRODUCT': {
        return coupon.rewardValue || 0;
      }
      default:
        return 0;
    }
  }

  /**
   * Agrega un item o incrementa cantidad en el carrito (inmutable)
   */
  public addItem(cart: CartItem[], product: any, quantity: number = 1, comments: string = ''): CartItem[] {
    const pId = product.productId || product.id;
    const pName = product.productName || product.name || product.nombre || '';
    const pPrice = product.price || product.precio || 0;
    const pImage = product.imageUrl || product.imagen || '';

    const existingIndex = cart.findIndex((item) => item.productId === pId);

    if (existingIndex >= 0) {
      return cart.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + quantity, comments: comments || item.comments }
          : item
      );
    }

    const newItem: CartItem = {
      productId: pId,
      productName: pName,
      price: pPrice,
      imageUrl: pImage,
      quantity,
      comments
    };

    return [...cart, newItem];
  }

  /**
   * Remueve o decrementa un item del carrito (inmutable)
   */
  public removeItem(cart: CartItem[], productId: number): CartItem[] {
    const existing = cart.find((i) => i.productId === productId);
    if (!existing) return cart;

    if (existing.quantity > 1) {
      return cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    }

    return cart.filter((item) => item.productId !== productId);
  }
}
