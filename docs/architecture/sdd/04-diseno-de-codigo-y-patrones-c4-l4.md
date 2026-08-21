# SDD - Capítulo 4: Diseño de Código y Patrones de Diseño (C4 - Nivel 4)

## 4.1 Patrones de Diseño Implementados

```mermaid
classDiagram
    class ILealbotStepHandler {
        <<interface>>
        +canHandle(state: ConversationState): boolean
        +handle(input: string, context: LealbotHandlerContext): Observable~LealbotStepResult~
    }

    class RegistrationFlowHandler {
        +canHandle(state): boolean
        +handle(input, context): Observable~LealbotStepResult~
    }

    class CouponFlowHandler {
        +canHandle(state): boolean
        +handle(input, context): Observable~LealbotStepResult~
    }

    class OrderFlowHandler {
        +canHandle(state): boolean
        +handle(input, context): Observable~LealbotStepResult~
    }

    class CatalogFlowHandler {
        +canHandle(state): boolean
        +handle(input, context): Observable~LealbotStepResult~
    }

    class LealbotConversationEngine {
        -handlers: ILealbotStepHandler[]
        +processInput(state, input, context): Observable~LealbotStepResult~
    }

    ILealbotStepHandler <|.. RegistrationFlowHandler
    ILealbotStepHandler <|.. CouponFlowHandler
    ILealbotStepHandler <|.. OrderFlowHandler
    ILealbotStepHandler <|.. CatalogFlowHandler
    LealbotConversationEngine o--> ILealbotStepHandler
```

---

## 4.2 Patrón Facade para Manejo de Estado

```mermaid
classDiagram
    class LealbotFacade {
        -state: WritableSignal~LealbotState~
        +messages: Signal~ChatMessageUI[]~
        +cart: Signal~CartItem[]~
        +total: Signal~number~
        +isOpen: Signal~boolean~
        +isLoading: Signal~boolean~
        +conversationState: Signal~ConversationState~
        +toggleChat(): void
        +handleUserInput(input: string): void
        +addToCart(product: any): void
        +removeFromCart(productId: number): void
        +clearCart(): void
        +applyCoupon(code: string): void
        +checkout(): void
    }

    class LealbotComponent {
        -facade: LealbotFacade
        +onToggle(): void
        +onSend(text: string): void
    }

    LealbotComponent --> LealbotFacade
```

---

## 4.3 Adaptador de Pasarela de Pagos Stripe

```mermaid
classDiagram
    class IStripePaymentGateway {
        <<interface>>
        +initialize(publishableKey: string): Promise~boolean~
        +mountPaymentElement(containerId: string, clientSecret: string): Promise~void~
        +confirmPayment(returnUrl: string): Promise~StripePaymentResult~
        +destroy(): void
    }

    class StripePaymentGatewayService {
        -stripe: Stripe | null
        -elements: StripeElements | null
        -paymentElement: StripePaymentElement | null
        +initialize(publishableKey: string): Promise~boolean~
        +mountPaymentElement(containerId: string, clientSecret: string): Promise~void~
        +confirmPayment(returnUrl: string): Promise~StripePaymentResult~
        +destroy(): void
    }

    IStripePaymentGateway <|.. StripePaymentGatewayService
    StepPaymentStripeComponent --> StripePaymentGatewayService
```

---

## 4.4 Cumplimiento de Principios SOLID

1. **Single Responsibility Principle (SRP)**:
   - Los componentes de vista solo renderizan datos recibidos y emiten intenciones del usuario.
   - Las llamadas a APIs residen en servicios HTTP específicos.
   - La gestión del estado reside en Facades con Signals.
2. **Open/Closed Principle (OCP)**:
   - El motor conversacional de LealBot permite registrar nuevos flujos implementando `ILealbotStepHandler` sin alterar el engine central.
3. **Liskov Substitution Principle (LSP)**:
   - Todas las estrategias conversacionales pueden ser sustituidas indistintamente por el motor de diálogo.
4. **Interface Segregation Principle (ISP)**:
   - Interfaces pequeñas y específicas para cada paso del formulario y del bot (`DialogChip`, `CustomerValidation`, `CartCalculations`).
5. **Dependency Inversion Principle (DIP)**:
   - Componentes dependen de abstracciones y Facades inyectables (`providedIn: 'root'` o a nivel de módulo con InjectionTokens).
