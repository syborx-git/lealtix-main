# SDD - Capítulo 1: Introducción, Propósito y Metas del Sistema

## 1.1 Propósito del Documento

Este documento de Especificación del Diseño de Software (**Software Design Description - SDD**) describe formalmente la arquitectura técnica, la descomposición modular, los patrones de diseño y los controles cuantitativos de calidad del sistema **Lealtix Main (`main`)**.

El diseño está alineado con los estándares internacionales **IEEE 1016-2009**, el **Modelo C4** y los niveles de madurez **CMMI 4 (Gestión Cuantitativa)** y **CMMI 5 (Optimización Continua)**.

---

## 1.2 Alcance del Sistema Lealtix Main

**Lealtix Main** es la aplicación frontend orientada al cliente, landing pages institucionales, portal multitenant temático, proceso de onboarding/registro de negocios con pasarela de pagos Stripe, y asistente conversacional interactivo **LealBot**.

Sus subsistemas funcionales clave comprenden:

1. **Landing Page Institucional (`/`)**: Presentación de propuesta de valor de Lealtix, formulario de pre-suscripción y captura de leads.
2. **Onboarding y Registro de Tenants (`/registro`)**: Validación de tokens de invitación, wizard multi-paso, captura de datos de negocio y procesamiento de checkout con Stripe Elements y soporte 3D Secure.
3. **Portal Dinámico Multi-Tenant (`/landing-page/:slug`)**: Páginas personalizadas para cada negocio afiliado (logo, historia, menú de productos, promociones y bot de atención).
4. **Landing Temática Hotelera (`/landing-page-hotel/:slug`)**: Experiencia especializada para la industria hotelera y gastronómica, con diseño inmersivo y captura de huéspedes leales.
5. **Asistente Conversacional LealBot**: Bot de atención al cliente embebido capaz de guiar el registro de clientes en 5 pasos, validar y redimir cupones, consultar catálogo y procesar pedidos con carrito interactivo.
6. **Offer Widget Web Component (`offer-widget`)**: Custom Element autónomo compilado independientemente (`build-widget.js`) para embeberse en sitios web de terceros con Shadow DOM aislado.

---

## 1.3 Drivers Arquitectónicos y Metas Técnicas

| Categoría | Meta / Driver | Mecanismo de Arquitectura |
|---|---|---|
| **Escalabilidad** | Capacidad para incorporar nuevos módulos y flujos sin afectar código existente | Arquitectura Modular Domain-Driven (`core`, `features`, `shared`) |
| **Mantenibilidad** | Alta cohesión y bajo acoplamiento con límites estrictos de complejidad | Principios SOLID, Descomposición SRP de componentes Dios, Strategy Pattern |
| **Rendimiento** | Renderizado reactivo a 60 FPS con bajo consumo de memoria | Angular Signals + OnPush Change Detection + Lazy Loading |
| **Seguridad e Infraestructura** | Aislamiento de pasarelas de pago y credenciales | Inversión de Dependencias (DIP) con `StripePaymentGatewayService` y variables de entorno |
| **Calidad CMMI L4/L5** | Control predictivo de fallas, trazabilidad total y cero regresión | Matriz de Trazabilidad (RTM), Quality Gates y build continuo |
