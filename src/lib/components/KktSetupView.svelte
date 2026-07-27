<script lang="ts">
  import { Play, Plus, Minus } from "lucide-svelte";
  import MathInput from "./MathInput.svelte";

  let {
    objective = $bindable("x_1^2 + x_2^2"),
    eqConsts = $bindable([]),
    ineqConsts = $bindable(["1 - x_1 - x_2"]),
    pointStr = $bindable("0.5, 0.5"),
    onEvaluate,
    onClear
  } = $props<{
    objective: string;
    eqConsts: string[];
    ineqConsts: string[];
    pointStr: string;
    onEvaluate: () => void;
    onClear: () => void;
  }>();

  function addEq() { eqConsts = [...eqConsts, ""]; }
  function removeEq(i: number) { eqConsts = eqConsts.filter((_: string, idx: number) => idx !== i); }
  
  function addIneq() { ineqConsts = [...ineqConsts, ""]; }
  function removeIneq(i: number) { ineqConsts = ineqConsts.filter((_: string, idx: number) => idx !== i); }

</script>

<div class="flex flex-col h-full overflow-hidden bg-[#0f131f]">
  
  <!-- SCROLLABLE CONTENT -->
  <div class="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
    <div class="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      
      <div>
        <h2 class="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase mb-2">Evaluador KKT Independiente</h2>
        <p class="text-sm text-zinc-500 leading-relaxed">
          Esta herramienta evalúa matemáticamente si un punto específico cumple las condiciones de Karush-Kuhn-Tucker (KKT). No realiza iteraciones ni búsqueda.
        </p>
      </div>

      <!-- Función Objetivo -->
      <div class="flex flex-col gap-4">
        <MathInput label="Función Objetivo f(x)" bind:value={objective} />
      </div>

      <!-- Restricciones de Desigualdad -->
      <div class="flex flex-col gap-3 mt-4">
        <div class="flex justify-between items-center">
          <span class="text-sm font-bold text-white">Desigualdad <span class="text-zinc-500 font-mono font-normal">g(x) ≤ 0</span></span>
          <button onclick={addIneq} class="text-teal-400 hover:text-teal-300 bg-teal-400/10 hover:bg-teal-400/20 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all">
            <Plus class="w-3 h-3" /> Añadir
          </button>
        </div>
        {#each ineqConsts as ineq, i}
          <div class="flex items-center gap-3">
            <div class="flex-1"><MathInput label="" bind:value={ineqConsts[i]} /></div>
            <button onclick={() => removeIneq(i)} class="p-2 text-zinc-500 hover:text-red-400 transition-colors"><Minus class="w-5 h-5"/></button>
          </div>
        {/each}
        {#if ineqConsts.length === 0}
          <div class="p-4 rounded-xl border border-dashed border-white/10 text-center text-sm text-zinc-500">Sin restricciones de desigualdad</div>
        {/if}
      </div>

      <!-- Restricciones de Igualdad -->
      <div class="flex flex-col gap-3 mt-2">
        <div class="flex justify-between items-center">
          <span class="text-sm font-bold text-white">Igualdad <span class="text-zinc-500 font-mono font-normal">h(x) = 0</span></span>
          <button onclick={addEq} class="text-teal-400 hover:text-teal-300 bg-teal-400/10 hover:bg-teal-400/20 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all">
            <Plus class="w-3 h-3" /> Añadir
          </button>
        </div>
        {#each eqConsts as eq, i}
          <div class="flex items-center gap-3">
            <div class="flex-1"><MathInput label="" bind:value={eqConsts[i]} /></div>
            <button onclick={() => removeEq(i)} class="p-2 text-zinc-500 hover:text-red-400 transition-colors"><Minus class="w-5 h-5"/></button>
          </div>
        {/each}
        {#if eqConsts.length === 0}
          <div class="p-4 rounded-xl border border-dashed border-white/10 text-center text-sm text-zinc-500">Sin restricciones de igualdad</div>
        {/if}
      </div>

      <!-- Punto a evaluar -->
      <div class="flex flex-col gap-2 mt-4">
        <label for="point-input" class="text-xs font-bold tracking-widest text-zinc-500 uppercase">Punto a Evaluar (x*)</label>
        <input id="point-input" type="text" bind:value={pointStr} placeholder="ej. 0.5, 0.5" 
               class="w-full bg-[#1e2638] text-teal-300 border border-teal-500/30 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-teal-500" />
        <span class="text-xs text-zinc-600">Escribe las coordenadas separadas por comas.</span>
      </div>

      <div class="h-8"></div>
    </div>
  </div>

  <!-- FIXED ACTION FOOTER -->
  <div class="shrink-0 px-6 lg:px-8 py-4 border-t border-white/5 bg-[#0f131f] flex gap-3">
    <button 
      onclick={onClear}
      class="w-1/3 py-2 rounded-lg bg-[#1e2638] hover:bg-red-500/20 text-zinc-400 hover:text-red-400 font-bold text-xs tracking-widest shadow-inner transition-all border border-transparent hover:border-red-500/30 flex items-center justify-center"
    >
      RESET
    </button>
    <button 
      onclick={onEvaluate}
      class="w-2/3 py-2 rounded-lg bg-gradient-to-r from-teal-400 to-emerald-400 hover:opacity-90 text-slate-900 font-bold text-sm tracking-widest shadow-[0_4px_14px_rgba(52,211,153,0.3)] transition-all flex items-center justify-center gap-2"
    >
      <Play class="w-4 h-4 fill-current" />
      EVALUAR KKT
    </button>
  </div>
</div>
