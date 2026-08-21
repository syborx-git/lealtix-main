# SDD - Capítulo 3: Arquitectura de Componentes (C4 - Nivel 3)

## 3.1 Estructura Modular y Capas

La arquitectura interna de **Lealtix Main** se organiza en tres capas cardinales bajo los principios de **Clean Architecture** y **Domain-Driven Design**:

```mermaid
graph TD
    subgraph "Capas de la Aplicación"
        Core["Core Layer (Singleton Services, Interceptors, Tokens)"]
        Shared["Shared Layer (UI Primitives, Directives, Pipes, Utilities)"]
        Features["Features Layer (Domain Modules)"]
    end

    Features --> Core
    Features --> Shared
    Shared -.-> Core
```

---

## 3.2 Desglose de Módulos de Feature

```mermaid
graph LR
    subgraph "Features"
        LealbotFeat["Feature: LealBot Conversational Assistant"]
        RegistroFeat["Feature: Tenant Onboarding & Stripe Checkout"]
        HotelFeat["Feature: Hotel Themed Landing"]
        TenantFeat["Feature: Dynamic Tenant Landing"]
        LandingFeat["Feature: Public Institutional Landing"]
        WidgetFeat["Feature: Offer Widget Web Component"]
        CheckoutFeat["Feature: Payment Status Callbacks"]
    end

    subgraph "Core & Infrastructure"
        HttpCore["Core HTTP & Interceptors"]
        TokenCore["Token Validation Service"]
        StripeCore["Stripe Payment Gateway Service"]
        ConfigCore["Environment & Lealtix Config"]
    end

    LealbotFeat --> HttpCore
    RegistroFeat --> StripeCore
    RegistroFeat --> TokenCore
    HotelFeat --> HttpCore
    TenantFeat --> HttpCore
    LandingFeat --> HttpCore
```

---

## 3.3 Catálogo de Componentes por Módulo

### 1. Módulo `features/lealbot`
- `LealbotComponent`: Smart Component orquestador ($< 100$ LOC).
- `LealbotHeaderComponent`: Cabecera con avatar e interactividad.
- `LealbotMessagesListComponent`: Lista reactiva de mensajes con gestión de scroll suave.
- `LealbotMessageBubbleComponent`: Renderizador polimórfico de mensajes (texto, botones, tarjetas).
- `LealbotQuickRepliesComponent`: Chips de sugerencia y respuestas automáticas.
- `LealbotInputBarComponent`: Barra de captura polimórfica (texto, teléfono, fechas, áreas).
- `LealbotCartDrawerComponent`: Visor deslizable de carrito con desglose de precios y cupones.
- `LealbotMenuCatalogComponent`: Visor de categorías y catálogo de productos.
- `LealbotFacade`: State management reactivo con Signals.
- `LealbotConversationEngine`: Router de estrategias conversacionales (`Strategy Pattern`).

### 2. Módulo `features/registro`
- `RegistroComponent`: Smart Component contenedor del Stepper ($< 90$ LOC).
- `RegistroStepperHeaderComponent`: Indicador gráfico de pasos de PrimeNG.
- `StepPersonalInfoComponent`: Formulario reactivo de datos personales del tenant.
- `StepPaymentStripeComponent`: Contenedor seguro para montaje de Stripe Elements.
- `StepConfirmationComponent`: Vista de bienvenida y confirmación exitosa con confeti.
- `RegistrationFacade`: Orquestador de validaciones de token y estado del onboarding.
- `StripePaymentGatewayService`: Adaptador del SDK de Stripe.

### 3. Módulo `features/landing-page-hotel`
- `LandingPageHotelComponent`: Smart Component orquestador ($< 80$ LOC).
- `HotelHeroNavbarComponent`: Navegación transparente y menú móvil.
- `HotelAboutSectionComponent`: Sección descriptiva de la historia y visión.
- `HotelMenuSectionComponent`: Menú categorizado con filtros interactivos.
- `HotelPromotionsCarouselComponent`: Carrusel de promociones activas.
- `HotelCaptureFormComponent`: Formulario de captura de clientes leales.
- `HotelFooterComponent`: Pie de página y enlaces legales.
- `HotelLandingFacade`: Facade de estado y carga por slug.
