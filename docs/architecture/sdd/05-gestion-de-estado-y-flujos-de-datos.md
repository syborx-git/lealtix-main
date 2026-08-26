# SDD - Capítulo 5: Gestión de Estado y Flujos de Datos

## 5.1 Flujo Unidireccional de Datos (UDF)

La aplicación sigue el paradigma de flujo de datos unidireccional (*Unidirectional Data Flow*) mediado por **Angular Signals** y servicios Facade:

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Presenter as Presentational Component
    participant Facade as Feature Facade (Signals)
    participant Engine as Strategy / Business Logic
    participant Backend as Backend REST API

    Usuario->>Presenter: Interacción (e.g. envía mensaje / agrega al carrito)
    Presenter->>Facade: Invoca método de acción (e.g. facade.sendMessage)
    Facade->>Facade: Actualiza Signal isLoading = true
    Facade->>Engine: Delega procesamiento de entrada
    Engine->>Backend: Ejecuta llamada HTTP / cálculo
    Backend-->>Engine: Retorna respuesta DTO
    Engine-->>Facade: Emite resultado tipado
    Facade->>Facade: Actualiza Signals inmutables (state.update(...))
    Facade-->>Presenter: Notificación reactiva (Signals disparan OnPush)
    Presenter-->>Usuario: Renderizado visual actualizado a 60 FPS
```

---

## 5.2 Estructura del Estado Inmutable de LealBot

```typescript
export interface LealbotState {
  readonly sessionId: string;
  readonly customer: Customer | null;
  readonly messages: readonly ChatMessageUI[];
  readonly cart: readonly CartItem[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly appliedCoupon: CouponValidationData | null;
  readonly redeemedCoupon: Coupon | null;
  readonly subtotal: number;
  readonly discount: number;
  readonly total: number;
  readonly isOpen: boolean;
  readonly availableCoupons: readonly Coupon[];
  readonly conversationState: ConversationState;
  readonly currentQuickReplies: readonly DialogChip[];
  readonly currentInputType: 'TEXT' | 'EMAIL' | 'PHONE' | 'TEXTAREA' | 'CONTACT' | 'DATE' | null;
  readonly inputPlaceholder: string;
}
```

---

## 5.3 Ciclo de Vida y Limpieza Reactiva

Para prevenir fugas de memoria (*memory leaks*):
- Todo Facade o componente que consuma observables directos implementa `takeUntilDestroyed()` de `@angular/core/rxjs-interop` o destruye explícitamente sus suscripciones en `ngOnDestroy()`.
- Los bindings de vista consumen directamente `signals` invocados por función `facade.messages()` sin necesidad de `async pipe` ni suscripciones manuales.
