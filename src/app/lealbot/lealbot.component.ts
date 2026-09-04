import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

// Services && Models
import { LealbotService } from './services/lealbot.service';
import { ProductsMenuService } from '../services/products-menu.service';
import {
  LealboState,
  ConversationState,
  ChatMessageUI,
  Customer,
  CartItem,
  CouponValidationRequest,
  CouponValidationResponse,
  CouponValidationData,
  RedeemCouponRequest,
  RedeemCouponResponse,
  OrderProductRequest,
  Coupon,
  ValidateCustomerRequest,
  CreateOrderRequest,
  OrderItem,
  DialogChip,
  RegisterCustomerRequest
} from './models/lealbot.models';
import { LEALBOT_MESSAGES, MESSAGE_HELPERS } from './lealbot-messages';

@Component({
  selector: 'app-lealbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ButtonModule,
    CheckboxModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TextareaModule,
    ProgressSpinnerModule,
    TooltipModule
  ],
  templateUrl: './lealbot.component.html',
  styleUrls: ['./lealbot.component.scss']
})
export class LealbotComponent implements OnInit, AfterViewChecked, OnDestroy {
  @Input() tenantId: number = 1; // Se debe pasar como input desde el padre
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  // Estado del componente
  state: LealboState = {
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

  // Control de conversación
  conversationState: ConversationState = ConversationState.INITIAL;
  currentQuickReplies: DialogChip[] = [];
  userInput: string = '';
  isScrollingToBottom = false;
  shouldScroll = false;

  // Para controlar la forma de entrada del usuario
  currentInputType: 'TEXT' | 'EMAIL' | 'PHONE' | 'TEXTAREA' | 'CONTACT' | 'DATE' | null = null;
  inputPlaceholder: string = '';

  // Datos temporales de registro
  private tempRegistrationName: string = '';
  private tempRegistrationEmail: string = '';
  private tempRegistrationPhone: string = '';
  private tempRegistrationGender: string = '';
  private tempRegistrationBirthDate: string = '';
  private initialContactType: 'email' | 'phone' | null = null;

  // Menú de productos
  menuCategories: { name: string; products: any[] }[] = [];
  selectedCategory: string | null = null;

  // Configuración de ingredientes del último producto seleccionado
  ingredientConfigVisible = false;
  configProduct: any = null;
  configModificables: any[] = [];
  configAdicionales: any[] = [];
  configExcludedIds: Set<number> = new Set();
  configAdditionalIds: Set<number> = new Set();

  // Cleanup
  private destroy$ = new Subject<void>();

  // ===== Arrastre libre del chatbot (mover con el mouse) =====
  private dragElement: HTMLElement | null = null;
  private dragDownX = 0;
  private dragDownY = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private dragMoved = false;
  private dragShouldBlockClick = false;
  // Posición elegida por el usuario (px desde arriba/izquierda). -1 = usar la posición CSS por defecto.
  private posChatX = -1;
  private posChatY = -1;
  private readonly boundPointerDown = this.onChatPointerDown.bind(this);
  private readonly boundPointerMove = this.onChatPointerMove.bind(this);
  private readonly boundPointerUp = this.onChatPointerUp.bind(this);
  private readonly boundBlockClick = this.onChatBlockClick.bind(this);

  constructor(
    private lealbotService: LealbotService,
    private productsMenuService: ProductsMenuService
  ) {}

  ngOnInit(): void {
    this.initializeSession();
    this.loadMenu();
    this.enableFreeDrag();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    if (this.state.sessionId && this.conversationState !== ConversationState.ORDER_CONFIRMED) {
      this.abandonSession();
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.disableFreeDrag();
  }

  /**
   * ====== ARRASTRE LIBRE DEL CHATBOT ======
   * Los contenedores marcados con [data-drag] en el HTML pueden moverse a
   * cualquier parte de la ventana arrastrándolos con el mouse.
   */
  private enableFreeDrag(): void {
    document.addEventListener('pointerdown', this.boundPointerDown, true);
  }

  private disableFreeDrag(): void {
    document.removeEventListener('pointerdown', this.boundPointerDown, true);
    this.finishChatDrag();
  }

  private onChatPointerDown(ev: PointerEvent): void {
    const target = ev.target as HTMLElement | null;
    if (!target || typeof target.closest !== 'function') {
      return;
    }
    // Solo elementos marcados como arrastrables
    const contenedor = target.closest('[data-drag]') as HTMLElement | null;
    if (!contenedor) {
      return;
    }
    // NO iniciar el arrastre desde zonas donde se escribe o se hace scroll.
    // Nota: NO llamamos preventDefault aquí, para que un clic simple siempre
    // dispare su evento click (abrir/cerrar chat) sin problemas.
    if (target.closest(
      'input, textarea, select, .lealbot-messages, .lealbot-quick-replies, ' +
      '.lealbot-ingredient-config'
    )) {
      return;
    }
    if (ev.button !== 0) { // solo botón izquierdo
      return;
    }

    const rect = contenedor.getBoundingClientRect();
    this.dragElement = contenedor;
    this.dragDownX = ev.clientX;
    this.dragDownY = ev.clientY;
    this.dragOffsetX = ev.clientX - rect.left;
    this.dragOffsetY = ev.clientY - rect.top;
    this.dragMoved = false;
    this.dragShouldBlockClick = false;
    contenedor.classList.add('lealbot-dragging');

    document.addEventListener('pointermove', this.boundPointerMove, true);
    document.addEventListener('pointerup', this.boundPointerUp, true);
    document.addEventListener('click', this.boundBlockClick, true);
  }

  private onChatPointerMove(ev: PointerEvent): void {
    const contenedor = this.dragElement;
    if (!contenedor) {
      return;
    }
    const dx = ev.clientX - this.dragDownX;
    const dy = ev.clientY - this.dragDownY;
    if (!this.dragMoved) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) {
        return; // todavía no hay movimiento: se tratará como un clic
      }
      this.dragMoved = true;
      document.body.classList.add('lealbot-grabbing');
    }
    // Solo a partir de aquí evitamos comportamientos por defecto (selección/scroll)
    if (ev.cancelable) {
      ev.preventDefault();
    }

    const maxX = Math.max(0, window.innerWidth - contenedor.offsetWidth - 8);
    const maxY = Math.max(0, window.innerHeight - contenedor.offsetHeight - 8);
    const x = Math.min(Math.max(0, ev.clientX - this.dragOffsetX), maxX);
    const y = Math.min(Math.max(0, ev.clientY - this.dragOffsetY), maxY);

    // Convertir de bottom/right (fijo) a top/left (libre)
    contenedor.style.right = 'auto';
    contenedor.style.bottom = 'auto';
    contenedor.style.left = x + 'px';
    contenedor.style.top = y + 'px';

    // Guardar la posición elegida para que se mantenga al abrir/cerrar el chat
    this.posChatX = x;
    this.posChatY = y;
  }

  private onChatPointerUp(ev: PointerEvent): void {
    this.dragShouldBlockClick = this.dragMoved;
    this.endChatDrag(); // quita move/up; el bloqueo de click se quita después del click
  }

  private onChatBlockClick(ev: Event): void {
    // Si hubo arrastre real, cancelar el click que generaría (abrir/cerrar chat).
    if (this.dragShouldBlockClick) {
      ev.preventDefault();
      ev.stopPropagation();
      this.dragShouldBlockClick = false;
      document.removeEventListener('click', this.boundBlockClick, true);
    }
  }

  private endChatDrag(): void {
    document.removeEventListener('pointermove', this.boundPointerMove, true);
    document.removeEventListener('pointerup', this.boundPointerUp, true);
    if (this.dragElement) {
      this.dragElement.classList.remove('lealbot-dragging');
      this.dragElement = null;
    }
    document.body.classList.remove('lealbot-grabbing');
    // El click del navegador llega justo después del pointerup. Dejamos el
    // bloqueador activo un instante más; si no hubo click, se limpia solo.
    window.setTimeout(() => {
      if (this.dragShouldBlockClick) {
        this.dragShouldBlockClick = false;
        document.removeEventListener('click', this.boundBlockClick, true);
      }
    }, 200);
  }

  private finishChatDrag(): void {
    this.dragShouldBlockClick = false;
    document.removeEventListener('pointermove', this.boundPointerMove, true);
    document.removeEventListener('pointerup', this.boundPointerUp, true);
    document.removeEventListener('click', this.boundBlockClick, true);
    if (this.dragElement) {
      this.dragElement.classList.remove('lealbot-dragging');
      this.dragElement = null;
    }
    document.body.classList.remove('lealbot-grabbing');
  }

  /**
   * ============ CICLO DE VIDA ============
   */

  private initializeSession(): void {
    // Generar sessionId único
    this.state.sessionId = this.lealbotService.generateSessionId();
    console.log('🚀 Sesión iniciada:', this.state.sessionId);
  }

  toggleChat(): void {
    this.state.isOpen = !this.state.isOpen;
    if (this.state.isOpen && this.state.messages.length === 0) {
      this.sendBotMessage(LEALBOT_MESSAGES.GREETING_INITIAL.text);
      this.currentQuickReplies = LEALBOT_MESSAGES.GREETING_INITIAL.quick_reply || [];
    }
    this.shouldScroll = true;
    // Aplicar la posición guardada ANTES de que el navegador pinte, para que el
    // chat abra ya en su lugar y NO se vea primero en la posición por defecto
    // (evita el "flash"/brinco de derecha a su posición).
    requestAnimationFrame(() => this.aplicarPosicionGuardada());
  }

  /**
   * Aplica la posición elegida por el usuario a los elementos del chatbot
   * (botón cerrado y ventana). Antes de aplicar se "acopla" cada elemento a la
   * ventana del navegador: nunca queda parcialmente fuera de la pantalla.
   */
  private aplicarPosicionGuardada(): void {
    if (this.posChatX < 0 || this.posChatY < 0) {
      return; // todavía no se ha arrastrado: se usa la posición CSS por defecto
    }
    const selectores = '.lealbot-floating-container, .lealbot-chat-window';
    document.querySelectorAll(selectores).forEach(el => {
      const nodo = el as HTMLElement;
      if (!nodo || typeof nodo.style === 'undefined' || !nodo.offsetWidth) {
        return;
      }
      const punto = this.puntoAcoplado(nodo);
      nodo.style.right = 'auto';
      nodo.style.bottom = 'auto';
      nodo.style.left = punto.x + 'px';
      nodo.style.top = punto.y + 'px';
    });
  }

  /**
   * Ajusta una posición (top-left) para que el elemento quepa COMPLETO dentro
   * del área visible de la página.
   */
  private puntoAcoplado(nodo: HTMLElement): { x: number; y: number } {
    const margen = 8;
    const w = nodo.offsetWidth;
    const h = nodo.offsetHeight;
    const maxX = Math.max(margen, window.innerWidth - w - margen);
    const maxY = Math.max(margen, window.innerHeight - h - margen);
    return {
      x: Math.min(Math.max(margen, this.posChatX), maxX),
      y: Math.min(Math.max(margen, this.posChatY), maxY)
    };
  }

  /**
   * Reiniciar conversación completa
   */
  resetChat(): void {
    // Abandonar sesión actual si existe
    if (this.state.sessionId && this.conversationState !== ConversationState.ORDER_CONFIRMED) {
      this.abandonSession();
    }

    // Reiniciar todo el estado
    this.state = {
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
      isOpen: true, // Mantener el chat abierto
      availableCoupons: []
    };

    // Reiniciar estado de conversación
    this.conversationState = ConversationState.INITIAL;
    this.currentQuickReplies = [];
    this.userInput = '';
    this.currentInputType = null;
    this.inputPlaceholder = '';

    // Inicializar nueva sesión
    this.initializeSession();

    // Enviar mensaje de bienvenida
    this.sendBotMessage(LEALBOT_MESSAGES.GREETING_INITIAL.text);
    this.currentQuickReplies = LEALBOT_MESSAGES.GREETING_INITIAL.quick_reply || [];
    this.shouldScroll = true;

    console.log('♻️ Chat reiniciado');
  }

  /**
   * ============ MANEJO DE MENSAJES ============
   */

  sendMessage(): void {
    if (!this.userInput.trim()) return;

    const userMessage = this.userInput.trim();

    // Agregar mensaje del usuario al chat
    this.addMessageToChat('USER', userMessage);
    this.userInput = '';
    this.shouldScroll = true;

    // Procesar el mensaje
    this.processUserMessage(userMessage);
  }

  private processUserMessage(message: string): void {
    const contactType = this.lealbotService.detectContactType(message);

    switch (this.conversationState) {
      case ConversationState.INITIAL:
        this.handleInitialState(message);
        break;

      case ConversationState.WAITING_CONTACT:
        if (contactType) {
          this.validateCustomer(message, contactType);
        } else {
          this.sendBotMessage(LEALBOT_MESSAGES.ERROR_INVALID_CONTACT.text);
          this.shouldScroll = true;
        }
        break;

      case ConversationState.CUSTOMER_NEW:
        if (this.currentInputType === 'TEXT') {
          this.handleNewCustomerName(message);
        } else if (this.currentInputType === 'EMAIL') {
          this.handleNewCustomerEmail(message);
        } else if (this.currentInputType === 'PHONE') {
          this.handleNewCustomerPhone(message);
        } else if (this.currentInputType === 'DATE') {
          this.handleNewCustomerBirthDate(message);
        }
        break;

      case ConversationState.BROWSING:
        // Aquí se manejarían selecciones de categoría
        this.handleCategorySelection(message);
        break;

      case ConversationState.PRODUCT_SELECTED:
        if (this.currentInputType === 'TEXT') {
          this.handleProductSelection(message);
        } else if (this.currentInputType === 'TEXTAREA') {
          this.handleProductComments(message);
        }
        break;

      case ConversationState.COUPON_VALIDATION:
        this.validateCoupon(message);
        break;

      case ConversationState.CROSS_SELL:
        this.handleCrossSellInput(message);
        break;

      default:
        this.sendBotMessage(LEALBOT_MESSAGES.EMPTY_STATE.text);
        this.currentQuickReplies = LEALBOT_MESSAGES.EMPTY_STATE.quick_reply || [];
        this.shouldScroll = true;
    }
  }

  handleQuickReply(value: any): void {
    // Agregar respuesta rápida como si fuera un mensaje del usuario
    const chip = this.currentQuickReplies.find(c => c.value === value);
    if (chip) {
      this.addMessageToChat('USER', chip.label);
      this.shouldScroll = true;
    }

    // Manejar selección de producto por quick reply
    if (typeof value === 'string' && value.startsWith('product_')) {
      const productIndex = parseInt(value.replace('product_', ''));
      this.handleProductSelectionByIndex(productIndex);
      return;
    }

    // Manejar adición de producto de venta cruzada por quick reply
    if (typeof value === 'string' && value.startsWith('add_cross_')) {
      const productId = parseInt(value.replace('add_cross_', ''));
      this.addCrossSellingProductById(productId);
      return;
    }

    // Manejar selección de categoría
    if (typeof value === 'string' && value.startsWith('category_')) {
      const categoryName = value.replace('category_', '').replace(/_/g, ' ');
      this.handleCategorySelectionByValue(categoryName);
      return;
    }

    // Manejar selección de cupón
    if (typeof value === 'string' && value.startsWith('coupon_')) {
      const couponCode = value.replace('coupon_', '');
      this.handleCouponSelection(couponCode);
      return;
    }

    switch (value) {
      case 'start':
        this.startOrder();
        break;

      case 'close':
        this.closeChat();
        break;

      case 'repeat_last':
        this.repeatLastOrder();
        break;

      case 'browse_menu':
        this.browseMenu();
        break;

      case 'no_comments':
        this.finalizeProductSelection();
        break;

      case 'add_more':
        this.browseMenu();
        break;

      case 'accept_suggestion':
        // Se maneja en el contexto de sugerencias
        this.browseMenu();
        break;

      case 'skip_suggestion':
        this.handleSkipSuggestion();
        break;

      case 'no_coupon':
        this.skipCouponSelection();
        break;

      case 'view_coupons':
        this.showAvailableCoupons();
        break;

      case 'skip_email':
        this.handleNewCustomerEmail('skip_email');
        break;

      case 'skip_phone':
        this.handleNewCustomerPhone('skip_phone');
        break;

      case 'skip_birthdate':
        this.handleNewCustomerBirthDate('skip_birthdate');
        break;

      case 'skip_gender':
      case 'Hombre':
      case 'Mujer':
      case 'Otro':
        this.handleNewCustomerGender(value);
        break;

      case 'confirm_order':
        this.confirmOrder();
        break;

      case 'confirm_order_no_coupon':
        this.state.appliedCoupon = null;
        this.state.redeemedCoupon = null;
        this.createOrder();
        break;

      case 'modify_order':
        this.browseMenu();
        break;

      case 'cancel_order':
        this.closeChat();
        break;

      case 'try_another_coupon':
        this.askForCoupon();
        break;

      case 'skip_coupon':
        this.reviewOrder();
        break;

      // Estados de error
      case 'retry':
      case 'retry_order':
        this.startOrder();
        break;
    }
  }

  /**
   * ============ FLUJOS DEL CHATBOT ============
   */

  private handleInitialState(message: string): void {
    if (message.toLowerCase().includes('si') || message.toLowerCase().includes('hola')) {
      this.startOrder();
    } else {
      this.closeChat();
    }
  }

  private startOrder(): void {
    this.conversationState = ConversationState.WAITING_CONTACT;
    this.sendBotMessage(LEALBOT_MESSAGES.ASKING_CONTACT.text);
    this.currentInputType = 'CONTACT';
    this.inputPlaceholder = LEALBOT_MESSAGES.ASKING_CONTACT.placeholder;
    this.currentQuickReplies = LEALBOT_MESSAGES.ASKING_CONTACT.quick_reply || [];
    this.shouldScroll = true;
  }

  private validateCustomer(contact: string, type: 'email' | 'phone'): void {
    this.state.isLoading = true;
    this.sendBotMessage(LEALBOT_MESSAGES.LOADING_CUSTOMER.text);

    // Guardar el tipo de contacto inicial para registro posterior
    this.initialContactType = type;
    if (type === 'email') {
      this.tempRegistrationEmail = contact;
    } else {
      this.tempRegistrationPhone = contact;
    }

    const request: ValidateCustomerRequest = {
      tenantId: this.tenantId
    };

    if (type === 'email') {
      request.email = contact;
    } else {
      request.phone = contact;
    }

    this.lealbotService
      .validateCustomer(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.state.isLoading = false;
          if (response.object && response.object.exists && response.object.customer) {
            this.handleExistingCustomer(
              response.object.customer,
              response.object.lastOrderProducts,
              response.object.activeCoupons
            );
          } else {
            this.handleNewCustomer();
          }
        },
        error: (error) => {
          this.state.isLoading = false;
          this.handleApiError(error);
        }
      });
  }

  private handleExistingCustomer(customer: Customer, lastProducts: any[] | null, activeCoupons: Coupon[] | null): void {
    this.state.customer = customer;
    this.state.availableCoupons = activeCoupons || [];
    this.conversationState = ConversationState.CUSTOMER_IDENTIFIED;

    // Saludar
    this.sendBotMessage(LEALBOT_MESSAGES.GREETING_RETURNING.text(customer.name));

    if (lastProducts && lastProducts.length > 0) {
      // Ofrecer repetir último pedido
      const firstProduct = lastProducts[0];
      setTimeout(() => {
        this.sendBotMessage(
          LEALBOT_MESSAGES.ASKING_REPEAT_ORDER.text(customer.name, firstProduct.productName)
        );
        this.currentQuickReplies = LEALBOT_MESSAGES.ASKING_REPEAT_ORDER.quick_reply || [];
        this.shouldScroll = true;
      }, 300);
    } else {
      setTimeout(() => {
        this.browseMenu();
      }, 300);
    }
  }

  private handleNewCustomer(): void {
    this.conversationState = ConversationState.CUSTOMER_NEW;
    this.sendBotMessage(LEALBOT_MESSAGES.GREETING_NEW.text);

    setTimeout(() => {
      this.askNewCustomerName();
    }, 500);
  }

  private askNewCustomerName(): void {
    this.sendBotMessage(LEALBOT_MESSAGES.ASKING_NAME.text);
    this.currentInputType = 'TEXT';
    this.inputPlaceholder = LEALBOT_MESSAGES.ASKING_NAME.placeholder;
    this.currentQuickReplies = [];
    this.shouldScroll = true;
  }

  private handleNewCustomerName(name: string): void {
    this.tempRegistrationName = name;
    this.state.customer = {
      id: 0, // Se asignará al registrar
      name: name,
      email: this.tempRegistrationEmail,
      phone: this.tempRegistrationPhone,
      active: true,
      acceptedPromotions: true
    };

    // Pedir el contacto complementario (email si dio phone, phone si dio email)
    // Solo preguntar si aún no lo tenemos
    if (this.initialContactType === 'phone' && !this.tempRegistrationEmail) {
      this.askNewCustomerEmail();
    } else if (this.initialContactType === 'email' && !this.tempRegistrationPhone) {
      this.askNewCustomerPhone();
    } else {
      // Si ya tenemos ambos contactos, ir directo a fecha de nacimiento
      this.askNewCustomerBirthDate();
    }
  }

  private askNewCustomerEmail(): void {
    this.sendBotMessage(LEALBOT_MESSAGES.ASKING_EMAIL.text);
    this.currentInputType = 'EMAIL';
    this.inputPlaceholder = LEALBOT_MESSAGES.ASKING_EMAIL.placeholder;
    this.currentQuickReplies = LEALBOT_MESSAGES.ASKING_EMAIL.quick_reply || [];
    this.shouldScroll = true;
  }

  private handleNewCustomerEmail(email: string): void {
    if (email === 'skip_email') {
      this.tempRegistrationEmail = '';
      this.askNewCustomerBirthDate();
      return;
    }

    if (!this.lealbotService.isValidEmail(email)) {
      this.sendBotMessage(LEALBOT_MESSAGES.ERROR_INVALID_EMAIL.text);
      this.shouldScroll = true;
      return;
    }

    this.tempRegistrationEmail = email;
    if (this.state.customer) {
      this.state.customer.email = email;
    }

    // Siguiente paso: fecha de nacimiento
    this.askNewCustomerBirthDate();
  }

  private askNewCustomerPhone(): void {
    this.sendBotMessage(LEALBOT_MESSAGES.ASKING_PHONE.text);
    this.currentInputType = 'PHONE';
    this.inputPlaceholder = LEALBOT_MESSAGES.ASKING_PHONE.placeholder;
    this.currentQuickReplies = LEALBOT_MESSAGES.ASKING_PHONE.quick_reply || [];
    this.shouldScroll = true;
  }

  private handleNewCustomerPhone(phone: string): void {
    if (phone === 'skip_phone') {
      this.tempRegistrationPhone = '';
      this.askNewCustomerBirthDate();
      return;
    }

    this.tempRegistrationPhone = phone;
    if (this.state.customer) {
      this.state.customer.phone = phone;
    }

    // Siguiente paso: fecha de nacimiento
    this.askNewCustomerBirthDate();
  }

  private askNewCustomerBirthDate(): void {
    this.sendBotMessage(LEALBOT_MESSAGES.ASKING_BIRTHDATE.text);
    this.currentInputType = 'DATE';
    this.inputPlaceholder = LEALBOT_MESSAGES.ASKING_BIRTHDATE.placeholder;
    this.currentQuickReplies = LEALBOT_MESSAGES.ASKING_BIRTHDATE.quick_reply || [];
    this.shouldScroll = true;
  }

  private handleNewCustomerBirthDate(birthDate: string): void {
    if (birthDate === 'skip_birthdate') {
      this.tempRegistrationBirthDate = '';
      this.askNewCustomerGender();
      return;
    }

    // Validación simple de formato DD/MM/AAAA
    const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (!datePattern.test(birthDate)) {
      this.sendBotMessage('Por favor, usa el formato DD/MM/AAAA (ejemplo: 15/03/1990)');
      this.shouldScroll = true;
      return;
    }

    this.tempRegistrationBirthDate = birthDate;
    if (this.state.customer) {
      this.state.customer.birthDate = birthDate;
    }

    // Siguiente paso: género
    this.askNewCustomerGender();
  }

  private askNewCustomerGender(): void {
    this.sendBotMessage(LEALBOT_MESSAGES.ASKING_GENDER.text);
    this.currentInputType = null; // Solo quick replies, no input de texto
    this.inputPlaceholder = '';
    this.currentQuickReplies = LEALBOT_MESSAGES.ASKING_GENDER.quick_reply || [];
    this.shouldScroll = true;
  }

  private handleNewCustomerGender(gender: string): void {
    if (gender === 'skip_gender') {
      this.tempRegistrationGender = '';
    } else {
      this.tempRegistrationGender = gender;
      if (this.state.customer) {
        this.state.customer.gender = gender;
      }
    }

    // Registrar el cliente con todos los datos recopilados
    this.registerNewCustomer();
  }

  private registerNewCustomer(): void {
    this.state.isLoading = true;
    this.sendBotMessage(LEALBOT_MESSAGES.LOADING_CUSTOMER.text);

    // Convertir fecha de DD/MM/AAAA a formato ISO YYYY-MM-DD
    let birthDateISO: string | undefined = undefined;
    if (this.tempRegistrationBirthDate) {
      birthDateISO = this.convertToISODate(this.tempRegistrationBirthDate);
    }

    const request: RegisterCustomerRequest = {
      tenantId: this.tenantId,
      name: this.tempRegistrationName,
      email: this.tempRegistrationEmail || '',
      phone: this.tempRegistrationPhone || undefined,
      gender: this.tempRegistrationGender || undefined,
      birthDate: birthDateISO,
      acceptedPromotions: true
    };

    this.lealbotService
      .registerCustomer(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.state.isLoading = false;
          if (response.object) {
            this.state.customer = response.object;
            this.sendBotMessage(LEALBOT_MESSAGES.REGISTERED_SUCCESS.text(this.tempRegistrationName));

            // Limpiar datos temporales
            this.clearTempRegistrationData();

            setTimeout(() => {
              this.browseMenu();
            }, 500);
          }
        },
        error: (error) => {
          this.state.isLoading = false;
          this.handleApiError(error);
        }
      });
  }

  private clearTempRegistrationData(): void {
    this.tempRegistrationName = '';
    this.tempRegistrationEmail = '';
    this.tempRegistrationPhone = '';
    this.tempRegistrationGender = '';
    this.tempRegistrationBirthDate = '';
    this.initialContactType = null;
  }

  /**
   * Convierte una fecha de formato DD/MM/AAAA a formato ISO YYYY-MM-DD
   * @param dateStr Fecha en formato DD/MM/AAAA
   * @returns Fecha en formato YYYY-MM-DD
   */
  private convertToISODate(dateStr: string): string {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;

    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];

    return `${year}-${month}-${day}`;
  }

  private repeatLastOrder(): void {
    if (!this.state.customer) return;

    this.state.isLoading = true;
    this.sendBotMessage(LEALBOT_MESSAGES.LOADING_LAST_PRODUCTS.text);

    this.lealbotService
      .getLastOrder(this.state.customer.id, this.tenantId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.state.isLoading = false;
          if (response.object && response.object.length > 0) {
            // Convertir OrderProducts a CartItems
            this.state.cart = response.object.map(p => ({
              productId: p.productId,
              productName: p.productName,
              price: p.price,
              imageUrl: p.imageUrl,
              quantity: p.quantity || 1,
              comments: p.comments
            }));

            // Mostrar resumen
            this.sendBotMessage('✅ Añadí lo de siempre a tu carrito.');
            this.sendBotMessage('¿Algo más? ¿Un postre? ¿Una bebida?');
            this.currentQuickReplies = [
              { label: '✅ Confirmar', value: 'confirm_order' },
              { label: '➕ Agregar más', value: 'browse_menu' }
            ];
            this.shouldScroll = true;
          }
        },
        error: (error) => {
          this.state.isLoading = false;
          this.handleApiError(error);
        }
      });
  }

  private browseMenu(): void {
    this.conversationState = ConversationState.BROWSING;
    this.sendBotMessage(LEALBOT_MESSAGES.BROWSING_MENU.text);

    if (this.menuCategories.length === 0) {
      this.sendBotMessage('⏳ Cargando menú...');
      this.loadMenu().then(() => {
        this.showCategoryOptions();
      });
    } else {
      this.showCategoryOptions();
    }
  }

  private showCategoryOptions(): void {
    if (this.menuCategories.length === 0) {
      this.sendBotMessage('⚠️ Lo siento, no hay productos disponibles en este momento.');
      this.currentQuickReplies = [];
      this.shouldScroll = true;
      return;
    }

    // Crear chips con las categorías disponibles
    this.currentQuickReplies = this.menuCategories.map(cat => ({
      label: `🍽️ ${cat.name}`,
      value: `category_${cat.name.toLowerCase().replace(/\s+/g, '_')}`
    }));
    this.shouldScroll = true;
  }

  private async loadMenu(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.productsMenuService.getProductsByTenantId(this.tenantId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            console.log('🍔 Productos cargados:', response);
            if (response.object && Array.isArray(response.object)) {
              this.menuCategories = this.mapProductsToCategories(response.object);
              console.log('🏷️ Categorías procesadas:', this.menuCategories);
            }
            resolve();
          },
          error: (error) => {
            console.error('❌ Error al cargar menú:', error);
            this.menuCategories = [];
            resolve(); // Resolvemos de todas formas para no bloquear el flujo
          }
        });
    });
  }

  private mapProductsToCategories(products: any[]): { name: string; products: any[] }[] {
    const categoriesMap: { [key: string]: any[] } = {};

    products.forEach(product => {
      // Filtrar productos o categorías inactivas
      if (product.isActive === false || product.categoryIsActive === false) {
        return;
      }

      const categoryName = product.categoryName || 'Sin categoría';
      if (!categoriesMap[categoryName]) {
        categoriesMap[categoryName] = [];
      }

      categoriesMap[categoryName].push({
        id: product.id,
        productId: product.id, // Para compatibilidad
        name: product.name,
        productName: product.name, // Para compatibilidad
        description: product.description || '',
        price: product.price || 0,
        imageUrl: product.imageUrl || '',
        categoryName: categoryName,
        stock: product.stock,
        crossSellingProducts: product.crossSellingProducts || [],
        recipes: product.recipes || [],
        additionals: product.additionals || []
      });
    });

    // Convertir a array de categorías
    return Object.keys(categoriesMap)
      .filter(key => categoriesMap[key].length > 0)
      .map(key => ({
        name: key,
        products: categoriesMap[key]
      }));
  }

  private handleCategorySelection(message: string): void {
    // Limpiar el mensaje (remover emojis y espacios extra)
    const cleanMessage = message.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().toLowerCase();
    this.handleCategorySelectionByValue(cleanMessage);
  }

  private handleCategorySelectionByValue(categoryValue: string): void {
    const searchTerm = categoryValue.toLowerCase().trim();

    console.log('🔍 Buscando categoría:', searchTerm);
    console.log('📂 Categorías disponibles:', this.menuCategories.map(c => c.name));

    // Buscar la categoría que coincida
    const category = this.menuCategories.find(cat =>
      cat.name.toLowerCase() === searchTerm ||
      cat.name.toLowerCase().includes(searchTerm) ||
      searchTerm.includes(cat.name.toLowerCase())
    );

    if (!category || !category.products || category.products.length === 0) {
      this.sendBotMessage(`⚠️ No encontré productos en esta categoría.`);
      this.sendBotMessage(`Buscaste: "${categoryValue}"`);
      this.browseMenu();
      return;
    }

    this.selectedCategory = category.name;
    this.sendBotMessage(`🍽️ ${category.name} (${category.products.length} productos):`);
    this.sendBotMessage('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

    // Mostrar todos los productos o hasta 20 si son muchos
    const maxToShow = 20;
    const productsToShow = category.products.slice(0, maxToShow);
    productsToShow.forEach((product, index) => {
      const agotado = product.stock !== undefined && product.stock !== null && product.stock <= 0;
      this.sendBotMessage(`${index + 1}. ${product.name} - $${product.price}${agotado ? ' ❌ (Agotado)' : ''}`);
    });

    if (category.products.length > maxToShow) {
      this.sendBotMessage(`... y ${category.products.length - maxToShow} productos más`);
    }

    this.sendBotMessage('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

    // Preguntar qué producto quiere
    setTimeout(() => {
      this.sendBotMessage('👆 Escribe el número o nombre del producto que deseas agregar.');
      this.conversationState = ConversationState.PRODUCT_SELECTED;
      this.currentInputType = 'TEXT';
      this.inputPlaceholder = 'Ej: 1 o Huevos rancheros';

      // Si hay pocos productos (10 o menos), crear quick replies con números
      if (category.products.length <= 10) {
        this.currentQuickReplies = [
          ...category.products.map((p, index) => ({
            label: `${index + 1}. ${p.name}`,
            value: `product_${index}`
          })),
          { label: '⬅️ Volver', value: 'browse_menu' }
        ];
      } else {
        this.currentQuickReplies = [
          { label: '⬅️ Volver a categorías', value: 'browse_menu' }
        ];
      }
      this.shouldScroll = true;
    }, 300);
  }

  private handleProductSelection(productName: string): void {
    if (!this.selectedCategory) {
      this.sendBotMessage('⚠️ Por favor selecciona primero una categoría.');
      this.browseMenu();
      return;
    }

    // Buscar la categoría seleccionada
    const category = this.menuCategories.find(cat => cat.name === this.selectedCategory);
    if (!category) {
      this.sendBotMessage('⚠️ No encontré la categoría seleccionada.');
      this.browseMenu();
      return;
    }

    // Verificar si es un número
    const productNumber = parseInt(productName.trim());
    if (!isNaN(productNumber) && productNumber > 0 && productNumber <= category.products.length) {
      this.handleProductSelectionByIndex(productNumber - 1);
      return;
    }

    // Buscar el producto por nombre (búsqueda flexible)
    const searchTerm = productName.toLowerCase().trim();
    const product = category.products.find(p =>
      p.name.toLowerCase().includes(searchTerm) ||
      searchTerm.includes(p.name.toLowerCase())
    );

    if (!product) {
      this.sendBotMessage(`❌ No encontré "${productName}" en ${this.selectedCategory}.`);
      this.sendBotMessage('Por favor, intenta con el número o el nombre del producto.');
      this.currentQuickReplies = [
        { label: '⬅️ Volver a categorías', value: 'browse_menu' }
      ];
      this.shouldScroll = true;
      return;
    }

    this.addProductToCart(product);
  }

  private handleProductSelectionByIndex(index: number): void {
    if (!this.selectedCategory) {
      this.sendBotMessage('⚠️ Por favor selecciona primero una categoría.');
      this.browseMenu();
      return;
    }

    const category = this.menuCategories.find(cat => cat.name === this.selectedCategory);
    if (!category || !category.products[index]) {
      this.sendBotMessage('⚠️ Producto no encontrado.');
      this.browseMenu();
      return;
    }

    const product = category.products[index];
    this.addProductToCart(product);
  }

  private addProductToCart(product: any): void {
    // Validar stock disponible (dinámico: platillos con receta)
    const available = product.stock !== undefined && product.stock !== null ? product.stock : null;
    if (available !== null && available <= 0) {
      this.sendBotMessage(`❌ Lo siento, ${product.name} está agotado en este momento.`);
      this.currentQuickReplies = [
        { label: '⬅️ Ver otro producto', value: 'browse_menu' },
        { label: '🛒 Ver mi carrito', value: 'view_cart' }
      ];
      this.shouldScroll = true;
      return;
    }

    const modificables = (product.recipes || []).filter((r: any) => r.modificable);
    const adicionales = product.additionals || [];

    if (modificables.length > 0 || adicionales.length > 0) {
      this.openIngredientConfig(product, modificables, adicionales);
      return;
    }

    this.appendToCart(product, [], [], 0);
  }

  private openIngredientConfig(
    product: any,
    modificables: any[],
    adicionales: any[]
  ): void {
    this.configProduct = product;
    this.configModificables = modificables;
    this.configAdicionales = adicionales;
    // Por defecto los modificables vienen incluidos; el cliente desmarca lo que no quiere
    this.configExcludedIds = new Set();
    this.configAdditionalIds = new Set();
    this.ingredientConfigVisible = true;
    this.shouldScroll = true;
  }

  isExcluded(insumoId: number): boolean {
    return this.configExcludedIds.has(insumoId);
  }

  toggleExcluded(insumoId: number, excluded: boolean): void {
    if (excluded) {
      this.configExcludedIds.add(insumoId);
    } else {
      this.configExcludedIds.delete(insumoId);
    }
  }

  isAdditional(insumoId: number): boolean {
    return this.configAdditionalIds.has(insumoId);
  }

  toggleAdditional(insumoId: number, selected: boolean): void {
    if (selected) {
      this.configAdditionalIds.add(insumoId);
    } else {
      this.configAdditionalIds.delete(insumoId);
    }
  }

  confirmIngredientConfig(): void {
    if (!this.configProduct) return;
    const product = this.configProduct;

    const excludedIds: number[] = Array.from(this.configExcludedIds);
    const additionalIds: number[] = Array.from(this.configAdditionalIds);

    // Sumar el precio de los adicionales seleccionados
    const extra = this.configAdicionales
      .filter(a => this.configAdditionalIds.has(a.insumoId))
      .reduce((sum, a) => sum + (Number(a.precio) || 0), 0);

    this.ingredientConfigVisible = false;
    this.appendToCart(product, excludedIds, additionalIds, extra);
  }

  private appendToCart(product: any, excludedIds: number[], additionalIds: number[], extraPrice: number): void {
    const unitPrice = (Number(product.price) || 0) + extraPrice;
    const configKey = JSON.stringify([excludedIds.sort(), additionalIds.sort()]);

    const existingItem = this.state.cart.find(
      item => item.productId === product.productId && item.configKey === configKey
    );

    // No dejar agregar más de lo disponible
    const available = product.stock !== undefined && product.stock !== null ? product.stock : null;
    if (existingItem) {
      // No dejar agregar más de lo disponible
      if (available !== null && existingItem.quantity + 1 > available) {
        this.sendBotMessage(`⚠️ Solo hay ${available} disponible(s) de ${product.name}.`);
        return;
      }
      existingItem.quantity += 1;
      this.sendBotMessage(`✅ Agregué otro ${product.name} a tu carrito. Llevas ${existingItem.quantity}.`);
    } else {
      this.state.cart.push({
        productId: product.productId,
        productName: product.name,
        price: unitPrice,
        imageUrl: product.imageUrl,
        quantity: 1,
        comments: '',
        excludedIngredientIds: excludedIds,
        additionalIngredientIds: additionalIds,
        configKey
      });

      if (additionalIds.length > 0) {
        this.sendBotMessage(`✅ Agregué ${product.name} a tu carrito por $${unitPrice.toFixed(2)} (incluye adicionales).`);
      } else {
        this.sendBotMessage(`✅ Agregué ${product.name} ($${unitPrice.toFixed(2)}) a tu carrito.`);
      }
    }

    // Actualizar totales del carrito
    this.calculateTotals();

    // Preguntar por comentarios
    setTimeout(() => {
      this.sendBotMessage('¿Algún comentario para este producto? (ej: sin cebolla, bien cocido, etc.)');
      this.currentInputType = 'TEXTAREA';
      this.inputPlaceholder = 'Escribe aquí tus comentarios...';
      this.currentQuickReplies = [
        { label: '✅ Sin comentarios', value: 'no_comments' }
      ];
      // Guardar temporalmente el producto para asignarle los comentarios
      this.state.cart[this.state.cart.length - 1].comments = '';
      this.shouldScroll = true;
    }, 300);
  }

  private handleProductComments(comments: string): void {
    // Asignar comentarios al último producto del carrito
    if (this.state.cart.length > 0) {
      const lastProduct = this.state.cart[this.state.cart.length - 1];
      lastProduct.comments = comments.trim();
      if (comments.trim()) {
        this.sendBotMessage(`📝 Comentario agregado: "${comments}"`);
      }
    }
    this.finalizeProductSelection();
  }

  private finalizeProductSelection(): void {
    let crossProducts: any[] = [];
    let lastProductName = '';

    if (this.state.cart.length > 0) {
      const lastItem = this.state.cart[this.state.cart.length - 1];
      lastProductName = lastItem.productName;
      // Buscar en menuCategories el producto completo para obtener sus crossSellingProducts
      for (const cat of this.menuCategories) {
        const found = cat.products.find(p => p.productId === lastItem.productId);
        if (found) {
          crossProducts = found.crossSellingProducts || [];
          break;
        }
      }
    }

    if (crossProducts && crossProducts.length > 0) {
      // Ofrecer de forma no invasiva y amable
      this.sendBotMessage(`😊 ¡Excelente elección! Para acompañar tu *${lastProductName}*, te sugiero probar:`);
      
      // Mostrar recomendaciones
      crossProducts.slice(0, 3).forEach((p, idx) => {
        this.sendBotMessage(`${idx + 1}. *${p.name}* - $${p.price} (${p.description || p.categoryName || ''})`);
      });

      // Crear las respuestas rápidas correspondientes
      const chips: DialogChip[] = crossProducts.slice(0, 3).map(p => ({
        label: `🥤 Agregar ${p.name} (+$${p.price})`,
        value: `add_cross_${p.id}`
      }));

      chips.push({ label: '➕ Ver menú completo', value: 'add_more' });
      chips.push({ label: '✅ Continuar con mi orden', value: 'skip_coupon' });

      this.currentQuickReplies = chips;
      this.conversationState = ConversationState.CROSS_SELL;
      this.currentInputType = null;
      this.shouldScroll = true;
    } else {
      // Flujo normal sin venta cruzada
      this.sendBotMessage('¿Deseas agregar algo más a tu orden?');
      this.currentQuickReplies = [
        { label: '➕ Agregar más', value: 'add_more' },
        { label: '✅ Continuar con mi orden', value: 'skip_coupon' }
      ];
      this.conversationState = ConversationState.CROSS_SELL;
      this.currentInputType = null;
      this.shouldScroll = true;
    }
  }

  private addCrossSellingProductById(productId: number): void {
    let productToSelect: any = null;
    // Buscar en todas las categorías
    for (const cat of this.menuCategories) {
      const found = cat.products.find(p => p.productId === productId);
      if (found) {
        productToSelect = found;
        break;
      }
    }

    if (productToSelect) {
      this.addProductToCart(productToSelect);
    } else {
      this.sendBotMessage('⚠️ Lo siento, no encontré ese producto en el menú actual.');
      this.finalizeProductSelection();
    }
  }

  private handleCrossSellInput(message: string): void {
    const cleanMsg = message.toLowerCase().trim();
    if (
      cleanMsg.includes('no') ||
      cleanMsg.includes('omitir') ||
      cleanMsg.includes('continuar') ||
      cleanMsg.includes('listo') ||
      cleanMsg.includes('no gracias') ||
      cleanMsg.includes('pagar')
    ) {
      this.reviewOrder();
    } else if (
      cleanMsg.includes('si') ||
      cleanMsg.includes('sí') ||
      cleanMsg.includes('agregar') ||
      cleanMsg.includes('ver') ||
      cleanMsg.includes('menu') ||
      cleanMsg.includes('menú')
    ) {
      this.browseMenu();
    } else {
      // Buscar si coincide con el nombre de un producto sugerido
      let crossProducts: any[] = [];
      if (this.state.cart.length > 0) {
        const lastItem = this.state.cart[this.state.cart.length - 1];
        for (const cat of this.menuCategories) {
          const found = cat.products.find(p => p.productId === lastItem.productId);
          if (found) {
            crossProducts = found.crossSellingProducts || [];
            break;
          }
        }
      }

      const foundProduct = crossProducts.find(p =>
        p.name.toLowerCase().includes(cleanMsg) ||
        cleanMsg.includes(p.name.toLowerCase())
      );

      if (foundProduct) {
        this.addCrossSellingProductById(foundProduct.id);
      } else {
        this.sendBotMessage('¿Deseas agregar alguna de las sugerencias, ver el menú completo o continuar con tu orden?');
        this.shouldScroll = true;
      }
    }
  }

  private handleSkipSuggestion(): void {
    this.conversationState = ConversationState.CROSS_SELL;
    this.browseMenu();
  }

  private askForCoupon(): void {
    this.conversationState = ConversationState.COUPON_VALIDATION;
    this.sendBotMessage(LEALBOT_MESSAGES.ASKING_COUPON.text);
    this.currentInputType = 'TEXT';
    this.inputPlaceholder = LEALBOT_MESSAGES.ASKING_COUPON.placeholder;
    this.currentQuickReplies = LEALBOT_MESSAGES.ASKING_COUPON.quick_reply || [];
    this.shouldScroll = true;
  }

  private validateCoupon(couponCode: string): void {
    this.state.isLoading = true;
    this.sendBotMessage(LEALBOT_MESSAGES.VALIDATING_COUPON.text);

    this.lealbotService
      .validateCoupon({ couponCode, tenantId: this.tenantId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.state.isLoading = false;
          if (response.data && response.data.isValid) {
            // Cupón válido
            this.state.appliedCoupon = response.data;
            this.sendBotMessage(LEALBOT_MESSAGES.COUPON_APPLIED.text(
              response.data.campaignTitle || 'Cupón',
              response.data.description || ''
            ));

            setTimeout(() => {
              this.showOrderSummary();
            }, 500);
          } else if (response.data) {
            this.sendBotMessage(LEALBOT_MESSAGES.COUPON_INVALID.text(response.data.message || 'Cupón inválido'));
            this.currentQuickReplies = LEALBOT_MESSAGES.COUPON_INVALID.quick_reply || [];
            this.shouldScroll = true;
          }
        },
        error: (error) => {
          this.state.isLoading = false;
          this.sendBotMessage(LEALBOT_MESSAGES.COUPON_ERROR.text(error.message));
          this.currentQuickReplies = LEALBOT_MESSAGES.COUPON_ERROR.quick_reply || [];
          this.shouldScroll = true;
        }
      });
  }

  private reviewOrder(): void {
    if (this.state.cart.length === 0) {
      this.sendBotMessage(LEALBOT_MESSAGES.ERROR_EMPTY_CART.text);
      this.currentQuickReplies = LEALBOT_MESSAGES.ERROR_EMPTY_CART.quick_reply || [];
      this.shouldScroll = true;
      return;
    }

    // Si no se ha aplicado un cupón y hay cupones disponibles, preguntar primero
    if (!this.state.appliedCoupon && this.state.availableCoupons && this.state.availableCoupons.length > 0) {
      this.offerCoupons();
      return;
    }

    // Calcular totales
    this.calculateTotals();

    this.conversationState = ConversationState.REVIEW_ORDER;
    this.sendBotMessage(
      LEALBOT_MESSAGES.ORDER_SUMMARY.text(
        this.state.subtotal,
        this.state.discount,
        this.state.total
      )
    );
    this.currentQuickReplies = LEALBOT_MESSAGES.ORDER_SUMMARY.quick_reply || [];
    this.shouldScroll = true;
  }

  private calculateTotals(): void {
    this.state.subtotal = this.state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (this.state.redeemedCoupon) {
      // Si ya se redimió el cupón, usar esos valores
      this.state.discount = this.state.redeemedCoupon.discountAmount;
      this.state.total = this.state.redeemedCoupon.finalAmount;
    } else if (this.state.appliedCoupon) {
      // Si solo se validó, calcular estimado
      const rewardValue = this.state.appliedCoupon.rewardValue || 0;
      const type = this.state.appliedCoupon.rewardType;

      if (type === 'PERCENT_DISCOUNT') {
        this.state.discount = (this.state.subtotal * rewardValue) / 100;
      } else if (type === 'FIXED_AMOUNT') {
        this.state.discount = rewardValue;
      } else {
        this.state.discount = 0; // Para 2x1 y FREE_PRODUCT, se calcula al redimir
      }
      this.state.total = Math.max(0, this.state.subtotal - this.state.discount);
    } else {
      this.state.discount = 0;
      this.state.total = this.state.subtotal;
    }
  }

  /**
   * ============ GESTIÓN DE CUPONES ============
   */

  private offerCoupons(): void {
    const count = this.state.availableCoupons?.length || 0;
    if (count > 0) {
      this.conversationState = ConversationState.COUPON_SELECTION;
      this.sendBotMessage(LEALBOT_MESSAGES.HAS_ACTIVE_COUPONS.text(count));
      this.currentQuickReplies = LEALBOT_MESSAGES.HAS_ACTIVE_COUPONS.quick_reply || [];
      this.shouldScroll = true;
    } else {
      this.skipCouponSelection();
    }
  }

  private showAvailableCoupons(): void {
    if (!this.state.availableCoupons || this.state.availableCoupons.length === 0) {
      this.sendBotMessage(LEALBOT_MESSAGES.NO_ACTIVE_COUPONS.text);
      this.skipCouponSelection();
      return;
    }

    // Crear chips para cada cupón con descripción
    const couponChips: DialogChip[] = this.state.availableCoupons.map(coupon => {
      let label = `🎟️ ${coupon.code}`;

      // Agregar título de campaña si está disponible
      if (coupon.campaignTitle) {
        label = `${coupon.campaignTitle} (${coupon.code})`;
      }

      // Agregar info del descuento si está disponible
      if (coupon.rewardType && coupon.numericValue) {
        if (coupon.rewardType === 'PERCENT_DISCOUNT') {
          label += ` - ${coupon.numericValue}% OFF`;
        } else if (coupon.rewardType === 'FIXED_AMOUNT') {
          label += ` - $${coupon.numericValue} OFF`;
        } else if (coupon.rewardType === 'BUY_X_GET_Y') {
          label += ` - 2x1`;
        } else if (coupon.rewardType === 'FREE_PRODUCT') {
          label += ` - Producto Gratis`;
        }
      }

      return {
        label: label,
        value: `coupon_${coupon.code}`,
        disabled: coupon.status !== 'ACTIVE'
      };
    });

    couponChips.push({ label: '⏭️ No usar cupón', value: 'no_coupon' });

    this.sendBotMessage('🎁 Selecciona un cupón para aplicar a tu orden:');

    // Si los cupones tienen descripción, mostrarla
    if (this.state.availableCoupons.some(c => c.rewardDescription)) {
      let descriptions = '\n\n';
      this.state.availableCoupons.forEach(coupon => {
        if (coupon.rewardDescription) {
          descriptions += `• ${coupon.code}: ${coupon.rewardDescription}\n`;
        }
      });
      if (descriptions !== '\n\n') {
        this.sendBotMessage(descriptions);
      }
    }

    this.currentQuickReplies = couponChips;
    this.shouldScroll = true;
  }

  private handleCouponSelection(couponCode: string): void {
    this.state.isLoading = true;
    this.sendBotMessage(LEALBOT_MESSAGES.VALIDATING_COUPON.text);

    const request: CouponValidationRequest = {
      couponCode: couponCode,
      tenantId: this.tenantId
    };

    this.lealbotService
      .validateCoupon(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.state.isLoading = false;
          if (response.data && response.data.isValid) {
            // Cupón válido
            this.state.appliedCoupon = response.data;

            // Construir mensaje informativo según el tipo de recompensa
            let message = `✅ Cupón aplicado: ${response.data.campaignTitle || couponCode}`;

            if (response.data.description) {
              message += `\n${response.data.description}`;
            }

            // Mostrar tipo de descuento
            if (response.data.rewardType && response.data.rewardValue) {
              message += '\n\n';
              switch (response.data.rewardType) {
                case 'PERCENT_DISCOUNT':
                  message += `🎁 Descuento: ${response.data.rewardValue}% de descuento`;
                  break;
                case 'FIXED_AMOUNT':
                  message += `🎁 Descuento: $${response.data.rewardValue} de descuento`;
                  break;
                case 'BUY_X_GET_Y':
                  message += `🎁 Promoción: 2x1 en productos seleccionados`;
                  break;
                case 'FREE_PRODUCT':
                  message += `🎁 Promoción: Producto gratis`;
                  break;
              }
            }

            this.sendBotMessage(message);
            this.shouldScroll = true;

            // Continuar con el resumen de la orden
            setTimeout(() => {
              this.showOrderSummary();
            }, 500);
          } else if (response.data) {
            // Cupón inválido
            this.sendBotMessage(LEALBOT_MESSAGES.COUPON_INVALID.text(response.data.message || 'Cupón inválido'));
            this.currentQuickReplies = LEALBOT_MESSAGES.COUPON_INVALID.quick_reply || [];
            this.shouldScroll = true;
          }
        },
        error: (error) => {
          this.state.isLoading = false;
          this.sendBotMessage(LEALBOT_MESSAGES.COUPON_ERROR.text(error.message));
          this.currentQuickReplies = LEALBOT_MESSAGES.COUPON_ERROR.quick_reply || [];
          this.shouldScroll = true;
        }
      });
  }

  private skipCouponSelection(): void {
    this.state.appliedCoupon = null;
    this.showOrderSummary();
  }

  private showOrderSummary(): void {
    this.calculateTotals();
    this.conversationState = ConversationState.REVIEW_ORDER;
    this.sendBotMessage(
      LEALBOT_MESSAGES.ORDER_SUMMARY.text(
        this.state.subtotal,
        this.state.discount,
        this.state.total
      )
    );
    this.currentQuickReplies = LEALBOT_MESSAGES.ORDER_SUMMARY.quick_reply || [];
    this.shouldScroll = true;
  }

  /**
   * ============ CONFIRMACIÓN DE ORDEN ============
   */

  private confirmOrder(): void {
    if (this.state.cart.length === 0) {
      this.sendBotMessage(LEALBOT_MESSAGES.ERROR_EMPTY_CART.text);
      return;
    }

    // Si hay un cupón seleccionado, redimirlo primero
    if (this.state.appliedCoupon && !this.state.redeemedCoupon) {
      this.redeemCouponAndCreateOrder();
    } else {
      this.createOrder();
    }
  }

  private redeemCouponAndCreateOrder(): void {
    if (!this.state.appliedCoupon || !this.state.customer) {
      this.createOrder();
      return;
    }

    this.state.isLoading = true;
    this.sendBotMessage('⏳ Aplicando cupón...');

    // Preparar productos para la redención
    const orderProducts: OrderProductRequest[] = this.state.cart.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal: item.price * item.quantity
    }));

    const redeemRequest: RedeemCouponRequest = {
      tenantId: this.tenantId,
      couponCode: this.state.appliedCoupon.couponCode,
      customerId: this.state.customer.id,
      orderTotal: this.state.subtotal,
      sessionId: this.state.sessionId,
      orderProducts: orderProducts,
      metadata: JSON.stringify({ source: 'chatbot', version: '1.0' })
    };

    this.lealbotService
      .redeemCoupon(redeemRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.state.isLoading = false;
          console.log('Respuesta redención:', response);

          const isSuccess = response.code === 200 || response.code === 201;

          if (isSuccess && response.data) {
            // Cupón redimido exitosamente con detalles
            console.log('Redención exitosa con detalles:', response.data);
            this.state.redeemedCoupon = response.data;

            // Actualizar totales con los valores de la redención
            this.state.discount = response.data.discountAmount || 0;
            this.state.total = response.data.finalAmount || 0;

            // Mostrar información del descuento aplicado
            this.showCouponRedemptionMessage(response.data);

            // Continuar con la creación de la orden
            setTimeout(() => {
              this.createOrder();
            }, 2000); // Aumentar a 2 segundos para que el usuario vea el mensaje
          } else if (isSuccess && !response.data) {
            // Éxito pero sin detalles de redención
            console.log('Redención exitosa sin detalles');
            this.sendBotMessage(`✅ ${response.message || 'Cupón redimido exitosamente'}`);
            this.shouldScroll = true;

            setTimeout(() => {
              this.createOrder();
            }, 2000);
          } else {
            // Error al redimir - respuesta con código de error
            console.log('Error en redención:', response);
            this.state.isLoading = false;
            const errorMsg = response.message || 'No se pudo aplicar el cupón';
            this.sendBotMessage(LEALBOT_MESSAGES.COUPON_ERROR.text(errorMsg));

            // Ofrecer continuar sin cupón
            this.currentQuickReplies = [
              { label: '✅ Continuar sin cupón', value: 'confirm_order_no_coupon' },
              { label: '❌ Cancelar', value: 'cancel_order' }
            ];
            this.shouldScroll = true;
          }
        },
        error: (error) => {
          this.state.isLoading = false;
          this.sendBotMessage(LEALBOT_MESSAGES.COUPON_ERROR.text(error.message));

          // Ofrecer continuar sin cupón
          this.currentQuickReplies = [
            { label: '✅ Continuar sin cupón', value: 'confirm_order_no_coupon' },
            { label: '❌ Cancelar', value: 'cancel_order' }
          ];
          this.shouldScroll = true;
        }
      });
  }

  /**
   * Muestra el mensaje de redención de cupón según el tipo de recompensa
   */
  private showCouponRedemptionMessage(redemption: any): void {
    const discountType = redemption.discountType;
    console.log('Mostrando mensaje de redención:', { discountType, redemption });

    switch (discountType) {
      case 'PERCENT_DISCOUNT':
        // Usar discountValue o discountPercentage (el BE puede enviar cualquiera)
        const percentage = redemption.discountPercentage ?? redemption.discountValue ?? 0;
        this.sendBotMessage(
          `✅ ${redemption.campaignTitle || 'Cupón aplicado'}\n` +
          `${redemption.discountDescription || ''}\n\n` +
          `💰 Total original: $${Number(redemption.originalAmount).toFixed(2)}\n` +
          `🔻 Descuento${percentage > 0 ? ` (${percentage}%)` : ''}: -$${Number(redemption.discountAmount).toFixed(2)}\n` +
          `💳 Total a pagar: $${Number(redemption.finalAmount).toFixed(2)}`
        );
        this.shouldScroll = true;
        break;

      case 'FIXED_AMOUNT':
        // Descuento de monto fijo aplicado por el backend
        this.sendBotMessage(
          `✅ ${redemption.campaignTitle || 'Descuento aplicado'}\n` +
          `${redemption.discountDescription || ''}\n\n` +
          `💰 Total original: $${Number(redemption.originalAmount).toFixed(2)}\n` +
          `🔻 Descuento: -$${Number(redemption.discountAmount).toFixed(2)}\n` +
          `💳 Total a pagar: $${Number(redemption.finalAmount).toFixed(2)}`
        );
        this.shouldScroll = true;
        break;

      case 'BUY_X_GET_Y':
        this.sendBotMessage(
          `✅ ${redemption.campaignTitle || 'Promoción 2x1 aplicada'}\n` +
          `${redemption.discountDescription || ''}\n\n` +
          `💰 Total original: $${Number(redemption.originalAmount).toFixed(2)}\n` +
          `🔻 Ahorro: -$${Number(redemption.discountAmount).toFixed(2)}\n` +
          `💳 Total a pagar: $${Number(redemption.finalAmount).toFixed(2)}`
        );
        this.shouldScroll = true;
        break;

      case 'FREE_PRODUCT':
        this.sendBotMessage(
          `✅ ${redemption.campaignTitle || 'Producto gratis'}\n` +
          `${redemption.discountDescription || ''}\n\n` +
          `💰 Total original: $${Number(redemption.originalAmount).toFixed(2)}\n` +
          `🔻 Producto gratis: -$${Number(redemption.discountAmount).toFixed(2)}\n` +
          `💳 Total a pagar: $${Number(redemption.finalAmount).toFixed(2)}`
        );
        this.shouldScroll = true;
        break;

      default:
        // Caso genérico para cualquier otro tipo de cupón
        this.sendBotMessage(
          `✅ ${redemption.campaignTitle || 'Cupón redimido exitosamente'}\n` +
          `${redemption.discountDescription || redemption.message || ''}\n\n` +
          `💰 Total original: $${Number(redemption.originalAmount).toFixed(2)}\n` +
          `🔻 Descuento: -$${Number(redemption.discountAmount).toFixed(2)}\n` +
          `💳 Total a pagar: $${Number(redemption.finalAmount).toFixed(2)}`
        );
        this.shouldScroll = true;
    }
  }

  private createOrder(): void {
    this.state.isLoading = true;
    this.sendBotMessage(LEALBOT_MESSAGES.LOADING_ORDER.text);

    // Preparar items de la orden
    const items: OrderItem[] = this.state.cart.map(item => ({
      productId: item.productId,
      cantidad: item.quantity,
      precioUnitario: item.price,
      comentarios: item.comments,
      excludedIngredientIds: item.excludedIngredientIds || [],
      additionalIngredientIds: item.additionalIngredientIds || []
    }));

    const request: CreateOrderRequest = {
      tenantId: this.tenantId,
      sessionId: this.state.sessionId,
      customerId: this.state.customer?.id || undefined,
      customerName: this.state.customer?.name,
      customerEmail: this.state.customer?.email,
      customerPhone: this.state.customer?.phone,
      items: items,
      // Solo enviar couponCode si fue aplicado pero aún no redimido
      couponCode: !this.state.redeemedCoupon ? this.state.appliedCoupon?.couponCode : undefined,
      subtotal: this.state.subtotal,
      descuento: this.state.discount,
      totalFinal: this.state.total,
      source: 'CHATBOT'
    };

    this.lealbotService
      .createOrder(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.state.isLoading = false;
          const success = response?.code === 200 || response?.code === 201;
          if (success && response.object) {
            this.conversationState = ConversationState.ORDER_CONFIRMED;
            this.sendBotMessage(LEALBOT_MESSAGES.ORDER_CONFIRMED.text(response.object.id));
            this.currentQuickReplies = LEALBOT_MESSAGES.ORDER_CONFIRMED.quick_reply || [];
            this.state.cart = []; // Limpiar carrito
            this.shouldScroll = true;
          } else {
            // Error de negocio (ej. producto agotado): el backend responde HTTP 200 con code != 200
            const msg = response?.message || 'No se pudo procesar tu pedido. Intenta de nuevo.';
            this.sendBotMessage(`❌ ${msg}`);
            this.currentQuickReplies = [
              { label: '🛒 Ver mi carrito', value: 'view_cart' },
              { label: '⬅️ Volver al menú', value: 'browse_menu' }
            ];
            this.shouldScroll = true;
          }
        },
        error: (error) => {
          this.state.isLoading = false;
          this.handleApiError(error);
        }
      });
  }

  private closeChat(): void {
    this.state.isOpen = false;
    this.convertationState = ConversationState.ABANDONED;
    if (this.state.sessionId && this.state.cart.length > 0) {
      this.abandonSession();
    }
  }

  private abandonSession(): void {
    this.lealbotService
      .abandonSession(this.state.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Sesión abandonada:', this.state.sessionId);
        },
        error: (error) => {
          console.error('Error al abandonar sesión:', error);
        }
      });
  }

  /**
   * ============ UTILIDADES ============
   */

  private addMessageToChat(sender: 'USER' | 'BOT' | 'SYSTEM', content: string): void {
    this.state.messages.push({
      sender,
      messageType: 'TEXT',
      content,
      timestamp: new Date().toISOString(),
      isLoading: false
    });
  }

  private sendBotMessage(content: string): void {
    this.addMessageToChat('BOT', content);
    this.shouldScroll = true;
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer && this.messagesContainer.nativeElement) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (error) {
      console.error('Error al hacer scroll:', error);
    }
  }

  private handleApiError(error: Error): void {
    console.error('Error de API:', error.message);
    this.state.error = error.message;
    this.sendBotMessage(
      `❌ ${error.message || LEALBOT_MESSAGES.ERROR_GENERIC.text}`
    );
    this.currentQuickReplies = LEALBOT_MESSAGES.ERROR_GENERIC.quick_reply || [];
    this.shouldScroll = true;
  }

  // Getter para compatibilidad de tipos (typo en closeChat)
  private set convertationState(state: ConversationState) {
    this.conversationState = state;
  }
}
