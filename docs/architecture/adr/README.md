# Architecture Decision Records (ADR) - Lealtix Main

Este repositorio contiene el registro formal de las decisiones arquitectónicas clave tomadas en el desarrollo, reingeniería y mantenimiento de **Lealtix Main (`main`)**.

## Estructura de un ADR

Cada ADR sigue una estructura basada en el estándar **MADR (Markdown Architectural Decision Records)**:
1. **Título y Metadatos** (Estado, Fecha, Autores).
2. **Contexto y Problema**.
3. **Opciones Consideradas**.
4. **Decisión Tomada**.
5. **Consecuencias** (Positivas, Negativas/Riesgos y Mitigación).
6. **Trazabilidad** con SDD y requerimientos.

## Registro de Decisiones

| ID | Título | Estado | Fecha | Impacto Principal |
|---|---|---|---|---|
| [ADR-0000](./0000-plantilla-adr.md) | Plantilla Estándar para Architecture Decision Records | Aceptado | 2026-08-20 | Estandarización y gobernanza de documentación |
| [ADR-0001](./0001-arquitectura-modular-domain-driven.md) | Adopción de Arquitectura Frontend Modular por Dominios (Core, Features, Shared) | Aceptado | 2026-08-20 | Escalabilidad, bajo acoplamiento y límites claros |
| [ADR-0002](./0002-gestion-de-estado-con-signals-y-facades.md) | Gestión de Estado Reactivo con Angular Signals y Patrón Facade | Aceptado | 2026-08-20 | Reactividad moderna, flujo unidireccional y 60 FPS |
| [ADR-0003](./0003-descomposicion-srp-componentes-dios.md) | Reingeniería y Descomposición SRP de Componentes Dios | Aceptado | 2026-08-20 | Mantenibilidad, testabilidad y principio de responsabilidad única |
| [ADR-0004](./0004-desacoplamiento-stripe-stepper-registro.md) | Desacoplamiento de Stripe SDK y Stepper Multi-Paso en Registro | Aceptado | 2026-08-20 | Inversión de dependencias y aislamiento de pasarelas de pago |
| [ADR-0005](./0005-motor-conversacional-lealbot-strategy-pattern.md) | Motor Conversacional LealBot basado en Strategy Pattern & State Machine | Aceptado | 2026-08-20 | Principio Abierto/Cerrado (OCP) y modularidad conversacional |
| [ADR-0006](./0006-metricas-calidad-limites-complejidad-cmmi.md) | Control Cuantitativo de Calidad y Puertas de Enlace (CMMI Nivel 4 y 5) | Aceptado | 2026-08-20 | Gobernanza estadística de código y cero regresión |
