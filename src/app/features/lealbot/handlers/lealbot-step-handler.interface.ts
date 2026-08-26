import { Observable } from 'rxjs';
import { ConversationState, DialogChip, Customer, CartItem, CouponValidationData, RedeemCouponData } from '../models/lealbot.models';

export interface LealbotHandlerContext {
  tenantId: number;
  sessionId: string;
  customer: Customer | null;
  cart: CartItem[];
  appliedCoupon: CouponValidationData | null;
  redeemedCoupon: RedeemCouponData | null;
  subtotal: number;
  discount: number;
  total: number;
  currentState?: ConversationState;
  tempRegistration: {
    name?: string;
    email?: string;
    phone?: string;
    gender?: string;
    birthDate?: string;
    acceptedPromotions?: boolean;
    contactType?: 'email' | 'phone' | null;
  };
}

export interface LealbotStepResult {
  botMessage?: string;
  nextState: ConversationState;
  quickReplies?: DialogChip[];
  inputType?: 'TEXT' | 'EMAIL' | 'PHONE' | 'TEXTAREA' | 'CONTACT' | 'DATE' | null;
  inputPlaceholder?: string;
  updatedCustomer?: Customer | null;
  updatedTempRegistration?: any;
  updatedAppliedCoupon?: CouponValidationData | null;
  updatedRedeemedCoupon?: RedeemCouponData | null;
  updatedCart?: CartItem[];
  shouldTriggerOrder?: boolean;
  orderResponse?: any;
}

export interface ILealbotStepHandler {
  canHandle(state: ConversationState): boolean;
  handle(input: string, context: LealbotHandlerContext): Observable<LealbotStepResult>;
}
