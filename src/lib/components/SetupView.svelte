<script lang="ts">
  import { Calculator, Zap, Target, Activity, Settings, Plus, Minus, ChevronDown } from "lucide-svelte";
  import { slide } from "svelte/transition";
  import MathInput from "./MathInput.svelte";
  import MatrixBuilder from "./MatrixBuilder.svelte";

  let {
    algorithm = $bindable("newton"),
    objective = $bindable("x_1^2 + x_2^2"),
    x0Dims = $bindable(2),
    x0Mat = $bindable([["1", "1"]]),
    gradMat = $bindable([["2*x_1", "2*x_2"]]),
    hessMat = $bindable([["2", "0"], ["0", "2"]]),
    eqConsts = $bindable([]),
    ineqConsts = $bindable([]),
    tol = $bindable("0.001"),
    maxIters = $bindable(50),
    stepSizeInit = $bindable(1.0),
    advancedMode = $bindable(false),
    onBegin,
    onClear
  } = $props<{
    algorithm: "gradient" | "newton" | "bfgs" | "ga";
    objective: string;
    x0Dims: number;
    x0Mat: string[][];
    gradMat: string[][];
    hessMat: string[][];
    eqConsts: string[];
    ineqConsts: string[];
    tol: string;
    maxIters: number;
    stepSizeInit: number;
    advancedMode: boolean;
    onBegin: () => void;
    onClear: () => void;
  }>();

  let sectionsOpen = $state({
    algorithm: true,
    tolerance: true,
    parameters: true,
    model: true,
    constraints: false,
    derivatives: true
  });

  function addEq() { eqConsts = [...eqConsts, ""]; }
  function removeEq(i: number) { eqConsts = eqConsts.filter((_: string, idx: number) => idx !== i); }
  
  function addIneq() { ineqConsts = [...ineqConsts, ""]; }
  function removeIneq(i: number) { ineqConsts = ineqConsts.filter((_: string, idx: number) => idx !== i); }

</script>

<div class="flex flex-col gap-8">
  <!-- Header -->
  <div class="flex items-center justify-between shrink-0">
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
        <Calculator class="w-7 h-7" />
      </div>
      <h1 class="text-2xl font-bold text-white tracking-wide">Optimization Setup</h1>
    </div>
    <button onclick={onClear} class="px-4 py-2 bg-[#1e2638] hover:bg-red-500/20 text-zinc-400 hover:text-red-400 font-bold text-sm tracking-wider uppercase rounded-xl transition-all border border-transparent hover:border-red-500/30">
      Reset All
    </button>
  </div>

  <!-- Single Column Layout for Setup -->
  <div class="flex flex-col gap-10 items-stretch pb-10">
    
    <!-- Algorithm & Config -->
    <div class="flex flex-col gap-8">
      
      <!-- Algorithms -->
      <div class="flex flex-col gap-4">
        <button onclick={() => sectionsOpen.algorithm = !sectionsOpen.algorithm} class="flex justify-between items-center w-full group">
          <h2 class="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase group-hover:text-white transition-colors">Algorithm Selection</h2>
          <ChevronDown class="w-4 h-4 text-zinc-500 transition-transform {sectionsOpen.algorithm ? 'rotate-180' : ''}" />
        </button>
        {#if sectionsOpen.algorithm}
          <div transition:slide>
            <div class="grid grid-cols-2 gap-4">
              <button onclick={() => algorithm = 'gradient'} class="flex flex-col gap-3 p-5 rounded-2xl border text-left transition-all {algorithm === 'gradient' ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-[#1e2638] border-transparent text-zinc-400 hover:border-white/10'}">
                <Activity class="w-6 h-6" />
                <span class="font-bold text-white">Gradient Descent</span>
              </button>
              <button onclick={() => algorithm = 'newton'} class="flex flex-col gap-3 p-5 rounded-2xl border text-left transition-all {algorithm === 'newton' ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-[#1e2638] border-transparent text-zinc-400 hover:border-white/10'}">
                <Target class="w-6 h-6" />
                <span class="font-bold text-white">Robust Newton</span>
              </button>
              <button onclick={() => algorithm = 'bfgs'} class="flex flex-col gap-3 p-5 rounded-2xl border text-left transition-all {algorithm === 'bfgs' ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-[#1e2638] border-transparent text-zinc-400 hover:border-white/10'}">
                <Zap class="w-6 h-6" />
                <span class="font-bold text-white">BFGS Method</span>
              </button>
              <button onclick={() => algorithm = 'ga'} class="flex flex-col gap-3 p-5 rounded-2xl border text-left transition-all {algorithm === 'ga' ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-[#1e2638] border-transparent text-zinc-400 hover:border-white/10'}">
                <Settings class="w-6 h-6" />
                <span class="font-bold text-white">Genetic Alg</span>
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Parameters -->
      <div class="flex flex-col gap-4">
        <button onclick={() => sectionsOpen.tolerance = !sectionsOpen.tolerance} class="flex justify-between items-center w-full group">
          <h2 class="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase group-hover:text-white transition-colors">Tolerance Level</h2>
          <ChevronDown class="w-4 h-4 text-zinc-500 transition-transform {sectionsOpen.tolerance ? 'rotate-180' : ''}" />
        </button>
        {#if sectionsOpen.tolerance}
          <div transition:slide>
            <div class="grid grid-cols-4 gap-3">
              <button onclick={() => tol = '0.1'} class="aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all {tol === '0.1' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-[#1e2638] border-transparent text-zinc-400 hover:bg-[#29344d]'}">
                <span class="font-bold text-xl text-white">1e-1</span>
                <span class="text-[10px] uppercase font-bold tracking-wider">Low</span>
              </button>
              <button onclick={() => tol = '0.01'} class="aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all {tol === '0.01' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#1e2638] border-transparent text-zinc-400 hover:bg-[#29344d]'}">
                <span class="font-bold text-xl text-white">1e-2</span>
                <span class="text-[10px] uppercase font-bold tracking-wider">Med</span>
              </button>
              <button onclick={() => tol = '0.001'} class="aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all {tol === '0.001' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-[#1e2638] border-transparent text-zinc-400 hover:bg-[#29344d]'}">
                <span class="font-bold text-xl text-white">1e-3</span>
                <span class="text-[10px] uppercase font-bold tracking-wider">High</span>
              </button>
              <button onclick={() => tol = '0.00001'} class="aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all {tol === '0.00001' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-[#1e2638] border-transparent text-zinc-400 hover:bg-[#29344d]'}">
                <span class="font-bold text-xl text-white">1e-5</span>
                <span class="text-[10px] uppercase font-bold tracking-wider">Max</span>
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Settings Sliders -->
      <div class="flex flex-col gap-4">
        <button onclick={() => sectionsOpen.parameters = !sectionsOpen.parameters} class="flex justify-between items-center w-full group">
          <h2 class="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase group-hover:text-white transition-colors">Hyperparameters</h2>
          <ChevronDown class="w-4 h-4 text-zinc-500 transition-transform {sectionsOpen.parameters ? 'rotate-180' : ''}" />
        </button>
        {#if sectionsOpen.parameters}
          <div transition:slide>
            <div class="setup-card p-6 flex flex-col gap-8">
              <div class="flex flex-col gap-4">
                <div class="flex justify-between items-center">
                  <label for="step-size-slider" class="text-sm font-bold text-white tracking-wide">Step Size (α₀)</label>
                  <span class="text-teal-400 font-mono text-lg bg-teal-500/10 px-3 py-1 rounded-lg">{stepSizeInit}</span>
                </div>
                <input id="step-size-slider" type="range" min="0.01" max="10" step="0.01" bind:value={stepSizeInit} class="w-full h-2 bg-[#0f131f] rounded-full appearance-none accent-teal-500" />
              </div>

              <div class="w-full h-px bg-white/5"></div>

              <div class="flex flex-col gap-4">
                <div class="flex justify-between items-center">
                  <label for="max-iterations-slider" class="text-sm font-bold text-white tracking-wide">Max Iterations</label>
                  <span class="text-teal-400 font-mono text-lg bg-teal-500/10 px-3 py-1 rounded-lg">{maxIters}</span>
                </div>
                <input id="max-iterations-slider" type="range" min="10" max="1000" bind:value={maxIters} class="w-full h-2 bg-[#0f131f] rounded-full appearance-none accent-teal-500" />
              </div>

              <div class="w-full h-px bg-white/5"></div>

              <div class="flex justify-between items-center">
                <label for="advanced-mode-toggle" class="text-sm font-bold text-white flex flex-col gap-1">
                  Advanced Mode
                  <span class="text-xs text-zinc-500 font-normal">Show trajectory graphs</span>
                </label>
                <button
                  id="advanced-mode-toggle"
                  type="button"
                  aria-label={advancedMode ? "Disable advanced mode" : "Enable advanced mode"}
                  aria-pressed={advancedMode}
                  onclick={() => advancedMode = !advancedMode}
                  class="w-14 h-8 rounded-full transition-all relative {advancedMode ? 'bg-teal-500' : 'bg-[#0f131f] border border-white/10'}"
                >
                  <div class="w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-sm {advancedMode ? 'left-7' : 'left-1'}"></div>
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
      
    </div>


    <!-- Math Models -->
    <div class="flex flex-col gap-8 pt-4 border-t border-white/5">
        <div class="flex flex-col gap-4">
          <button onclick={() => sectionsOpen.model = !sectionsOpen.model} class="flex justify-between items-center w-full group">
            <h2 class="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase group-hover:text-white transition-colors">Mathematical Model</h2>
            <ChevronDown class="w-4 h-4 text-zinc-500 transition-transform {sectionsOpen.model ? 'rotate-180' : ''}" />
          </button>
          {#if sectionsOpen.model}
            <div transition:slide>
              <div class="flex flex-col gap-6">
                <MathInput label="Función Objetivo f(x)" bind:value={objective} />
                <MatrixBuilder label="Punto Inicial x₀" type="vector" rows={1} bind:cols={x0Dims} bind:value={x0Mat} />
              </div>
            </div>
          {/if}
        </div>

        <!-- Constraints Section -->
        <div class="flex flex-col gap-4">
          <button onclick={() => sectionsOpen.constraints = !sectionsOpen.constraints} class="flex justify-between items-center w-full group">
            <h2 class="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase group-hover:text-white transition-colors">Constraints (Restricciones)</h2>
            <ChevronDown class="w-4 h-4 text-zinc-500 transition-transform {sectionsOpen.constraints ? 'rotate-180' : ''}" />
          </button>
          {#if sectionsOpen.constraints}
            <div transition:slide>
              <div class="flex flex-col gap-6">
                <!-- Equality Constraints -->
                <div class="flex flex-col gap-3">
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

                <!-- Inequality Constraints -->
                <div class="flex flex-col gap-3 mt-2">
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
              </div>
            </div>
          {/if}
        </div>

        <!-- Derivatives -->
        <div class="flex flex-col gap-4">
          <button onclick={() => sectionsOpen.derivatives = !sectionsOpen.derivatives} class="flex justify-between items-center w-full group">
            <h2 class="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase group-hover:text-white transition-colors">Derivatives (Optional if GA)</h2>
            <ChevronDown class="w-4 h-4 text-zinc-500 transition-transform {sectionsOpen.derivatives ? 'rotate-180' : ''}" />
          </button>
          {#if sectionsOpen.derivatives}
            <div transition:slide>
              <div class="flex flex-col gap-6">
                {#if algorithm !== 'ga'}
                  <MatrixBuilder label="Vector Gradiente ∇f" type="vector" rows={1} cols={x0Dims} bind:value={gradMat} />
                {/if}

                {#if algorithm === 'newton'}
                  <MatrixBuilder label="Matriz Hessiana H" type="matrix" rows={x0Dims} cols={x0Dims} bind:value={hessMat} />
                {/if}
              </div>
            </div>
          {/if}
        </div>

        <!-- START OPTIMIZATION ACTION -->
        <div class="pt-4 mt-2 border-t border-white/5">
          <button 
            onclick={onBegin}
            class="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-500 to-teal-400 hover:opacity-90 text-slate-900 font-black text-xl tracking-widest shadow-[0_10px_30px_rgba(52,211,153,0.3)] transition-all flex items-center justify-center gap-2"
          >
            BEGIN OPTIMIZATION
          </button>
        </div>
    </div>

  </div>
</div>
