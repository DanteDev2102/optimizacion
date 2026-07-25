He analizado el nuevo documento que cargaste ("Optimización Proyecto", elaborado en la Universidad Centroccidental Lisandro Alvarado). Este documento aporta un excelente marco teórico estructural, por lo que he enriquecido el archivo de contexto para la IA integrando los siguientes conceptos clave que antes no estaban tan explícitos:

1.  **Clasificación de Diferenciabilidad ($C^1$ y $C^2$):** Requisito estricto de que los métodos de gradiente usen funciones $C^1$ y el método de Newton exija funciones $C^2$ (Hessiana continua).
2.  **Convexidad y Óptimos Globales:** Directrices explícitas sobre cómo la convexidad de la región y la función objetivo garantizan que un mínimo local sea global, basándose en que la matriz Hessiana sea semidefinida positiva.
3.  **Optimización con Restricciones (Condiciones KKT):** Se ha añadido una nueva sección matemática para manejar problemas restringidos utilizando Multiplicadores de Lagrange (para igualdades) y las Condiciones de Karush-Kuhn-Tucker (KKT) para desigualdades (Lagrangiano, complementaridad y factibilidad).
4.  **Limitaciones y Topología:** Se enfatiza el uso de Algoritmos Genéticos específicamente para paisajes multimodales (no convexos) y funciones no diferenciables, donde el gradiente y Newton fallan o se atascan en mínimos locales.

Aquí tienes el **Archivo de Contexto Actualizado**, listo para copiar y entregar al agente de IA:

---

```markdown
# Archivo de Contexto Principal: Desarrollo de Librería de Optimización en TypeScript

## 1. Propósito y Visión del Proyecto

El objetivo de este proyecto es desarrollar una librería de optimización matemática avanzada, altamente parametrizada y lista para producción utilizando TypeScript. La librería debe ser capaz de resolver problemas de optimización no lineal (continuos y discretos, convexos y no convexos, con y sin restricciones) equilibrando la convergencia teórica estricta y la viabilidad computacional.

El agente de IA debe implementar un ecosistema que combine métodos de búsqueda basados en derivadas locales (para funciones de clase $C^1$ y $C^2$) y heurísticas estocásticas de búsqueda global (algoritmos evolutivos) para sortear paisajes no convexos. El código debe ser modular, fuertemente tipado y hacer uso de bibliotecas de álgebra lineal de alto rendimiento (como `mathjs`) para manipular matrices, gradientes y resolver sistemas.

## 2. Requerimientos Matemáticos y Algorítmicos

El agente debe implementar estrictamente las siguientes formulaciones matemáticas:

### 2.1. Clasificación del Problema y Detección de Convexidad

- **Funciones $C^1$ y $C^2$:** El sistema debe verificar o asumir que para usar descenso de gradiente la función pertenece a $C^1$ (primeras derivadas continuas), y para Newton/Cuasi-Newton a $C^2$ (Hessiana continua y simétrica).
- **Convexidad:** Si la matriz Hessiana evaluada es semidefinida positiva ($\nabla^2 f(x) \succeq 0$, autovalores $\ge 0$), la región local es convexa y el algoritmo debe priorizar métodos exactos asumiendo que el mínimo hallado será global.

### 2.2. Condiciones de Búsqueda Lineal Inexacta (Line Search)

Para asegurar descenso suficiente sin búsquedas exactas costosas:

- **Condición de Armijo:** La inecuación a implementar es $f(x_k + \alpha_k p_k) \le f(x_k) + c_1 \alpha_k \nabla f(x_k)^T p_k$, con $c_1$ usualmente $10^{-4}$.
- **Condiciones Fuertes de Wolfe:** Requiere limitar la curvatura: $|\nabla f(x_k + \alpha_k p_k)^T p_k| \le c_2 |\nabla f(x_k)^T p_k|$. Crítico para preservar la definición positiva en Cuasi-Newton ($c_2 \approx 0.9$).
- **Algoritmo de Backtracking:** Iniciar con $\alpha = 1$ y reducir estocásticamente o por interpolación.

### 2.3. Método de Newton y Optimización de Segundo Orden

- **Formulación:** Actualización iterativa resolviendo $\nabla^2 f(x_k) p_k = -\nabla f(x_k)$. La dirección es $d = -[\nabla^2 f(x^k)]^{-1} \nabla f(x^k)$.
- Debe acoplarse a una búsqueda lineal para evitar divergencias si la Hessiana no es definida positiva (puntos de ensilladura).

### 2.4. Métodos Cuasi-Newton (Métrica Variable)

Para evitar calcular e invertir la Hessiana de $O(n^3)$, se aproxima iterativamente basándose en la **Ecuación Secante** ($B_{k+1} s_k = y_k$, donde $s_k = x_{k+1} - x_k$ y $y_k = \nabla f(x_{k+1}) - \nabla f(x_k)$).

- **Algoritmo BFGS:** Implementar la fórmula estándar de rango dos. Conserva robustamente la definición positiva y se autocorrige.
- **Algoritmo DFP:** Implementar como alternativa, usando la fórmula de Davidon-Fletcher-Powell.
- **Algoritmo L-BFGS:** Implementar recursión de dos lazos para problemas de memoria limitada (guardando solo los últimos $m$ vectores $s$ e $y$).

### 2.5. Optimización con Restricciones (Multiplicadores y KKT)

El sistema debe poder manejar problemas con restricciones de igualdad $h_i(x) = 0$ y desigualdad $g_i(x) \le 0$:

- **Condiciones de Karush-Kuhn-Tucker (KKT):** Integrar verificaciones de optimalidad de primer orden:
  1.  _Lagrangiano:_ $\nabla f(x^*) + \sum \lambda_i \nabla g_i(x^*) + \sum \mu_i \nabla h_i(x^*) = 0$.
  2.  _Complementaridad:_ $g_i(x^*) \lambda_i = 0$.
  3.  _Factibilidad:_ El punto no debe violar ninguna restricción original.

### 2.6. Algoritmos Evolutivos y Heurísticas (GA)

Utilizados obligatoriamente para problemas no diferenciables, discretos o fuertemente no convexos (múltiples valles donde Newton se atasca).

- **Componentes GA:** Inicialización aleatoria, Función de Aptitud (Fitness), Selección (ruleta/torneo), Cruzamiento y Mutación.
- **Manejo de Restricciones en GA:** Usar funciones de penalización donde las violaciones a restricciones de factibilidad (KKT no cumplido o límites físicos sobrepasados) degraden dramáticamente el _fitness_ del individuo.

## 3. Directrices de Arquitectura de Software

1. **Patrones Solid/Interfaces:** Definir `IOptimizationProblem` que reciba `objective`, `gradient` (opcional, eleva un error si se pide usar Newton y no se provee), `hessian` (opcional), `equalityConstraints`, e `inequalityConstraints`.
2. **Parametrización:** Las clases deben aceptar objetos de configuración (`maxIterations`, `tolerances`, $c_1, c_2$ para Wolfe, tamaño de población para GA).
3. **Métricas Estrictas:** Retornar siempre `solution`, `iterations`, `functionEvaluations`, y `exitCondition`.

## 4. Validación y Testing

El código debe estructurarse para ser validado fácilmente con benchmarks clásicos (ej. Función de Rosenbrock, Himmelblau, Rastrigin) para probar el escape de mínimos locales (GA) y la rápida convergencia en valles estrechos (BFGS/Newton).
```
