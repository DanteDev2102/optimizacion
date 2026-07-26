<script lang="ts">
  import SetupView from "$lib/components/SetupView.svelte";
  import CalculatorView from "$lib/components/CalculatorView.svelte";
  import { Calculator, PanelLeftClose, PanelLeftOpen } from "lucide-svelte";
  import { runOptimization } from "$lib/utils/optimization";
  import type { OptimizationResult } from "$lib/utils/core/interfaces";

  let isMinimized = $state(false);
  
  // States
  let algorithm = $state<"gradient" | "newton" | "bfgs" | "dfp" | "lbfgs" | "ga">("newton");
  let objective = $state("x_1^2 + x_2^2");
  let x0Dims = $state(2);
  let x0Mat = $state([["1", "1"]]);
  let gradMat = $state([["2x_1", "2x_2"]]);
  let hessMat = $state([["2", "0"], ["0", "2"]]);
  let eqConsts = $state<string[]>([]);
  let ineqConsts = $state<string[]>([]);
  let tol = $state("0.001");
  let maxIters = $state(50);
  let stepSizeInit = $state(1.0);
  let advancedMode = $state(false);
  let lineSearchStrategy = $state<"backtracking" | "exact" | "constant">("backtracking");
  let mHistory = $state(5);
  
  let c1 = $state(1e-4);
  let c2 = $state(0.9);
  let contractionFactor = $state(0.5);

  let result = $state<OptimizationResult | null>(null);
  let errorMsg = $state<string | null>(null);

  function clearAll() {
    algorithm = "newton";
    objective = "x_1^2 + x_2^2";
    x0Dims = 2;
    x0Mat = [["1", "1"]];
    gradMat = [["2x_1", "2x_2"]];
    hessMat = [["2", "0"], ["0", "2"]];
    eqConsts = [];
    ineqConsts = [];
    tol = "0.001";
    maxIters = 50;
    stepSizeInit = 1.0;
    advancedMode = false;
    lineSearchStrategy = "backtracking";
    mHistory = 5;
    c1 = 1e-4;
    c2 = 0.9;
    contractionFactor = 0.5;
    result = null;
    errorMsg = null;
    isMinimized = false;
  }

  function calculate() {
    errorMsg = null;
    result = null;
    if (typeof window !== 'undefined' && window.innerWidth < 750) {
      isMinimized = true;
    }
    try {
      result = runOptimization(
        algorithm,
        objective,
        algorithm !== 'ga' ? gradMat : null,
        algorithm === 'newton' ? hessMat : null,
        x0Mat,
        {
          tolerance: parseFloat(tol) || 0.001,
          stepSize: stepSizeInit,
          maxIterations: maxIters,
          c1,
          c2,
          populationSize: 50,
          generations: maxIters,
          lineSearchStrategy,
          mHistory,
          contractionFactor
        },
        eqConsts,
        ineqConsts
      );
    } catch (err: any) {
      errorMsg = err.message || "Ocurrió un error en el cálculo.";
    }
  }
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
    
    <div class="h-full flex-col transition-all duration-500 ease-in-out bg-[#0f131f] flex shrink-0
                {isMinimized ? 'w-0 opacity-0 overflow-hidden' : 'w-full lg:w-[500px] opacity-100'}">
      
      <!-- Fluid content wrapper -->
      <div class="w-full h-full min-w-[300px]">
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
        bind:maxIters
        bind:stepSizeInit
        bind:advancedMode
        bind:lineSearchStrategy
        bind:mHistory
        bind:c1
        bind:c2
        bind:contractionFactor
        onBegin={calculate}
        onClear={clearAll}
      />
      </div>
    </div>

    <!-- RIGHT PANEL: Calculator / Results Sidebar -->
    <div class="h-full flex-col relative overflow-hidden transition-all duration-500 ease-in-out bg-[#141926] lg:border-l lg:border-white/5
                flex flex-1 min-w-full lg:min-w-0">
    
    <div class="w-full h-full p-6 lg:p-8 overflow-y-auto custom-scrollbar">
      <CalculatorView 
        {result}
        {errorMsg}
      />
    </div>
    </div>
  </div>
</div>
