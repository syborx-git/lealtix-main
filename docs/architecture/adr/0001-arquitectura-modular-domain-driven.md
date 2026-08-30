# ADR-0001: Adopción de Arquitectura Modular por Dominios (Core, Features, Shared)

## Estado
Aceptado

## Fecha
2026-08-20

## Autores
- Equipo de Arquitectura Lealtix

## Contexto y Problema
El frontend de **`main`** (`lealtix-main`) albergaba componentes y servicios dispersos en carpetas planas (`app/services`, `app/models`, `app/utils`), provocando acoplamiento difuso y falta de fronteras arquitectónicas claras. A medida que se incorporan nuevas funcionalidades (como el bot interactivo LealBot, landings multitenant parametrizables, temas hoteleros y widgets embebibles), la arquitectura plana impide el escalamiento y favorece dependencias circulares.

## Opciones Consideradas
1. **Estructura Plana por Tipo Técnico (Controllers, Services, Views)**: Modelo tradicional de Angular; falla al crecer la base de código porque los módulos de negocio se mezclan.
2. **Microfrontends (Module Federation)**: Excesiva complejidad operativa para el alcance actual de una SPA de landing/onboarding.
3. **Arquitectura Modular Domain-Driven (Core, Features, Shared)**: División limpia por capas de responsabilidad y subdominios de negocio aislados.

## Decisión
Se adopta la **Arquitectura Modular Domain-Driven** estructurada en tres capas estrictas:

```
src/app/
├── core/       # Servicios singleton de infraestructura, interceptores HTTP, guards y tokens.
├── shared/     # Componentes presentacionales desacoplados, directivas, pipes y helpers reutilizables.
└── features/   # Módulos de negocio independientes con su propio estado, lógica y submódulos.
    ├── lealbot/
    ├── registro/
    ├── landing-page/
    ├── landing-page-tenant/
    ├── landing-page-hotel/
    ├── checkout/
    ├── offer-widget/
    └── privacy/
```

### Reglas de Dependencia y Encapsulamiento
- `features/*` pueden consumir `core` y `shared`, pero **NUNCA** importar directamente componentes internos de otras features (deben comunicarse mediante eventos o servicios compartidos en `core/shared`).
- `core` y `shared` **NUNCA** dependen de `features`.
- Todo componente de feature expone su interfaz pública mediante *barrel exports* (`index.ts`).

## Consecuencias
- **Positivas**:
  - Aislamiento de subdominios de negocio con alta cohesión y bajo acoplamiento.
  - Habilita Lazy Loading automático por rutas de Angular.
  - Facilita el mantenimiento paralelo por múltiples desarrolladores sin conflictos de fusión.
- **Riesgo**: Curva de adaptación en la estructura de importaciones.
- **Mitigación**: Configuración de paths de TypeScript y barrel exports para compatibilidad retroactiva.
