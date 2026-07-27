<script lang="ts">
  import { Calculator, Zap, Target, Activity, Settings, Plus, Minus, ChevronDown, Cpu, Lock, PanelLeftClose, PanelLeftOpen, ChevronRight, Binary, ListTree, Sliders } from "lucide-svelte";
  import { slide } from "svelte/transition";
  import MathInput from "./MathInput.svelte";
  import MatrixBuilder from "./MatrixBuilder.svelte";

  let {
    isMinimized = $bindable(false),
    algorithm = $bindable("newton"),
    objective = $bindable("x_1^2 + x_2^2"),
    x0Dims = $bindable(2),
    x0Mat = $bindable([["1", "1"]]),
    gradMat = $bindable([["2*x_1", "2*x_2"]]),
    hessMat = $bindable([["2", "0"], ["0", "2"]]),
    eqConsts = $bindable([]),
    ineqConsts = $bindable([]),
    tol = $bindable("0.001"),
    tolX = $bindable("0.001"),
    penaltyMethod = $bindable("external"),
    populationSize = $bindable(50),
    maxIters = $bindable(50),
    stepSizeInit = $bindable(1.0),
    advancedMode = $bindable(false),
    lineSearchStrategy = $bindable("backtracking"),
    mHistory = $bindable(5),
    c1 = $bindable(1e-4),
    c2 = $bindable(0.9),
    contractionFactor = $bindable(0.5),
    searchBoundsMin = $bindable([["-10", "-10"]]),
    searchBoundsMax = $bindable([["10", "10"]]),
    onBegin,
    onClear
  } = $props<{
    algorithm: "gradient" | "newton" | "bfgs" | "sr1" | "dfp" | "lbfgs" | "ga";
    objective: string;
    x0Dims: number;
    x0Mat: string[][];
    gradMat: string[][];
    hessMat: string[][];
    eqConsts: string[];
    ineqConsts: string[];
    tol: string;
    tolX: string;
    penaltyMethod: "external" | "barrier";
    populationSize: number;
    maxIters: number;
    stepSizeInit: number;
    advancedMode: boolean;
    lineSearchStrategy: "backtracking" | "zoom" | "constant";
    mHistory: number;
    c1: number;
    c2: number;
    contractionFactor: number;
    searchBoundsMin: string[][];
    searchBoundsMax: string[][];
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

  let currentPreset = $state("");

  function loadPreset(preset: string) {
    currentPreset = preset;
    if (preset === "esfera") {
      objective = "x_1^2 + x_2^2";
      x0Dims = 2;
      x0Mat = [["10", "10"]];
      gradMat = [["2*x_1", "2*x_2"]];
      hessMat = [["2", "0"], ["0", "2"]];
      eqConsts = [];
      ineqConsts = [];
      algorithm = "newton";
    } else if (preset === "rosenbrock") {
      objective = "(1 - x_1)^2 + 100 * (x_2 - x_1^2)^2";
      x0Dims = 2;
      x0Mat = [["-1.2", "1"]];
      gradMat = [["-2 * (1 - x_1) - 400 * x_1 * (x_2 - x_1^2)", "200 * (x_2 - x_1^2)"]];
      hessMat = [["2 - 400 * (x_2 - 3 * x_1^2)", "-400 * x_1"], ["-400 * x_1", "200"]];
      eqConsts = [];
      ineqConsts = [];
      algorithm = "bfgs";
    } else if (preset === "himmelblau") {
      objective = "(x_1^2 + x_2 - 11)^2 + (x_1 + x_2^2 - 7)^2";
      x0Dims = 2;
      x0Mat = [["0", "0"]];
      gradMat = [["4 * x_1 * (x_1^2 + x_2 - 11) + 2 * (x_1 + x_2^2 - 7)", "2 * (x_1^2 + x_2 - 11) + 4 * x_2 * (x_1 + x_2^2 - 7)"]];
      hessMat = [["12 * x_1^2 + 4 * x_2 - 42", "4 * x_1 + 4 * x_2"], ["4 * x_1 + 4 * x_2", "12 * x_2^2 + 4 * x_1 - 26"]];
      eqConsts = [];
      ineqConsts = [];
      algorithm = "newton";
    } else if (preset === "kkt") {
      objective = "x_1^2 + x_2^2";
      x0Dims = 2;
      x0Mat = [["2", "2"]];
      gradMat = [["2*x_1", "2*x_2"]];
      hessMat = [["2", "0"], ["0", "2"]];
      eqConsts = ["x_1 + x_2 - 1"];
      ineqConsts = [];
      algorithm = "newton";
    }
  }

</script>

<div class="flex flex-col h-full overflow-hidden bg-[#0f131f]">
  
  <!-- SCROLLABLE CONTENT -->
  <div class="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
    <div class="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      


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
              <button onclick={() => algorithm = 'sr1'} class="flex flex-col gap-3 p-5 rounded-2xl border text-left transition-all {algorithm === 'sr1' ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-[#1e2638] border-transparent text-zinc-400 hover:border-white/10'}">
                <Target class="w-6 h-6" />
                <span class="font-bold text-white">SR1 Method</span>
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
        {#if algorithm !== 'ga'}
          <div class="flex flex-col gap-4">
            <button onclick={() => sectionsOpen.tolerance = !sectionsOpen.tolerance} class="flex justify-between items-center w-full group">
              <h2 class="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase group-hover:text-white transition-colors">
                <Target class="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors"/> Tolerance Level
              </h2>
              <ChevronDown class="w-4 h-4 text-zinc-500 transition-transform {sectionsOpen.tolerance ? 'rotate-180' : ''}" />
            </button>
            {#if sectionsOpen.tolerance}
              <div transition:slide>
                <div class="grid grid-cols-4 gap-2">
                  <button onclick={() => tol = '0.1'} class="py-2 rounded-xl border flex flex-col items-center justify-center transition-all {tol === '0.1' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-[#1e2638] border-transparent text-zinc-400 hover:bg-[#29344d]'}">
                    <span class="font-bold text-xl text-white">1e-1</span>
                    <span class="text-[10px] uppercase font-bold tracking-wider">Low</span>
                  </button>
                  <button onclick={() => tol = '0.01'} class="py-2 rounded-xl border flex flex-col items-center justify-center transition-all {tol === '0.01' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#1e2638] border-transparent text-zinc-400 hover:bg-[#29344d]'}">
                    <span class="font-bold text-xl text-white">1e-2</span>
                    <span class="text-[10px] uppercase font-bold tracking-wider">Med</span>
                  </button>
                  <button onclick={() => tol = '0.001'} class="py-2 rounded-xl border flex flex-col items-center justify-center transition-all {tol === '0.001' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-[#1e2638] border-transparent text-zinc-400 hover:bg-[#29344d]'}">
                    <span class="font-bold text-xl text-white">1e-3</span>
                    <span class="text-[10px] uppercase font-bold tracking-wider">High</span>
                  </button>
                  <button onclick={() => tol = '0.00001'} class="py-2 rounded-xl border flex flex-col items-center justify-center transition-all {tol === '0.00001' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-[#1e2638] border-transparent text-zinc-400 hover:bg-[#29344d]'}">
                    <span class="font-bold text-xl text-white">1e-5</span>
                    <span class="text-[10px] uppercase font-bold tracking-wider">Max</span>
                  </button>
                </div>
                <div class="flex justify-between items-center mt-4">
                  <label class="text-sm font-bold text-white flex flex-col gap-1">
                    Tolerancia de Paso (ε₂)
                    <span class="text-xs text-zinc-500 font-normal">Para convergencia en ||x - x0||</span>
                  </label>
                  <input type="number" step="0.0001" bind:value={tolX} class="w-24 text-right text-teal-400 font-mono text-base bg-teal-500/10 px-2 py-1 rounded-lg border border-transparent focus:border-teal-400 outline-none" />
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Settings Sliders -->
        <div class="flex flex-col gap-4">
          <button onclick={() => sectionsOpen.parameters = !sectionsOpen.parameters} class="flex justify-between items-center w-full group">
            <h2 class="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase group-hover:text-white transition-colors">
              <Settings class="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors"/> Hyperparameters
            </h2>
            <ChevronDown class="w-4 h-4 text-zinc-500 transition-transform {sectionsOpen.parameters ? 'rotate-180' : ''}" />
          </button>
          {#if sectionsOpen.parameters}
            <div transition:slide>
              <div class="setup-card p-4 flex flex-col gap-4">
                <!-- Global Params -->
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between items-center">
                    <label class="text-sm font-bold text-white tracking-wide">Max Iterations</label>
                    <input type="number" min="1" bind:value={maxIters} class="w-24 text-right text-teal-400 font-mono text-base bg-teal-500/10 px-2 py-1 rounded-lg border border-transparent focus:border-teal-400 outline-none" />
                  </div>
                  <input type="range" min="10" max="1000" bind:value={maxIters} class="w-full h-2 bg-[#0f131f] rounded-full appearance-none accent-teal-500" />
                </div>
                {#if algorithm === 'ga'}
                  <div class="flex flex-col gap-2 mt-2">
                    <div class="flex justify-between items-center">
                      <label class="text-sm font-bold text-white tracking-wide">Population Size</label>
                      <input type="number" min="10" max="1000" bind:value={populationSize} class="w-24 text-right text-teal-400 font-mono text-base bg-teal-500/10 px-2 py-1 rounded-lg border border-transparent focus:border-teal-400 outline-none" />
                    </div>
                    <input type="range" min="10" max="1000" bind:value={populationSize} class="w-full h-2 bg-[#0f131f] rounded-full appearance-none accent-teal-500" />
                  </div>
                {/if}

                {#if algorithm !== 'ga'}
                  <div class="w-full h-px bg-white/5"></div>
                  <!-- Descent Specific Params -->
                  <div class="flex flex-col gap-2">
                    <div class="flex justify-between items-center">
                      <label class="text-sm font-bold text-white tracking-wide">Step Size (α₀)</label>
                      <input type="number" min="0.01" step="0.01" bind:value={stepSizeInit} class="w-24 text-right text-teal-400 font-mono text-base bg-teal-500/10 px-2 py-1 rounded-lg border border-transparent focus:border-teal-400 outline-none" />
                    </div>
                    <input type="range" min="0.01" max="10" step="0.01" bind:value={stepSizeInit} class="w-full h-2 bg-[#0f131f] rounded-full appearance-none accent-teal-500" />
                  </div>

                  <div class="w-full h-px bg-white/5"></div>

                  <div class="flex flex-col gap-2">
                    <div class="flex justify-between items-center">
                      <label class="text-sm font-bold text-white tracking-wide">Line Search Strategy</label>
                      <select 
                        bind:value={lineSearchStrategy} 
                        class="bg-[#0f131f] border border-white/10 rounded-lg px-3 py-1 text-teal-400 font-mono text-sm outline-none focus:border-teal-400 transition-colors"
                      >
                        <option value="backtracking">Backtracking (Armijo)</option>
                        <option value="zoom">Strong Wolfe (Zoom / Cubic)</option>
                        <option value="constant">Constant</option>
                      </select>
                    </div>
                  </div>
                  
                  {#if lineSearchStrategy === 'backtracking' || lineSearchStrategy === 'zoom'}
                    <div class="flex flex-col gap-2 mt-2">
                      <div class="flex justify-between items-center">
                        <label for="c1-input" class="text-sm font-bold text-white tracking-wide">Armijo (c₁)</label>
                        <input id="c1-input" type="number" min="0" max="1" step="0.0001" bind:value={c1} class="w-24 text-right text-teal-400 font-mono text-base bg-teal-500/10 px-2 py-1 rounded-lg border border-transparent focus:border-teal-400 outline-none" />
                      </div>
                    </div>
                    {#if lineSearchStrategy === 'zoom'}
                      <div class="flex flex-col gap-2 mt-2">
                        <div class="flex justify-between items-center">
                          <label for="c2-input" class="text-sm font-bold text-white tracking-wide">Wolfe (c₂)</label>
                          <input id="c2-input" type="number" min="0" max="1" step="0.1" bind:value={c2} class="w-24 text-right text-teal-400 font-mono text-base bg-teal-500/10 px-2 py-1 rounded-lg border border-transparent focus:border-teal-400 outline-none" />
                        </div>
                      </div>
                    {/if}
                    {#if lineSearchStrategy === 'backtracking'}
                      <div class="flex flex-col gap-2 mt-2">
                        <div class="flex justify-between items-center">
                          <label for="rho-input" class="text-sm font-bold text-white tracking-wide">Contraction (ρ)</label>
                          <input id="rho-input" type="number" min="0.01" max="0.99" step="0.1" bind:value={contractionFactor} class="w-24 text-right text-teal-400 font-mono text-base bg-teal-500/10 px-2 py-1 rounded-lg border border-transparent focus:border-teal-400 outline-none" />
                        </div>
                      </div>
                    {/if}
                  {/if}

                  {#if algorithm === 'lbfgs'}
                    <div class="w-full h-px bg-white/5 mt-2" transition:slide></div>
                    <div class="flex flex-col gap-2 mt-2" transition:slide>
                      <div class="flex justify-between items-center">
                        <label for="m-input" class="text-sm font-bold text-white tracking-wide">L-BFGS Memory (m)</label>
                        <input id="m-input" type="number" min="3" max="50" step="1" bind:value={mHistory} class="w-24 text-right text-teal-400 font-mono text-base bg-teal-500/10 px-2 py-1 rounded-lg border border-transparent focus:border-teal-400 outline-none" />
                      </div>
                    </div>
                  {/if}
                {/if}

                <div class="w-full h-px bg-white/5 mt-2"></div>

                <div class="flex justify-between items-center mt-2">
                  <label for="advanced-btn" class="text-sm font-bold text-white flex flex-col gap-1">
                    Advanced Mode
                    <span class="text-xs text-zinc-500 font-normal">Show trajectory graphs</span>
                  </label>
                  <button 
                    id="advanced-btn"
                    aria-label="Toggle Advanced Mode"
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
      <!-- Math Models -->
      <div class="flex flex-col gap-8 pt-8 border-t border-white/5">
          <div class="flex flex-col gap-4">
            <button onclick={() => sectionsOpen.model = !sectionsOpen.model} class="flex justify-between items-center w-full group">
              <h2 class="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase group-hover:text-white transition-colors">
                <Binary class="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors"/> Mathematical Model
              </h2>
              <ChevronDown class="w-4 h-4 text-zinc-500 transition-transform {sectionsOpen.model ? 'rotate-180' : ''}" />
            </button>
            {#if sectionsOpen.model}
              <div transition:slide>
                <div class="flex flex-col gap-4">
                  <!-- Preset Selector -->
                  <div class="flex flex-col gap-2 bg-teal-500/5 p-4 rounded-xl border border-teal-500/20">
                    <label class="text-xs font-bold text-teal-400 uppercase tracking-widest">Cargar Problema de Prueba</label>
                    <select 
                      class="bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm outline-none focus:border-teal-400 transition-colors w-full"
                      bind:value={currentPreset}
                      onchange={(e) => loadPreset((e.target as HTMLSelectElement).value)}
                    >
                      <option value="">-- Personalizado / Ninguno --</option>
                      <option value="esfera">Esfera (Convexa Simple)</option>
                      <option value="rosenbrock">Rosenbrock (Valle Estrecho)</option>
                      <option value="himmelblau">Himmelblau (Múltiples Mínimos)</option>
                      <option value="kkt">Restricción KKT (Igualdad)</option>
                    </select>
                  </div>

                  <MathInput label="Función Objetivo f(x)" bind:value={objective} />
                  {#if algorithm !== 'ga'}
                    <MatrixBuilder label="Punto Inicial x₀" type="vector" rows={1} bind:cols={x0Dims} bind:value={x0Mat} readonlyDimensions={true} />
                  {/if}
                  {#if algorithm === 'ga'}
                    <div class="flex flex-col gap-4 mt-4 p-4 bg-black/20 rounded-xl border border-teal-500/30">
                      <h3 class="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2"><Target class="w-4 h-4"/> Límite de Búsqueda (Exploración Global)</h3>
                      <MatrixBuilder label="Límite Inferior (Min)" type="vector" rows={1} bind:cols={x0Dims} bind:value={searchBoundsMin} readonlyDimensions={true} />
                      <MatrixBuilder label="Límite Superior (Max)" type="vector" rows={1} bind:cols={x0Dims} bind:value={searchBoundsMax} readonlyDimensions={true} />
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>

          <!-- Constraints Section -->
          <div class="flex flex-col gap-4">
            <button onclick={() => sectionsOpen.constraints = !sectionsOpen.constraints} class="flex justify-between items-center w-full group">
              <h2 class="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase group-hover:text-white transition-colors">
                <Lock class="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors"/> Constraints (Restricciones)
              </h2>
              <ChevronDown class="w-4 h-4 text-zinc-500 transition-transform {sectionsOpen.constraints ? 'rotate-180' : ''}" />
            </button>
            {#if sectionsOpen.constraints}
              <div transition:slide>
                <div class="flex flex-col gap-4">
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
                  {#if algorithm !== 'ga'}
                    <div class="flex justify-between items-center mt-4 p-3 bg-[#0f131f] rounded-xl border border-white/5">
                      <label class="text-sm font-bold text-white flex flex-col gap-1">
                        Método de Restricción
                        <span class="text-xs text-zinc-500 font-normal">Transformación del problema</span>
                      </label>
                      <select 
                        bind:value={penaltyMethod} 
                        class="bg-transparent border border-white/10 rounded-lg px-3 py-1 text-teal-400 font-mono text-sm outline-none focus:border-teal-400 transition-colors"
                      >
                        <option value="external">Penalty (External)</option>
                        <option value="barrier">Log Barrier (Interior)</option>
                      </select>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>

          <!-- Derivatives -->
          {#if algorithm !== 'ga'}
            <div class="flex flex-col gap-4">
              <button onclick={() => sectionsOpen.derivatives = !sectionsOpen.derivatives} class="flex justify-between items-center w-full group">
                <h2 class="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase group-hover:text-white transition-colors">
                  <Activity class="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors"/> Derivatives
                </h2>
                <ChevronDown class="w-4 h-4 text-zinc-500 transition-transform {sectionsOpen.derivatives ? 'rotate-180' : ''}" />
              </button>
              {#if sectionsOpen.derivatives}
                <div transition:slide>
                  <div class="flex flex-col gap-4">
                    <MatrixBuilder label="Vector Gradiente ∇f" type="vector" rows={1} cols={x0Dims} bind:value={gradMat} readonlyDimensions={true} />
                    {#if algorithm === 'newton'}
                      <MatrixBuilder label="Matriz Hessiana H" type="matrix" rows={x0Dims} cols={x0Dims} bind:value={hessMat} readonlyDimensions={true} />
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          {/if}

      </div>
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
      onclick={onBegin}
      class="w-2/3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-teal-400 hover:opacity-90 text-slate-900 font-bold text-sm tracking-widest shadow-[0_4px_14px_rgba(52,211,153,0.3)] transition-all flex items-center justify-center gap-2"
    >
      BEGIN
    </button>
  </div>
</div>
