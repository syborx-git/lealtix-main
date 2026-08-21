# ADR-0006: Control Cuantitativo de Calidad y Puertas de Enlace (CMMI Nivel 4 y 5)

## Estado
Aceptado

## Fecha
2026-08-20

## Autores
- Equipo de Arquitectura Lealtix

## Contexto y Problema
Para asegurar que el frontend de **`main`** mantenga un nivel de madurez técnica elevado a medida que el equipo y la base de código crecen, se requieren métricas cuantitativas reproducibles y procesos de optimización continua alineados con **CMMI Nivel 4 (Gestión Cuantitativa de Procesos)** y **CMMI Nivel 5 (Optimización Continua)**.

## Decisión
Se establecen umbrales cuantitativos estrictos (*Quality Gates*) para todo el ciclo de desarrollo:

### 1. Métricas de Complejidad y Modularidad (CMMI Nivel 4)

| Métrica | Límite Superior Permitido | Acción en caso de desvío |
|---|---|---|
| **Líneas por archivo (LOC)** | $\le 250$ LOC | Descomponer en subcomponentes / servicios |
| **Líneas por método / función** | $\le 30$ LOC | Extraer métodos puros o helpers |
| **Complejidad Ciclomática $V(G)$** | $\le 10$ por función | Reemplazar anidamientos por polimorfismo/estrategia |
| **Profundidad de Herencia (DIT)** | $\le 2$ | Favorecer composición sobre herencia |
| **Acoplamiento Eferente ($Ce$)** | $\le 7$ dependencias por clase | Inyectar Facades en lugar de servicios múltiples |

### 2. Procesos de Optimización Continua (CMMI Nivel 5)
- **Monitoreo de Bundles**: Presupuesto máximo (*budget*) de bundle principal $< 2$ MB y bundle de widget standalone $< 150$ KB.
- **Análisis Predictivo de Deuda Técnica**: Auditoría estática continua de dependencias no utilizadas, llamadas HTTP no tipadas y suscripciones RxJS sin cleanup (`takeUntilDestroyed` / `async pipe`).
- **Política de Cero Regresión**: Todo refactor debe preservar el 100% de la funcionalidad preexistente, verificado mediante validación de compilación (`ng build`) y compatibilidad de contratos públicos.

## Consecuencias
- **Positivas**:
  - Código predecible, altamente mantenible y resistente a la degradación con el tiempo.
  - Trazabilidad y gobernanza de software de nivel enterprise.
- **Riesgo**: Tiempo adicional de refactorización inicial.
- **Mitigación**: Automatización de verificación mediante scripts y linting.
