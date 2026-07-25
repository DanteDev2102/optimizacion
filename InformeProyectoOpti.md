---
title: "PROYECYO: METODOS DE OPTIMIZACIÓN"
subtitle: "Métodos Numéricos, Restricciones y Algoritmos Genéticos"
author: "Javier Bravo, Gabriel López, Yaslin Vreugdenhil, Dehucarlys Azuaje, Jennifer Ramírez, Daniel Mosquera, José Acosta, Ricardo Dugarte, Alirio Freitez"
institute: "Decanato de Ciencias y Tecnología, Universidad Centroccidental Lisandro Alvarado"
---

# Introducción a la Optimización Matemática

## ¿Qué es un Problema de Optimización?
En áreas como la informática, la investigación operativa, los procesos
administrativos y la manufactura, la optimización ocupa un rol
fundamental. Su propósito principal es ajustar sistemáticamente los
recursos, variables y procesos para maximizar la eficiencia global,
minimizar los costos operativos o alcanzar el mejor rendimiento posible
bajo un conjunto de condiciones dadas.

A partir de esta premisa, la optimización se define formalmente como un
proceso mediante el cual se logra un valor máximo o un mínimo con
respecto a un determinado criterio (Salvendy, 1992, p. 134). El fin
último de este proceso es reconfigurar un sistema para incrementar su
rendimiento utilizando la menor cantidad de recursos disponibles.

Desde la perspectiva de la programación matemática, la optimización
abarca un conjunto de métodos analíticos y numéricos enfocados en
identificar al mejor candidato dentro de una colección de alternativas,
evitando la necesidad de enumerar y evaluar explícitamente todas las
opciones posibles. Por su naturaleza, un problema de optimización
constituye fundamentalmente un problema de decisión.

Para hallar esta solución óptima, se requiere formular matemáticamente
una función objetivo, denotada como $f(x)$, la cual se desea maximizar
o minimizar. Dicha función está asociada a un vector de variables de
decisión $x$ y se encuentra sujeta a restricciones del tipo
$g_i(x) \le 0$ y $h_i(x) = 0$, las cuales delimitan estrictamente el
espacio o región de búsqueda donde residen las soluciones factibles.

Los problemas de optimización se clasifican en:

- Lineales y no Lineales.
- Convexos y no convexos.
- Continuos o discretos.
- Con restricciones o sin restricciones.

# Clasificación Rigurosa del Espacio de Problemas

La resolución eficiente de un problema de optimización no lineal depende
críticamente de las propiedades intrínsecas de la función objetivo
$f: \mathbb{R}^n \rightarrow \mathbb{R}$ y de las funciones que
delimitan la región factible. El análisis de estas propiedades permite
determinar la viabilidad de los algoritmos numéricos, sus tasas de
convergencia y la garantía de globalidad de las soluciones halladas.

- **Optimización Lineal:** Se enfoca en problemas cuyas relaciones,
  tanto en la función objetivo como en las restricciones, son
  estrictamente lineales. Utiliza métodos de programación lineal y es
  ampliamente aplicada en logística, transporte y distribución de
  recursos. Es uno de los enfoques más utilizados debido a su
  simplicidad y eficiencia computacional; un ejemplo clásico es el
  problema de la dieta, donde se busca minimizar el costo de los
  alimentos que satisfagan de manera exacta un conjunto determinado de
  requerimientos nutricionales.
- **Optimización No Lineal:** Aborda escenarios más complejos donde
  las funciones objetivas o las restricciones contienen relaciones no
  lineales que no guardan proporciones directas. Requiere algoritmos
  avanzados, como los métodos de Newton o enfoques numéricos
  especializados, y resulta indispensable para resolver problemas del
  mundo real donde el comportamiento de las variables es curvo o
  exponencial, tal como ocurre en la optimización de procesos químicos.
- **Optimización Continua:** se refiere a problemas en los que las
  variables pueden tomar cualquier valor dentro de un rango continuo.
  Esto significa que las variables no están limitadas a valores enteros,
  sino que pueden ser números reales.
- **Optimización Discreta:** se aplica cuando las variables solo
  pueden tomar valores discretos o enteros.

## Objetivos
### Objetivo General
### Objetivos Específicos

## Clasificación Fundamental: Funciones Diferenciables y No Diferenciables

Para que los algoritmos basados en derivadas (métodos de gradiente y de
segundo orden) operen de manera predecible, las funciones involucradas
deben pertenecer a clases específicas de continuidad:

- **Clase $C^0$ (Funciones Continuas):** La función $f$ es
  continua en todo su dominio, lo que garantiza que no existen saltos
  abruptos o asíntotas, pero no asegura la existencia de derivadas en
  todos sus puntos.
- **Clase $C^1$ (Continuamente Diferenciables):** La función
  posee derivadas parciales de primer orden continuas en todo su
  dominio. Esto permite la construcción formal del **vector
  gradiente**, denotado como $\nabla f(x)$, el cual apunta en la
  dirección de máximo crecimiento local:
  $$ \nabla f(x) = \left[ \frac{\partial f}{\partial x_1}, \frac{\partial f}{\partial x_2}, \dots, \frac{\partial f}{\partial x_n} \right]^T $$
  Los métodos de primer orden, como el Descenso del
  Gradiente, requieren estrictamente que $f \in C^1$ para garantizar
  que el cálculo del paso de búsqueda sea estable.
- **Clase $C^2$ (Dos veces Continuamente Diferenciables):** La
  función posee derivadas parciales de segundo orden continuas. Esto
  permite definir la **Matriz Hessiana**, denotada como
  $\nabla^2 f(x)$ o $H(x)$, que describe la curvatura local de la
  función:
  $$ \nabla^2 f(x) = \begin{bmatrix}
      \frac{\partial^2 f}{\partial x_1^2} & \frac{\partial^2 f}{\partial x_1 \partial x_2} & \dots & \frac{\partial^2 f}{\partial x_1 \partial x_n} \\
      \frac{\partial^2 f}{\partial x_2 \partial x_1} & \frac{\partial^2 f}{\partial x_2^2} & \dots & \frac{\partial^2 f}{\partial x_2 \partial x_n} \\
      \vdots & \vdots & \ddots & \vdots \\
      \frac{\partial^2 f}{\partial x_n \partial x_1} & \frac{\partial^2 f}{\partial x_n \partial x_2} & \dots & \frac{\partial^2 f}{\partial x_n^2}
  \end{bmatrix} $$
  De acuerdo con el Teorema de Schwarz, si $f \in C^2$,
  la matriz Hessiana es simétrica
  ($\frac{\partial^2 f}{\partial x_i \partial x_j} = \frac{\partial^2 f}{\partial x_j \partial x_i}$).
  Los algoritmos de segundo orden, como Newton-Raphson, exigen
  $f \in C^2$ para calcular e invertir esta matriz, permitiendo una
  convergencia cuadrática en la vecindad del óptimo.

## Concepto de Convexidad

La convexidad es la propiedad matemática más noble en optimización, ya
que elimina la ambigüedad entre óptimos locales y globales.

- **Conjunto Convexo:** Un conjunto $S \subseteq \mathbb{R}^n$ es
  convexo si, para cualquier par de puntos $x, y \in S$, el segmento
  de recta que los une pertenece enteramente a $S$. Es decir:
  $$ \alpha x + (1-\alpha)y \in S, \quad \forall \alpha \in [0, 1] $$
- **Función Convexa:** Una función $f: S \rightarrow \mathbb{R}$
  definida sobre un conjunto convexo $S$ es convexa si cumple
  analíticamente la desigualdad:
  $$ f(\alpha x + (1-\alpha)y) \le \alpha f(x) + (1-\alpha)f(y), \quad \forall x,y \in S, \; \forall \alpha \in [0,1] $$

### Criterios Diferenciales de Convexidad

Si la función es diferenciable, existen dos criterios fundamentales
basados en el cálculo para verificar la convexidad:

1. **Criterio de Primer Orden ($C^1$):** $f$ es convexa si y
   solo si:
   $$ f(y) \ge f(x) + \nabla f(x)^T (y - x), \quad \forall x, y \in S $$
   Geométricamente, esto significa que la aproximación por
   hiperplano tangente siempre se encuentra por debajo (o es igual) a la
   función.
2. **Criterio de Segundo Orden ($C^2$):** $f$ es convexa si y
   solo si su matriz Hessiana $\nabla^2 f(x)$ es **semidefinida
   positiva** ($\nabla^2 f(x) \succeq 0$) para todo $x \in S$. Esto se
   traduce en que sus valores propios ($\lambda_i$) son todos no
   negativos ($\lambda_i \ge 0$), o que para cualquier vector no nulo
   $v \in \mathbb{R}^n$ se cumple:
   $$ v^T \nabla^2 f(x) v \ge 0 $$

El impacto teórico cardinal de la convexidad radica en el siguiente
teorema fundamental: *"Si $f$ es una función convexa sobre un
conjunto convexo restringido o libre, cualquier mínimo local es de
manera inequívoca un mínimo global"*.

## El Impacto de la No Convexidad y la No Diferenciabilidad

Cuando un problema carece de convexidad o diferenciabilidad, las
garantías teóricas colapsan:

- **Paisajes No Convexos (Multimodales):** Funciones como
  Himmelblau o Rastrigin poseen múltiples valles, crestas y puntos de
  silla. En estos escenarios, algoritmos deterministas locales (como el
  Descenso del Gradiente o BFGS) quedan atrapados de forma inevitable en
  el **mínimo local más cercano** al punto de partida $x_0$,
  siendo incapaces de reconocer la existencia de un mínimo global en
  otra región del espacio.
- **Fenómenos de No Diferenciabilidad:** Puntos donde el gradiente
  no existe (como quiebres de valor absoluto o funciones definidas a
  trozos) actúan como "muros" para los métodos tradicionales. El vector
  gradiente se vuelve indefinido o diverge, provocando oscilaciones
  infinitas o fallas críticas en los criterios de parada
  computacionales. Para estos casos, se requiere el uso de subgradientes
  o algoritmos heurísticos libres de derivadas.

En el ámbito computacional y de la programación, llevar a cabo esta
optimización implica diseñar e implementar algoritmos eficientes capaces
de recorrer el espacio de soluciones de forma estructurada, garantizando
la convergencia hacia el resultado idóneo con la menor complejidad de
cómputo y uso de recursos de procesamiento.

# Optimización para Funciones Diferenciables Sin Restricciones

Se abordan las estrategias algorítmicas integradas para la resolución
computacional de modelos, estructuradas bajo un enfoque analítico y
numérico. En este trabajo se presentan los métodos organizados en tres
categorías principales: métodos clásicos, métodos estocásticos y
técnicas de búsqueda lineal. Cada procedimiento ha sido seleccionado
debido a su fundamento matemático y su capacidad para converger hacia
los puntos óptimos de una función objetivo bajo distintas condiciones
operativas, permitiendo evaluar su desempeño práctico y sus propiedades
de convergencia.

## Métodos clásicos

Los métodos clásicos, frecuentemente denominados enfoques deterministas
o analíticos, se fundamentan en el uso riguroso del cálculo diferencial
y el análisis matemático para explorar el espacio de soluciones. A
partir de una estimación inicial, estos algoritmos trazan una
trayectoria analítica y predecible hacia el extremo local o global de la
función. Al carecer de componentes estocásticos o aleatorios, garantizan
una ejecución totalmente reproducible que arroja idénticos resultados
bajo las mismas premisas de partida.

**Características principales:**

- Se apoyan en el cálculo de derivadas o gradientes para determinar la
  dirección de cambio óptima en la función objetivo.
- Ofrecen una convergencia altamente precisa y eficiente en problemas
  analíticamente bien estructurados y continuos.

## Algoritmo General de Optimización

Pese a que existen ciertas diferencias matemáticas con respecto a la
curvatura o la pendiente, en general los algorítmos de optimización
responden a una misma estructura algorítmica iterativa.Para resolver un
problema de la forma: $\min_{x \in \mathbb{R}^n} f(x)$ , los
algoritmos generan una secuencia $\{x_0, x_1, x_2, \dots, x_k\}$
siguiendo un esquema general:

**Dar Punto Inicial $x_0$ :** Se establece una estimación o
vector $x_0 \in \mathbb{R}^n$ de inicio en el espacio de búsqueda.El
punto inicial es un factor determinante en el comportamiento, la
velocidad de convergencia y el éxito de los algoritmos de búsqueda
iterativa.

## Determinación de la Dirección de Descenso

**Escoger Dirección de Descenso :** Un vector se llama dirección de
descenso de una función $f$ en un punto $x$, si existe un $s > 0$
tal que $$f(x + \lambda d) < f(x) \quad \forall \lambda \in (0, \mu)$$
Si la función $f$ es diferenciable, $d$ es una dirección de descenso
si y solo si el producto escalar con el gradiente es estrictamente
negativo: $$\nabla f(x) \cdot d < 0$$ Recordando la propiedad geométrica
del producto escalar entre dos vectores:

$$\vec{a} \cdot \vec{b} = \|a\| \cdot \|b\| \cdot \cos \measuredangle(a,b)$$

Esto demuestra que para que la dirección sea de descenso, el ángulo
entre el gradiente $\nabla f(x)$ y el vector $d$ debe ser obtuso
(mayor a 90°), haciendo que el coseno sea negativo.

La diferencia cardinal entre los algoritmos clásicos radica
exclusivamente en la forma analítica en que calculan la dirección de
descenso $d_k$:

### Método de Máxima Pendiente (Descenso del Gradiente)

- *Máxima Pendiente* : Este método (tambien llamado Descenso del
  Gradiente), es el algoritmo de optimización de primer orden más
  fundamental y conceptualmente intuitivo para la resolución de
  problemas no restringidos de la forma
  $\min\limits_{x \in \mathbb{R}^n} f(x)$. El método se apoya en una
  propiedad geométrica del vector gradiente $\nabla f(x)$: para
  cualquier función continuamente diferenciable $(f \in C^1)$ el
  gradiente apunta exactamente en la dirección de máximo crecimiento
  local de la función. Por lo tanto, la dirección de máximo descenso es
  la dirección opuesta al gradiente $$d_k = -\nabla f(x_k)$$ Es
  computacionalmente liviano por iteración, pero su tasa de convergencia
  es lineal y suele ralentizarse cerca del óptimo en funciones mal
  acondicionadas.

### Método de Newton

El Método de Newton (o método de Newton-Raphson) es el algoritmo 
determinista de segundo orden más emblemático en la optimización no 
lineal no restringida de la forma $\min\limits_{x \in \mathbb{R}^n} f(x)$.

Este método usa una sucesión de aproximaciones cuadráticas de la 
función objetivo y el máximo de la aproximación debería converger al 
máximo de la función.

Newton-Raphson es un algoritmo iterativo para resolver ecuaciones no
lineales, se fundamenta mediante la expansión en Serie de Taylor de 
segundo orden de la función objetivo $f(x)$ alrededor de un punto 
conocido $x_k$ :

$$f(x) \approx f(x_k) + \nabla f(x_k)^T (x - x_k) + \frac{1}{2} (x - x_k)^T H(x_k) (x - x_k)$$

donde:
- $\nabla f(x_k)$ es el vector gradiente evaluado en $x_k$.
- $H(x_k) = \nabla^2 f(x_k)$ es la matriz Hessiana (matriz de 
  segundas derivadas parciales de $n \times n$) evaluada en $x_k$.

Para encontrar la condición necesaria de un punto estacionario de esta 
aproximación cuadrática, se calcula el gradiente con respecto a $x$ e 
iguala a cero:

$$\nabla f(x) \approx \nabla f(x_k) + H(x_k)(x - x_k) = 0$$

Despejando el vector $x$, se obtiene la regla de actualización de 
Newton-Raphson:

$$x_{k+1} = x_k - H^{-1}(x_k)\nabla f(x_k)$$

La idea del método es iniciar desde un punto inicial $x_0$ y luego 
utilizar la ecuación anterior para determinar un nuevo punto. El 
proceso puede o no converger dependiendo de la selección del punto de
inicio.

El algoritmo termina cuando $x_{k+1}$ es suficientemente cercano a 
$x_k$.

**Ventajas principales:**

- Convergencia rápida: Llega a la solución exacta muy rápido si el 
  punto inicial está cerca del óptimo.
- Menor cantidad de operaciones:  Requiere muchos menos pasos que los 
  métodos basados solo en la primera derivada.

**Limitaciones:**

- Costo computacional alto: Se requiere computar tanto el gradiente como la matriz Hessiana.
- Sensibilidad al punto inicial: Si se empieza lejos del óptimo, el método puede oscilar, divergir o capturarse en un punto de silla o máximo en lugar de un mínimo.

La forma de calcular la dirección de descenso para Newton es

$$d = -\left[\nabla^2 f(x^k)\right]^{-1} \cdot \nabla f(x^k)$$

### Métodos Quasi-Newton (BFGS)

Es un algoritmo de optimización utilizado principalmente para resolver
problemas no lineales sin restricciones. Destaca en campos como la
estadística y la ciencia de datos por su eficiencia al aproximar la
matriz Hessiana, la cual es fundamental para determinar la curvatura de
la función objetivo. Este enfoque construye su aproximación utilizando
únicamente las primeras derivadas, reduciendo drásticamente la carga
computacional.

## Mecanismo Operativo

El algoritmo opera mediante la actualización iterativa de una estimación
inicial hacia la solución óptima. En cada paso, emplea la información
del gradiente para ajustar tanto la posición actual como la aproximación
de la matriz Hessiana.

El proceso sigue esta secuencia:

- Se establece una estimación inicial y se calcula el gradiente de la
  función objetivo.
- Se determina la dirección de búsqueda multiplicando la inversa de la
  matriz Hessiana aproximada por el gradiente.
- Se actualiza la solución aplicando un tamaño de paso (calculado
  mediante una búsqueda lineal) a lo largo de esa dirección.

Este ciclo iterativo permite al algoritmo navegar por el panorama
topológico de la función de manera altamente efectiva.

Una de las mayores ventajas de este método es su capacidad de converger
más rápido que los enfoques de primer orden (como el descenso de
gradiente), gracias a que incorpora información de la curvatura del
espacio (segundo orden) mediante su Hessiana aproximada. Además, suele
ser menos sensible a una mala elección de la estimación inicial.

Entre las variantes más utilizadas destacan:

- **Método de Broyden-Fletcher-Goldfarb-Shanno (BFGS) :** Uno de
  los métodos quasi-Newton más populares, se ha consolidado como el
  estándar de la industria gracias a su notable estabilidad y alto
  rendimiento al enfrentarse a una amplia diversidad de problemas
  matemáticos.
- **Método de Davidon-Fletcher-Powell (DFP) :** representa un modelo
  histórico y precursor dentro de la familia Quasi-Newton, manteniéndose
  como una sólida alternativa teórica frente al esquema operativo del
  BFGS.

## Estrategias para la Determinación del Tamaño de Paso
### Criterio de Armijo (Búsqueda Inexacta)
### Condiciones de Wolfe

## Simulación Computacional y Corridas de Ejecución (Casos de Estudio)

# Optimización para Funciones Diferenciables Con Restricciones

## Condiciones Teóricas para Garantizar la Solución Óptima
### Multiplicadores de Lagrange (Igualdades)
### Condiciones de Karush-Kuhn-Tucker - KKT (Desigualdades)

El Teorema de Karush-Kuhn-Tucker (KKT) establece las condiciones 
necesarias de primer orden para que un punto $x^*$ sea una solución 
óptima en un problema de optimización.

**Teorema:**

Si $x^*$ es una solución optima para restricciones activas  y 
$\nabla g_i(x^*)$, $\nabla h_i(x^*)$ son linealmente independientes 
(lo que garantiza la condición de Regularidad) para todo 
$i\in \{1, \dots, n\}$ entonces existen multiplicadores 
$\lambda_i$, $i = 1, \dots, l$ y $\mu_i$, $i = 1, \dots, p$  tales que 
se cumplen las siguientes tres condiciones:

- Lagrangiano: La suma del gradiente de la función objetivo y la combinación lineal de los gradientes de las restricciones debe ser igual a cero:

  $$\nabla f(x^*) + \sum_{i=1}^{l} \lambda_i \nabla g_i(x^*) + \sum_{i=1}^{p} \mu_i \nabla h_i(x^*) = 0$$

- Complementaridad: Para cada restricción de desigualdad, el producto entre el valor de la función de restricción evaluada en $x^*$ y su correspondiente multiplicador $\lambda_i$ debe ser igual a cero:
  
  $$g_i(x^*) \lambda_i = 0, \quad i = 1, \dots, l$$

- Factibilidad: El punto $x^*$ debe cumplir con todas las restricciones del problema original (las de igualdad deben ser exactamente cero y las de desigualdad deben ser menores o iguales a cero):

  $$\begin{aligned}
  h_i(x^*) = 0, & \quad i = 1, \dots, p \\[1ex]
  g_i(x^*) \le 0, & \quad i = 1, \dots, l
  \end{aligned}$$

Las condiciones KKT necesarias también son suficientes si la función 
objetivo y el espacio de soluciones satisfacen las condiciones que Hamdy Taha explica con la siguiente tabla:

| Sentido de la optimización | Función objetivo | Espacio de soluciones |
| :--- | :--- | :--- |
| Maximización | Cóncava | Conjunto convexo |
| Minimización | Convexa | Conjunto convexo |

Es más fácil verificar que una función sea convexa o cóncava que 
demostrar que un espacio de soluciones es convexo.

## Transformación a Problemas No Restringidos
### Método de Penalización Externa
### Método de Barrera Logarítmica (Punto Interior)

## Simulación Computacional de un Problema Restringido

# Optimización para Funciones No Diferenciables

## Limitaciones de los Métodos Basados en el Gradiente
## Introducción a los Algoritmos Genéticos (AG)

# Banco de Pruebas y Resultados Experimentales

## Definición de Funciones Teóricas
## Entorno de Desarrollo en Python
## Análisis de Convergencia y Trayectorias

# Conclusiones y Recomendaciones

## Referencias Bibliográficas

- Nocedal, J., & Wright, S. (2006). *Numerical Optimization*. Springer Science & Business Media.
- Bazaraa, M. S., Sherali, H. D., & Shetty, C. M. (2013). *Nonlinear Programming: Theory and Algorithms*. John Wiley & Sons.
- Boyd, S., & Vandenberghe, L. (2004). *Convex Optimization*. Cambridge University Press.
- Taha, H., (2012). *Investigación de Operaciones*. 9na Edición. University of Arkansas, Fayetteville
