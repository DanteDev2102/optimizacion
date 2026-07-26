<script lang="ts">
  import { Play } from "lucide-svelte";
  import KKTEvaluatorView from "$lib/components/KKTEvaluatorView.svelte";
  import { parseObjective } from "$lib/utils/optimization";
  import { checkKKT } from "$lib/utils/algorithms/Constraints";

  let objective = $state("x_1^2 + x_2^2");
  let eqConsts = $state<string[]>([]);
  let ineqConsts = $state<string[]>(["1 - x_1 - x_2"]);
  let pointStr = $state("0.5, 0.5");
  
  let result = $state<any>(null);
  let errorMsg = $state<string | null>(null);

  function evaluate() {
    errorMsg = null;
    result = null;
    try {
      if (!objective.trim()) throw new Error("Falta la función objetivo.");
      if (!pointStr.trim()) throw new Error("Debes ingresar el punto a evaluar.");

      const f = parseObjective(objective);
      const parsedEq = eqConsts.filter(c => c.trim() !== "").map(c => parseObjective(c));
      const parsedIneq = ineqConsts.filter(c => c.trim() !== "").map(c => parseObjective(c));

      const point = pointStr.split(',').map(s => {
        const n = parseFloat(s.trim());
        if (isNaN(n)) throw new Error("El punto contiene valores inválidos. Separa los números por comas.");
        return n;
      });

      result = checkKKT(point, f, null, parsedEq, parsedIneq, 1e-4);
      
    } catch (err: any) {
      errorMsg = err.message || "Ocurrió un error en el cálculo.";
    }
  }
</script>

<!-- TRUE FULLSCREEN RESPONSIVE LAYOUT -->
<div class="relative w-full h-full flex flex-col bg-[#0f131f] overflow-hidden">
  
  <!-- GLOBAL HEADER -->
  <header class="w-full h-14 shrink-0 border-b border-white/5 px-6 lg:px-8 flex items-center gap-3 bg-[#0f131f] z-10">
    <h1 class="text-xl font-bold text-white tracking-wide truncate capitalize">Optimization Setup</h1>
  </header>

  <!-- MAIN CONTENT SPLIT -->
  <div class="flex-1 flex flex-row overflow-hidden relative">
    
    <!-- LEFT PANEL: Setup -->
    <div class="h-full flex-col bg-[#0f131f] flex shrink-0 w-full lg:w-[500px] border-r border-white/5 overflow-y-auto custom-scrollbar">
      <div class="w-full py-6 lg:py-8 px-6 lg:px-8">
        
        <div class="flex flex-col gap-6">
          
          <!-- Mode Selection Tabs -->
          <div class="flex p-1.5 bg-black/40 border border-white/10 rounded-xl">
            <a href="/" class="flex-1 py-2 px-2 text-center text-xs font-bold tracking-widest uppercase rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
              Optimizador
            </a>
            <a href="/kkt" class="flex-1 py-2 px-2 text-center text-xs font-bold tracking-widest uppercase rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/50 shadow-md transition-all">
              Evaluador KKT
            </a>
          </div>

          <div>
            <h2 class="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase mb-2">Evaluador KKT Independiente</h2>
            <p class="text-sm text-zinc-500 leading-relaxed">
              Esta herramienta evalúa matemáticamente si un punto específico cumple las condiciones de Karush-Kuhn-Tucker (KKT). No realiza iteraciones ni búsqueda.
            </p>
          </div>

          <!-- Función Objetivo -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold tracking-widest text-zinc-500 uppercase">Función Objetivo f(x)</label>
            <input type="text" bind:value={objective} placeholder="ej. x_1^2 + x_2^2" 
                   class="w-full bg-[#1e2638] text-white border border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-teal-500" />
          </div>

          <!-- Restricciones -->
          <div class="flex flex-col gap-4 mt-2">
            <label class="text-xs font-bold tracking-widest text-zinc-500 uppercase">Restricciones de Desigualdad (g(x) ≤ 0)</label>
            {#each ineqConsts as constr, i}
              <div class="flex gap-2">
                <input type="text" bind:value={ineqConsts[i]} placeholder="ej. 1 - x_1 - x_2" 
                       class="flex-1 bg-[#1e2638] text-white border border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-teal-500" />
                <button onclick={() => ineqConsts = ineqConsts.filter((_, idx) => idx !== i)} 
                        class="px-4 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20">X</button>
              </div>
            {/each}
            <button onclick={() => ineqConsts = [...ineqConsts, ""]} 
                    class="text-xs font-bold text-teal-500 self-start hover:text-teal-400">+ Añadir Desigualdad</button>
          </div>

          <div class="flex flex-col gap-4 mt-2">
            <label class="text-xs font-bold tracking-widest text-zinc-500 uppercase">Restricciones de Igualdad (h(x) = 0)</label>
            {#each eqConsts as constr, i}
              <div class="flex gap-2">
                <input type="text" bind:value={eqConsts[i]} placeholder="ej. x_1 + x_2 - 2" 
                       class="flex-1 bg-[#1e2638] text-white border border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-teal-500" />
                <button onclick={() => eqConsts = eqConsts.filter((_, idx) => idx !== i)} 
                        class="px-4 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20">X</button>
              </div>
            {/each}
            <button onclick={() => eqConsts = [...eqConsts, ""]} 
                    class="text-xs font-bold text-teal-500 self-start hover:text-teal-400">+ Añadir Igualdad</button>
          </div>

          <!-- Punto a evaluar -->
          <div class="flex flex-col gap-2 mt-2">
            <label class="text-xs font-bold tracking-widest text-zinc-500 uppercase">Punto a Evaluar (x*)</label>
            <input type="text" bind:value={pointStr} placeholder="ej. 0.5, 0.5" 
                   class="w-full bg-[#1e2638] text-teal-300 border border-teal-500/30 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-teal-500" />
            <span class="text-xs text-zinc-600">Escribe las coordenadas separadas por comas.</span>
          </div>

          <!-- Acción -->
          <button onclick={evaluate} class="mt-4 w-full py-4 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 text-black font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_0_30px_rgba(45,212,191,0.3)] pb-4">
            <Play class="w-5 h-5 fill-current" />
            Evaluar Condiciones KKT
          </button>
          
          <div class="h-8"></div>
        </div>
      </div>
    </div>

    <!-- RIGHT PANEL: Results -->
    <div class="flex-1 h-full flex-col relative overflow-hidden flex bg-[#0f131f]">
      <div class="w-full h-full py-6 lg:py-8 px-6 lg:px-8 overflow-y-auto custom-scrollbar">
        <KKTEvaluatorView 
          {result}
          {errorMsg}
        />
      </div>
    </div>

  </div>
</div>
