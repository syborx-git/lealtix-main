# ADR-0004: Desacoplamiento de Stripe SDK y Stepper Multi-Paso en Registro

## Estado
Aceptado

## Fecha
2026-08-20

## Autores
- Equipo de Arquitectura Lealtix

## Contexto y Problema
El componente `RegistroComponent` (608 LOC) presentaba un alto acoplamiento con la pasarela de pagos `@stripe/stripe-js`. Las operaciones de ciclo de vida de Stripe (`loadStripe`, creación de `elements`, montaje de `paymentElement`, confirmación de setup/payment con 3D Secure, reintentos y captura de errores técnicos) estaban entremezcladas con la navegación del Stepper de 3 pasos, la validación del formulario de datos personales y la vista de confirmación.

Esto violaba el principio de **Inversión de Dependencias (DIP)** y el principio de **Segregación de Interfaces (ISP)**, dificultando el testing y el soporte de pasarelas alternativas o flujos de pago desacoplados.

## Opciones Consideradas
1. **Mantener Stripe dentro de RegistroComponent**: Alto acoplamiento, duplicación de código en caso de usar Stripe en otros puntos (e.g. `PagoComponent`).
2. **Crear un servicio monolítico de pagos con estado UI**: Mezcla lógica de transporte con lógica de presentación.
3. **Adaptador de Infraestructura `StripePaymentGatewayService` + Subcomponentes de Paso**: Aislamiento de la SDK de Stripe detrás de una interfaz limpia y desacoplamiento de la vista en componentes por paso (`step-personal-info`, `step-payment-stripe`, `step-confirmation`).

## Decisión
Se implementa el patrón **Adapter & Facade**:

1. **`StripePaymentGatewayService` (`core/services` o `features/registro/services`)**:
   - Encapsula exclusivamente el ciclo de vida del SDK `@stripe/stripe-js`: carga asíncrona de clave pública, inicialización de `StripeElements`, montaje en un contenedor DOM (`HTMLElement`), y ejecución de `confirmPayment()`.
   - Manejo tipado de errores de Stripe (`StripeErrorDetails`).
2. **`RegistrationFacade`**:
   - Orquesta la validación de tokens (`TokenValidationService`), el estado del formulario de registro y la coordinación de pasos.
3. **Subcomponentes Especializados**:
   - `RegistroStepperHeaderComponent`: Control visual de pasos.
   - `StepPersonalInfoComponent`: Formulario reactivo y validadores.
   - `StepPaymentStripeComponent`: Vista contenedora que delega en el gateway.
   - `StepConfirmationComponent`: Feedback visual y disparador de confeti.

```mermaid
graph LR
    RegComp[Registro Smart Component] --> RegFacade[RegistrationFacade]
    RegComp --> Step1[StepPersonalInfo]
    RegComp --> Step2[StepPaymentStripe]
    RegComp --> Step3[StepConfirmation]
    Step2 --> StripeGateway[StripePaymentGatewayService]
    StripeGateway --> StripeSDK[@stripe/stripe-js]
```

## Consecuencias
- **Positivas**:
  - Aislamiento total de `@stripe/stripe-js`; cambios en la SDK de Stripe no impactan la UI de registro.
  - Facilidad para mockear pagos en pruebas unitarias y E2E.
  - Reducción del tamaño de `RegistroComponent` a $< 90$ LOC.
- **Riesgo**: Coordinación asíncrona entre el montaje del DOM de Stripe y el cambio de paso.
- **Mitigación**: `RegistrationFacade` emite eventos reactivos de preparación de elementos antes de transicionar al paso 2.
