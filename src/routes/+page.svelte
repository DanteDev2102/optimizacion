<script lang="ts">
  import MathInput from "$lib/components/MathInput.svelte";
  import Accordion from "$lib/components/Accordion.svelte";
  import AccordionItem from "$lib/components/AccordionItem.svelte";
  import TrajectoryPlot from "$lib/components/TrajectoryPlot.svelte";
  import Latex from "$lib/components/Latex.svelte";
  import {
    gradientDescent,
    newtonsMethod,
    type IterationResult,
  } from "$lib/utils/optimization";
  import { Calculator, AlertCircle, ChevronDown, Play } from "lucide-svelte";

  let algorithm = $state<"gradient" | "newton">("newton");

  // Default values
  let x0 = $state("1, 1");
  let grad = $state("2x_1, 2x_2");
  let hessian = $state("\\begin{bmatrix} 2 & 0 \\\\ 0 & 2 \\end{bmatrix}");

  // Basic numeric inputs for parameters
  let tol = $state("0.001");
  let stepSize = $state("1");

  let results = $state<IterationResult[]>([]);
  let errorMsg = $state<string | null>(null);

  function calculate() {
    errorMsg = null;
    results = [];
    try {
      const tolerance = parseFloat(tol) || 0.001;
      const step = parseFloat(stepSize) || 1;

      if (algorithm === "newton") {
        results = newtonsMethod(x0, grad, hessian, tolerance, step, 50);
      } else {
        results = gradientDescent(x0, grad, tolerance, step, 100);
      }
    } catch (err: any) {
      errorMsg = err.message || "Ocurrió un error en el cálculo.";
    }
  }

  // Extract 2D points for plot if applicable
  let plotPoints = $derived.by(() => {
    if (results.length > 0 && results[0].xk.length >= 2) {
      return results.map((r) => [r.xk[0], r.xk[1]] as [number, number]);
    }
    return [];
  });

  // Helper to format vectors to LaTeX
  function formatVector(vec: number[]): string {
    return `\\begin{bmatrix} ${vec.map((v) => v.toFixed(4)).join(" \\\\ ")} \\end{bmatrix}`;
  }

  // Helper to format matrices to LaTeX
  function formatMatrix(mat: number[][]): string {
    const rows = mat.map((row) => row.map((v) => v.toFixed(4)).join(" & "));
    return `\\begin{bmatrix} ${rows.join(" \\\\ ")} \\end{bmatrix}`;
  }
</script>

<div class="flex flex-col gap-8 w-[80%] mx-auto py-12 md:py-20">
  
  <!-- Config Panel -->
  <div class="glass p-8 rounded-2xl flex flex-col gap-6">
    <h2 class="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
      <Calculator class="w-5 h-5 text-primary" />
      Configuración
    </h2>

    <div class="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      
      <div class="flex flex-col gap-5 w-full">
        <div class="flex flex-col gap-1.5 items-center">
          <label class="text-sm font-medium text-zinc-300">Algoritmo</label>
          <div class="relative w-full">
            <select
              bind:value={algorithm}
              class="w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer text-center"
            >
              <option value="newton" class="bg-zinc-900 text-zinc-50">Método de Newton</option>
              <option value="gradient" class="bg-zinc-900 text-zinc-50">Método General</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
              <ChevronDown class="w-4 h-4" />
            </div>
          </div>
        </div>

        <MathInput label="Tolerancia" bind:value={tol} />
        <MathInput label="Paso (α)" bind:value={stepSize} />

        <MathInput label="Punto Inicial (x₀)" bind:value={x0} />
        <MathInput label="Vector Gradiente (∇f)" bind:value={grad} />
        
        {#if algorithm === 'newton'}
          <MathInput label="Matriz Hessiana (H)" bind:value={hessian} />
        {/if}
      </div>

      <div class="flex justify-center mt-6">
        <button 
          onclick={calculate}
          class="group flex items-center justify-center gap-2 w-full max-w-xs py-3 bg-black/20 hover:bg-black/40 border border-white/10 hover:border-purple-500/50 text-zinc-300 hover:text-white rounded-xl font-medium transition-all duration-300"
        >
          <Play class="w-4 h-4 text-zinc-400 group-hover:text-purple-400 transition-colors" />
          Resolver
        </button>
      </div>

      {#if errorMsg}
        <div class="mt-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-destructive">
          <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
          <p class="text-sm leading-relaxed">{errorMsg}</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Results Panel -->
  <div class="flex flex-col gap-6">
    {#if results.length > 0}
      <!-- Stopping criteria notice -->
      <div
        class="glass p-4 rounded-xl border-l-4 border-l-green-500 flex items-center justify-between"
      >
        <div>
          <h3 class="font-semibold text-green-400">Optimización Completada</h3>
          <p class="text-sm text-muted-foreground mt-1">
            Se alcanzó el criterio de parada: <Latex
              math="|| \nabla f(x_k) || < {tol}"
            /> en la iteración {results.length - 1}.
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs text-muted-foreground mb-1">Mínimo encontrado en</p>
          <div
            class="font-mono text-primary bg-primary/10 px-3 py-1 rounded-md text-sm border border-primary/20"
          >
            <Latex
              math="x^* \approx {formatVector(results[results.length - 1].xk)}"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Accordion of Iterations -->
        <div class="flex flex-col gap-3">
          <h3 class="text-lg font-medium">Pasos de Iteración</h3>
          <Accordion>
            {#each results as res}
              <AccordionItem
                id={`iter-${res.iteration}`}
                title={`Iteración ${res.iteration}`}
              >
                <div class="flex flex-col gap-8 text-zinc-300 text-sm md:text-base leading-relaxed px-4 py-2">
                  
                  <!-- Step 1 -->
                  <div>
                    <p class="font-bold text-white mb-4">1. Evaluar Gradiente {#if algorithm === 'newton'}y Hessiana{/if} en <Latex math={`x_{${res.iteration}} = ${formatVector(res.xk)}`} />:</p>
                    <div class="flex flex-col gap-6 items-center">
                      <div class="text-lg"><Latex math={`\\nabla f(x_{${res.iteration}}) = ${formatVector(res.grad)}`} /></div>
                      {#if algorithm === 'newton' && res.hessian}
                        <div class="text-lg overflow-x-auto max-w-full"><Latex math={`\\nabla^2 f(x_{${res.iteration}}) = ${formatMatrix(res.hessian)}`} /></div>
                      {/if}
                    </div>
                  </div>

                  <!-- Step 2 -->
                  <div>
                    <p class="font-bold text-white mb-4 flex flex-wrap items-center gap-x-1">
                      2. Calcular la dirección {#if algorithm === 'newton'}de Newton (<Latex math={`d_{${res.iteration}}`} />){:else}de descenso (<Latex math={`d_{${res.iteration}}`} />){/if}:
                    </p>
                    <div class="flex flex-col gap-4 items-center">
                      {#if algorithm === 'newton'}
                        <div class="text-lg overflow-x-auto max-w-full"><Latex math={`d_{${res.iteration}} = -[\\nabla^2 f(x_{${res.iteration}})]^{-1} \\nabla f(x_{${res.iteration}}) = ${formatVector(res.pk)}`} /></div>
                      {:else}
                        <div class="text-lg overflow-x-auto max-w-full"><Latex math={`d_{${res.iteration}} = -\\nabla f(x_{${res.iteration}}) = ${formatVector(res.pk)}`} /></div>
                      {/if}
                    </div>
                  </div>

                  <!-- Step 3 -->
                  <div>
                    <p class="font-bold text-white mb-4 flex flex-wrap items-center gap-x-1">
                      3. Actualizar al nuevo punto (<Latex math={`x_{${res.iteration + 1}}`} />):
                    </p>
                    <div class="flex flex-col gap-4 items-center">
                      <div class="text-lg overflow-x-auto max-w-full"><Latex math={`x_{${res.iteration + 1}} = x_{${res.iteration}} + d_{${res.iteration}} = ${formatVector(res.xk)} + ${formatVector(res.pk)} = ${formatVector(res.xkNext)}`} /></div>
                    </div>
                  </div>

                  <!-- Step 4 -->
                  <div>
                    <p class="font-bold text-white mb-4">4. Evaluar norma del gradiente para control:</p>
                    <div class="flex flex-col gap-4 items-center mb-6">
                      <div class="text-lg"><Latex math={`||\\nabla f(x_{${res.iteration}})|| = ${res.normGrad.toFixed(4)}`} /></div>
                    </div>
                    <p>
                      Como <Latex math={`${res.normGrad.toFixed(4)} ${res.normGrad < parseFloat(tol) ? '<' : '\\geq'} ${tol}`} />, la conclusión es 
                      <strong class="text-white">{res.normGrad < parseFloat(tol) ? 'Parar' : 'Seguir'}</strong>.
                    </p>
                  </div>

                </div>
              </AccordionItem>
            {/each}
          </Accordion>
        </div>

        <!-- Plot -->
        {#if plotPoints.length > 0}
          <div class="flex flex-col gap-3">
            <h3 class="text-lg font-medium">Trayectoria 2D</h3>
            <TrajectoryPlot points={plotPoints} />
          </div>
        {/if}
      </div>
    {:else if !errorMsg}
      <div
        class="h-full min-h-[400px] glass rounded-2xl flex flex-col items-center justify-center text-muted-foreground border-dashed border-2 border-white/5"
      >
        <Calculator class="w-12 h-12 mb-4 opacity-50" />
        <p>Configura los parámetros y presiona "Resolver"</p>
        <p class="text-sm opacity-70 mt-2">Los resultados aparecerán aquí</p>
      </div>
    {/if}
  </div>
</div>
