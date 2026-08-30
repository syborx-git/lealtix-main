# SDD - Capítulo 6: Matriz de Trazabilidad de Requerimientos y Gestión de Riesgos

## 6.1 Matriz de Trazabilidad de Requerimientos (RTM)

La siguiente matriz vincula cada capacidad de negocio preexistente con los componentes refactorizados y los ADRs que los gobiernan, garantizando **cero regresión funcional**:

| ID Req | Requerimiento Funcional | Archivo Original (Monolito) | Componentes Refactorizados | ADR Asociado | Estado |
|---|---|---|---|---|---|
| **REQ-01** | Landing pública y pre-suscripción | `landing-page.component.ts` | `features/landing-page/landing-page.component.ts` + `SubscriptionService` | ADR-0001 | Mitigado |
| **REQ-02** | Validación de token de invitación | `registro.component.ts` | `features/registro/services/invitation-token.service.ts` | ADR-0004 | Mitigado |
| **REQ-03** | Formulario datos personales onboarding | `registro.component.ts` | `features/registro/components/step-personal-info/` | ADR-0003, ADR-0004 | Mitigado |
| **REQ-04** | Integración Stripe Checkout & Elements | `registro.component.ts` | `features/registro/components/step-payment-stripe/` + `StripePaymentGatewayService` | ADR-0004 | Mitigado |
| **REQ-05** | Confirmación y confeti onboarding | `registro.component.ts` | `features/registro/components/step-confirmation/` + `ConfettiService` | ADR-0003 | Mitigado |
| **REQ-06** | Landing dinámica por tenant slug | `landing-page-tenant/landing-page.component.ts` | `features/landing-page-tenant/` | ADR-0001, ADR-0003 | Mitigado |
| **REQ-07** | Landing especializada de hotel | `landing-page-hotel/landing-page-hotel.component.ts` | `features/landing-page-hotel/` (6 subcomponentes + Facade) | ADR-0001, ADR-0003 | Mitigado |
| **REQ-08** | Bot conversacional LealBot | `lealbot/lealbot.component.ts` | `features/lealbot/` (7 subcomponentes + 4 Handlers + Facade) | ADR-0002, ADR-0005 | Mitigado |
| **REQ-09** | Embebido Offer Widget Custom Element | `offer-widget/offer-widget.component.ts` | `features/offer-widget/` + `build-widget.js` | ADR-0001 | Mitigado |
| **REQ-10** | Aviso de Privacidad y Términos | `privacy/privacy.component.ts` | `features/privacy/privacy.component.ts` | ADR-0001 | Mitigado |

---

## 6.2 Gestión de Riesgos Técnicos y Mitigación

| Riesgo Técnico | Severidad | Probabilidad | Estrategia de Mitigación Implementada |
|---|---|---|---|
| **Rompimiento de Stripe Elements por timing de render** | Alta | Media | Creación del contenedor DOM antes de invocar `mount()` y validación explícita de `clientSecret` en `StripePaymentGatewayService`. |
| **Pérdida de estado en el árbol conversacional de LealBot** | Alta | Baja | Máquina de estados formal con enum `ConversationState` y suite de handlers con validación exhaustiva de inputs. |
| **Incompatibilidad del bundle de Web Component (`build-widget.js`)** | Media | Baja | Mantener `main-widget.ts` y exportación de `OfferWidgetComponent` con Shadow DOM sin alterar su contrato de `@Input()` / `@Output()`. |
| **Regresión en URLs o parámetros query (`?register=true&token=XYZ`)** | Crítica | Baja | Preservar exactamente las rutas en `app.routes.ts` y la lectura en `ActivatedRoute`. |
