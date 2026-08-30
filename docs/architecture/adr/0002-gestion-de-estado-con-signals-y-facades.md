# ADR-0002: Gestión de Estado Reactivo con Angular Signals y Patrón Facade

## Estado
Aceptado

## Fecha
2026-08-20

## Autores
- Equipo de Arquitectura Lealtix

## Contexto y Problema
En componentes complejos como `LealbotComponent` y `RegistroComponent`, el estado (mensajes, carrito, cupones aplicados, pasos del stepper, estado de carga, errores) se almacenaba en propiedades mutables directas del componente. Esto ocasionaba:
1. Re-renderizados impredecibles y dificultades para rastrear mutaciones de estado.
2. Acoplamiento entre la lógica de actualización del estado y el ciclo de vida del componente UI.
3. Imposibilidad de compartir o sincronizar estado entre subcomponentes hijos sin cadenas interminables de `@Input()` / `@Output()`.

## Opciones Consideradas
1. **NgRx / Redux Store Global**: Provee inmutabilidad y DevTools, pero introduce una sobrecarga (*boilerplate*) excesiva (actions, reducers, selectors, effects) para este tipo de aplicación.
2. **Propiedades mutables locales en Componentes**: Cero sobrecarga inicial, pero genera componentes "Dios" inmanejables y proscriptos por SOLID.
3. **Angular Signals + Patrón Facade por Feature**: Estado reactivo granular de grano fino nativo de Angular 20, con API limpia y bajo *boilerplate*, encapsulado detrás de servicios Facade.

## Decisión
Se adopta **Angular Signals combinado con el Patrón Facade**:

1. **Estado Inmutable Encapsulado**: Cada feature con estado complejo (`LealbotFacade`, `RegistrationFacade`, `HotelLandingFacade`) encapsula su `signal` o `computed` privados/protegidos.
2. **Exposición de Signals de Solo Lectura**: La vista consume `readonly signals` (e.g. `facade.messages()`, `facade.cart()`, `facade.activeStep()`, `facade.isLoading()`).
3. **Mutaciones a través de Métodos Intencionales de Dominio**: El componente UI nunca muta el estado directamente, sino que delega acciones explícitas (e.g., `facade.sendMessage(text)`, `facade.addToCart(product)`, `facade.applyCoupon(code)`).

```typescript
@Injectable()
export class LealbotFacade {
  private state = signal<LealbotState>(initialState);

  // Selectores de solo lectura
  readonly messages = computed(() => this.state().messages);
  readonly cart = computed(() => this.state().cart);
  readonly total = computed(() => this.state().total);
  readonly isLoading = computed(() => this.state().isLoading);

  // Métodos de acción
  public sendMessage(text: string): void { ... }
}
```

## Consecuencias
- **Positivas**:
  - Reactividad de grano fino a 60 FPS sin necesidad de comprobación de cambios agresiva (`ChangeDetectionStrategy.OnPush`).
  - Lógica de negocio y gestión de estado 100% desacopladas de la UI, permitiendo pruebas unitarias sin levantar el DOM de Angular.
  - Flujo unidireccional de datos (*Unidirectional Data Flow*) predecible.
- **Riesgo**: Requiere disciplina para no mutar el estado fuera del Facade.
- **Mitigación**: Tipado inmutable con `Readonly<T>` y exclusión de setters públicos en las señales.
