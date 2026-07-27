<script lang="ts">
  import SetupView from "$lib/components/SetupView.svelte";
  import CalculatorView from "$lib/components/CalculatorView.svelte";
  import { Calculator, PanelLeftClose, PanelLeftOpen } from "lucide-svelte";
  import KktSetupView from "$lib/components/KktSetupView.svelte";
  import KKTEvaluatorView from "$lib/components/KKTEvaluatorView.svelte";
  import { checkKKT } from "$lib/utils/algorithms/Constraints";
  import { parseObjective, runOptimization } from "$lib/utils/optimization";
  import type { OptimizationResult } from "$lib/utils/core/interfaces";
  import Toast from "$lib/components/Toast.svelte";

  let isMinimized = $state(false);
  
  // Modes
  let mode = $state<'optimizador' | 'kkt'>('optimizador');
  let algorithm = $state<"gradient" | "newton" | "bfgs" | "dfp" | "lbfgs" | "ga">("gradient");
  let objective = $state("x_1^2 + x_2^2");
  let x0Dims = $state(2);
  let x0Mat = $state([["1", "1"]]);
  let gradMat = $state([["2x_1", "2x_2"]]);
  let hessMat = $state([["2", "0"], ["0", "2"]]);
  let eqConsts = $state<string[]>([]);
  let ineqConsts = $state<string[]>([]);
  let tol = $state("0.001");
  let tolX = $state("0.001");
  let penaltyMethod = $state<"external" | "barrier">("external");
  let populationSize = $state(50);
  let maxIters = $state(50);
  let stepSizeInit = $state(1.0);
  let advancedMode = $state(false);
  let lineSearchStrategy = $state<"backtracking" | "zoom" | "constant">("backtracking");
  let mHistory = $state(5);
  
  let c1 = $state(1e-4);
  let c2 = $state(0.9);
  let contractionFactor = $state(0.5);
  let searchBoundsMin = $state([["-10", "-10"]]);
  let searchBoundsMax = $state([["10", "10"]]);

  let result = $state<OptimizationResult | null>(null);
  let errorMsg = $state<string | null>(null);

  // KKT States
  let kktPointStr = $state("0.5, 0.5");
  let kktResult = $state<any>(null);
  let kktErrorMsg = $state<string | null>(null);

  // Toast Notification State
  let toast = $state<{message: string, type: 'success' | 'error'} | null>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    toast = { message, type };
  }
  
  function closeToast() {
    toast = null;
  }

  function setMode(newMode: 'optimizador' | 'kkt') {
    if (mode === newMode) return;
    mode = newMode;
    clearAll();
  }

  function clearAll() {
    // algorithm = "newton"; // Removed so RESET keeps selected algorithm
    objective = "x_1^2 + x_2^2";
    x0Dims = 2;
    x0Mat = [["1", "1"]];
    gradMat = [["2x_1", "2x_2"]];
    hessMat = [["2", "0"], ["0", "2"]];
    eqConsts = [];
    ineqConsts = [];
    tol = "0.001";
    tolX = "0.001";
    penaltyMethod = "external";
    populationSize = 50;
    maxIters = 50;
    stepSizeInit = 1.0;
    advancedMode = false;
    lineSearchStrategy = "backtracking";
    mHistory = 5;
    c1 = 1e-4;
    c2 = 0.9;
    contractionFactor = 0.5;
    searchBoundsMin = [["-10", "-10"]];
    searchBoundsMax = [["10", "10"]];
    result = null;
    errorMsg = null;
    
    kktPointStr = "0.5, 0.5";
    kktResult = null;
    kktErrorMsg = null;
  }

  function evaluateKKT() {
    kktErrorMsg = null;
    kktResult = null;
    if (typeof window !== 'undefined' && window.innerWidth < 750) {
      isMinimized = true;
    }
    try {
      if (!objective.trim()) throw new Error("Falta la función objetivo.");
      if (!kktPointStr.trim()) throw new Error("Debes ingresar el punto a evaluar.");

      const f = parseObjective(objective);
      const parsedEq = eqConsts.filter(c => c.trim() !== "").map(c => parseObjective(c));
      const parsedIneq = ineqConsts.filter(c => c.trim() !== "").map(c => parseObjective(c));

      const point = kktPointStr.split(',').map(s => {
        const n = parseFloat(s.trim());
        if (isNaN(n)) throw new Error("El punto contiene valores inválidos. Separa los números por comas.");
        return n;
      });

      kktResult = checkKKT(point, f, null, parsedEq, parsedIneq, 1e-4);
      showToast("Evaluación KKT finalizada con éxito.", "success");
      
    } catch (err: any) {
      kktErrorMsg = err.message || "Ocurrió un error en el cálculo.";
      showToast(kktErrorMsg, "error");
    }
  }

  function calculate() {
    errorMsg = null;
    result = null;
    if (typeof window !== 'undefined' && window.innerWidth < 750) {
      isMinimized = true;
    }
    
    // Dar tiempo al navegador para renderizar el panel colapsado y limpiar el resultado anterior
    setTimeout(() => {
      try {
        result = runOptimization(
          algorithm,
          objective,
          algorithm !== 'ga' ? gradMat : null,
          algorithm === 'newton' ? hessMat : null,
          x0Mat,
          {
            tolerance: parseFloat(tol) || 0.001,
            toleranceX: parseFloat(tolX) || 0.001,
            penaltyMethod,
            stepSize: stepSizeInit,
            maxIterations: maxIters,
            c1,
            c2,
            populationSize,
            generations: maxIters,
            lineSearchStrategy,
            mHistory,
            contractionFactor,
            searchBounds: { 
              min: searchBoundsMin[0].map(Number), 
              max: searchBoundsMax[0].map(Number) 
            }
          },
          eqConsts,
          ineqConsts
        );
        showToast("Optimización completada exitosamente.", "success");
      } catch (err: any) {
        errorMsg = err.message || "Ocurrió un error en el cálculo.";
        showToast(errorMsg, "error");
      }
    }, 50);
  }

  // Auto-detect dimensions from objective function
  $effect(() => {
    if (!objective) return;
    
    // MathLive outputs x_1 or x_{12}, so we match both
    const matches = [...objective.matchAll(/x_\{?(\d+)\}?/g)];
    let newDims = 1;
    if (matches.length > 0) {
      newDims = Math.max(...matches.map(m => parseInt(m[1], 10)));
    }
    
    if (newDims !== x0Dims) {
      x0Dims = newDims;
      
      // Resize x0Mat (1 x n)
      const newX0 = Array(1).fill(null).map(() => Array(newDims).fill("0"));
      for (let c = 0; c < Math.min(newDims, x0Mat[0]?.length || 0); c++) {
        newX0[0][c] = x0Mat[0][c] || "0";
      }
      x0Mat = newX0;

      // Resize searchBoundsMin (1 x n)
      const newBoundsMin = Array(1).fill(null).map(() => Array(newDims).fill("-10"));
      for (let c = 0; c < Math.min(newDims, searchBoundsMin[0]?.length || 0); c++) {
        newBoundsMin[0][c] = searchBoundsMin[0][c] || "-10";
      }
      searchBoundsMin = newBoundsMin;

      // Resize searchBoundsMax (1 x n)
      const newBoundsMax = Array(1).fill(null).map(() => Array(newDims).fill("10"));
      for (let c = 0; c < Math.min(newDims, searchBoundsMax[0]?.length || 0); c++) {
        newBoundsMax[0][c] = searchBoundsMax[0][c] || "10";
      }
      searchBoundsMax = newBoundsMax;

      // Resize gradMat (1 x n)
      const newGrad = Array(1).fill(null).map(() => Array(newDims).fill("0"));
      for (let c = 0; c < Math.min(newDims, gradMat[0]?.length || 0); c++) {
        newGrad[0][c] = gradMat[0][c] || "0";
      }
      gradMat = newGrad;

      // Resize hessMat (n x n)
      const newHess = Array(newDims).fill(null).map(() => Array(newDims).fill("0"));
      for (let r = 0; r < Math.min(newDims, hessMat.length); r++) {
        for (let c = 0; c < Math.min(newDims, hessMat[r]?.length || 0); c++) {
          newHess[r][c] = hessMat[r][c] || "0";
        }
      }
      hessMat = newHess;
    }
  });
</script>

<svelte:head>
  <style>
    body {
      background-color: #0f131f !important;
      margin: 0;
      padding: 0;
      overflow: hidden; /* App takes over scrolling */
    }
  </style>
</svelte:head>

<!-- TRUE FULLSCREEN RESPONSIVE LAYOUT -->
<div class="relative w-full h-full flex flex-col bg-[#0f131f] overflow-hidden">
  
  <!-- GLOBAL HEADER -->
  <header class="w-full h-14 shrink-0 border-b border-white/5 px-6 lg:px-8 flex items-center gap-3 bg-[#0f131f] z-10">
    <button onclick={() => isMinimized = !isMinimized} class="p-2 -ml-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
      {#if isMinimized}
        <PanelLeftOpen class="w-6 h-6" />
      {:else}
        <PanelLeftClose class="w-6 h-6" />
      {/if}
    </button>
    <h1 class="text-xl font-bold text-white tracking-wide truncate capitalize">Optimization Setup</h1>
  </header>

  <!-- MAIN CONTENT SPLIT -->
  <div class="flex-1 flex flex-row overflow-hidden relative">
    
    <!-- RIGHT PANEL and LEFT PANEL exist in the same relative container -->

    <!-- LEFT PANEL: Setup -->
    <div class="h-full flex-col transition-all duration-500 ease-in-out bg-[#0f131f] flex shrink-0 overflow-hidden
                absolute z-20 w-full {isMinimized ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100 pointer-events-auto'} 
                min-[750px]:relative min-[750px]:max-w-none 
                {isMinimized ? 'min-[750px]:w-0 min-[750px]:opacity-0 min-[750px]:border-none min-[750px]:pointer-events-none' : 'min-[750px]:w-[500px] min-[750px]:opacity-100 min-[750px]:border-r min-[750px]:border-white/5 min-[750px]:translate-x-0 min-[750px]:pointer-events-auto'} 
                shadow-2xl min-[750px]:shadow-none">
      
      <!-- Mode Selection Tabs INSIDE LEFT PANEL -->
      <div class="w-full px-6 pt-6 pb-2 shrink-0">
        <div class="flex p-1.5 bg-black/40 border border-white/10 rounded-xl">
          <button onclick={() => setMode('optimizador')} class="flex-1 py-2 px-2 text-center text-xs font-bold tracking-widest uppercase rounded-lg transition-all {mode === 'optimizador' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50 shadow-md' : 'text-zinc-500 hover:text-white hover:bg-white/5'}">
            Optimizador
          </button>
          <button onclick={() => setMode('kkt')} class="flex-1 py-2 px-2 text-center text-xs font-bold tracking-widest uppercase rounded-lg transition-all {mode === 'kkt' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50 shadow-md' : 'text-zinc-500 hover:text-white hover:bg-white/5'}">
            Evaluador KKT
          </button>
        </div>
      </div>

      <!-- Fluid content wrapper -->
      <div class="w-full h-full min-w-[300px] flex-1 overflow-hidden">
        {#if mode === 'optimizador'}
          <SetupView 
            bind:algorithm
            bind:objective
            bind:x0Dims
            bind:x0Mat
            bind:gradMat
            bind:hessMat
            bind:eqConsts
            bind:ineqConsts
            bind:tol
            bind:tolX
            bind:penaltyMethod
            bind:populationSize
            bind:maxIters
            bind:stepSizeInit
            bind:advancedMode
            bind:lineSearchStrategy
            bind:mHistory
            bind:c1
            bind:c2
            bind:contractionFactor
            bind:searchBoundsMin
            bind:searchBoundsMax
            onBegin={calculate}
            onClear={clearAll}
          />
        {:else}
          <KktSetupView 
            bind:objective={objective}
            bind:eqConsts={eqConsts}
            bind:ineqConsts={ineqConsts}
            bind:pointStr={kktPointStr}
            onEvaluate={evaluateKKT}
            onClear={clearAll}
          />
        {/if}
      </div>
    </div>

    <!-- RIGHT PANEL: Calculator / Results Sidebar -->
    <div class="h-full flex-col relative overflow-hidden transition-all duration-500 ease-in-out bg-[#141926] 
                flex w-full shrink-0 z-0">
    
      <div class="w-full h-full p-6 lg:p-8 overflow-y-auto custom-scrollbar flex flex-col">
        <h2 class="text-sm font-bold tracking-[0.2em] text-zinc-400 uppercase shrink-0 mb-6">Results Dashboard</h2>
        
        <div class="flex-1 flex flex-col relative w-full">
          {#if mode === 'optimizador'}
            <CalculatorView 
              {result}
              {errorMsg}
              objective={objective}
              equalityConstraints={eqConsts}
              inequalityConstraints={ineqConsts}
              dimensions={x0Dims}
            />
          {:else}
            <KKTEvaluatorView 
              result={kktResult}
              errorMsg={kktErrorMsg}
            />
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- TOAST NOTIFICATIONS -->
  {#if toast}
    <Toast message={toast.message} type={toast.type} onClose={closeToast} />
  {/if}
</div>
