import { Injectable, signal, computed } from '@angular/core';
import {
  LealboState,
  ConversationState,
  ChatMessageUI,
  Customer,
  CartItem,
  DialogChip,
  CouponValidationData,
  RedeemCouponData
} from '../models/lealbot.models';
import { LealbotService } from '../../../lealbot/services/lealbot.service';
import { ProductsMenuService } from '../../../services/products-menu.service';
import { LealbotCartService } from '../services/lealbot-cart.service';
import { RegistrationFlowHandler } from '../handlers/registration-flow.handler';
import { CouponFlowHandler } from '../handlers/coupon-flow.handler';
import { OrderFlowHandler } from '../handlers/order-flow.handler';
import { CatalogFlowHandler } from '../handlers/catalog-flow.handler';
import { ILealbotStepHandler, LealbotHandlerContext } from '../handlers/lealbot-step-handler.interface';
import { LEALBOT_MESSAGES } from '../../../lealbot/lealbot-messages';

const initialBotState: LealboState = {
  sessionId: '',
  customer: null,
  messages: [],
  cart: [],
  isLoading: false,
  error: null,
  appliedCoupon: null,
  redeemedCoupon: null,
  subtotal: 0,
  discount: 0,
  total: 0,
  isOpen: false,
  availableCoupons: []
};

@Injectable({
  providedIn: 'root'
})
export class LealbotFacade {
  // Estado reactivo central con Signals
  private _state = signal<LealboState>(initialBotState);
  private _conversationState = signal<ConversationState>(ConversationState.INITIAL);
  private _quickReplies = signal<DialogChip[]>([]);
  private _inputType = signal<'TEXT' | 'EMAIL' | 'PHONE' | 'TEXTAREA' | 'CONTACT' | 'DATE' | null>(null);
  private _inputPlaceholder = signal<string>('Escribe un mensaje...');
  private _tenantId = signal<number>(1);
  private _tempRegistration = signal<any>({});
  private _menuCategories = signal<{ name: string; products: any[] }[]>([]);
  private _selectedCategory = signal<string | null>(null);

  // Handlers registrados (Strategy Pattern)
  private handlers: ILealbotStepHandler[];

  // Selectores públicos de solo lectura
  public readonly isOpen = computed(() => this._state().isOpen);
  public readonly messages = computed(() => this._state().messages);
  public readonly cart = computed(() => this._state().cart);
  public readonly subtotal = computed(() => this._state().subtotal);
  public readonly discount = computed(() => this._state().discount);
  public readonly total = computed(() => this._state().total);
  public readonly isLoading = computed(() => this._state().isLoading);
  public readonly customer = computed(() => this._state().customer);
  public readonly appliedCoupon = computed(() => this._state().appliedCoupon);
  public readonly conversationState = computed(() => this._conversationState());
  public readonly quickReplies = computed(() => this._quickReplies());
  public readonly inputType = computed(() => this._inputType());
  public readonly inputPlaceholder = computed(() => this._inputPlaceholder());
  public readonly menuCategories = computed(() => this._menuCategories());
  public readonly selectedCategory = computed(() => this._selectedCategory());

  constructor(
    private lealbotService: LealbotService,
    private productsMenuService: ProductsMenuService,
    private cartService: LealbotCartService,
    registrationHandler: RegistrationFlowHandler,
    couponHandler: CouponFlowHandler,
    orderHandler: OrderFlowHandler,
    catalogHandler: CatalogFlowHandler
  ) {
    this.handlers = [registrationHandler, couponHandler, orderHandler, catalogHandler];
  }

  public initSession(tenantId: number): void {
    this._tenantId.set(tenantId);
    const sId = this.lealbotService.generateSessionId();
    this._state.update((s) => ({ ...s, sessionId: sId }));
    this.loadMenu(tenantId);
  }

  public toggleChat(): void {
    const currentState = this._state();
    const nextIsOpen = !currentState.isOpen;

    this._state.update((s) => ({ ...s, isOpen: nextIsOpen }));

    if (nextIsOpen && currentState.messages.length === 0) {
      this.addBotMessage(LEALBOT_MESSAGES.GREETING_INITIAL.text);
      this._quickReplies.set(LEALBOT_MESSAGES.GREETING_INITIAL.quick_reply || []);
    }
  }

  public addBotMessage(text: string): void {
    const newMsg: ChatMessageUI = {
      messageType: 'TEXT',
      sender: 'BOT',
      content: text,
      timestamp: new Date().toISOString()
    };
    this._state.update((s) => ({ ...s, messages: [...s.messages, newMsg] }));
  }

  public addUserMessage(text: string): void {
    const newMsg: ChatMessageUI = {
      messageType: 'TEXT',
      sender: 'USER',
      content: text,
      timestamp: new Date().toISOString()
    };
    this._state.update((s) => ({ ...s, messages: [...s.messages, newMsg] }));
  }

  public handleUserInput(inputText: string): void {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    this.addUserMessage(trimmed);
    this._quickReplies.set([]);
    this._state.update((s) => ({ ...s, isLoading: true }));

    const currentState = this._conversationState();
    const context: LealbotHandlerContext = {
      tenantId: this._tenantId(),
      sessionId: this._state().sessionId,
      customer: this._state().customer,
      cart: this._state().cart,
      appliedCoupon: this._state().appliedCoupon,
      redeemedCoupon: this._state().redeemedCoupon,
      subtotal: this._state().subtotal,
      discount: this._state().discount,
      total: this._state().total,
      currentState: currentState,
      tempRegistration: this._tempRegistration()
    };

    // Encontrar el handler correspondiente
    const activeHandler = this.handlers.find((h) => h.canHandle(currentState)) || this.handlers[3]; // Default: CatalogFlowHandler

    activeHandler.handle(trimmed, context).subscribe({
      next: (result) => {
        this._state.update((s) => ({ ...s, isLoading: false }));

        if (result.botMessage) {
          this.addBotMessage(result.botMessage);
        }
        if (result.nextState) {
          this._conversationState.set(result.nextState);
        }
        if (result.quickReplies) {
          this._quickReplies.set(result.quickReplies);
        }
        if (result.inputType !== undefined) {
          this._inputType.set(result.inputType);
        }
        if (result.inputPlaceholder) {
          this._inputPlaceholder.set(result.inputPlaceholder);
        }
        if (result.updatedCustomer !== undefined) {
          this._state.update((s) => ({ ...s, customer: result.updatedCustomer || null }));
        }
        if (result.updatedTempRegistration !== undefined) {
          this._tempRegistration.set(result.updatedTempRegistration);
        }
        if (result.updatedAppliedCoupon !== undefined) {
          this._state.update((s) => ({ ...s, appliedCoupon: result.updatedAppliedCoupon || null }));
          this.recalculateTotals();
        }
        if (result.updatedCart !== undefined) {
          this._state.update((s) => ({ ...s, cart: result.updatedCart || [] }));
          this.recalculateTotals();
        }
      },
      error: (err) => {
        console.error('[LealbotFacade] Error en handler:', err);
        this._state.update((s) => ({ ...s, isLoading: false }));
        this.addBotMessage('Disculpa, ocurrió un error temporal. ¿Puedes repetir tu mensaje?');
      }
    });
  }

  public selectQuickReply(chip: DialogChip): void {
    if (chip.disabled) return;
    this.handleUserInput(chip.label || String(chip.value));
  }

  public addToCart(product: any, quantity: number = 1, comments: string = ''): void {
    const updatedCart = this.cartService.addItem(this._state().cart, product, quantity, comments);
    this._state.update((s) => ({ ...s, cart: updatedCart }));
    this.recalculateTotals();

    const pName = product.productName || product.name || product.nombre || 'Producto';
    this.addBotMessage(`Agregado al carrito: ${pName} (${quantity}x) ✅`);
    this._quickReplies.set([
      { label: 'Ver Carrito', value: 'CART' },
      { label: 'Confirmar Pedido', value: 'CONFIRM' },
      { label: 'Seguir Viendo Menú', value: 'MENU' }
    ]);
  }

  public removeFromCart(productId: number): void {
    const updatedCart = this.cartService.removeItem(this._state().cart, productId);
    this._state.update((s) => ({ ...s, cart: updatedCart }));
    this.recalculateTotals();
  }

  public clearCart(): void {
    this._state.update((s) => ({ ...s, cart: [] }));
    this.recalculateTotals();
  }

  private recalculateTotals(): void {
    const state = this._state();
    const result = this.cartService.calculateTotals(state.cart, state.appliedCoupon, state.redeemedCoupon);
    this._state.update((s) => ({
      ...s,
      subtotal: result.subtotal,
      discount: result.discount,
      total: result.total
    }));
  }

  public loadMenu(tenantId: number): void {
    this.productsMenuService.getProductsByTenantId(tenantId).subscribe({
      next: (resp: any) => {
        const rawProducts = resp?.object || resp || [];
        const groups: { [key: string]: any[] } = {};

        if (Array.isArray(rawProducts)) {
          rawProducts.forEach((p: any) => {
            const cat = p.categoryName || p.categoria || 'General';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
          });
        }

        const categories = Object.keys(groups).map((name) => ({
          name,
          products: groups[name]
        }));

        this._menuCategories.set(categories);
        if (categories.length > 0) {
          this._selectedCategory.set(categories[0].name);
        }
      },
      error: (err: any) => console.warn('[LealbotFacade] Error al cargar menú:', err)
    });
  }

  public selectCategory(catName: string): void {
    this._selectedCategory.set(catName);
  }

  public abandonSession(): void {
    const sId = this._state().sessionId;
    if (sId && this._conversationState() !== ConversationState.ORDER_CONFIRMED) {
      this.lealbotService.abandonSession(sId).subscribe({
        error: () => {}
      });
    }
  }
}
