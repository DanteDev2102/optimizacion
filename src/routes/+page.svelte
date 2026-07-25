<script lang="ts">
  import SetupView from "$lib/components/SetupView.svelte";
  import CalculatorView from "$lib/components/CalculatorView.svelte";
  import { runOptimization } from "$lib/utils/optimization";
  import type { OptimizationResult } from "$lib/utils/core/interfaces";

  let view = $state<"setup" | "calculator">("setup");
  
  // States
  let algorithm = $state<"gradient" | "newton" | "bfgs" | "ga">("newton");
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
    result = null;
    errorMsg = null;
    view = "setup";
  }

  function calculate() {
    errorMsg = null;
    result = null;
    view = "calculator"; // For mobile toggle
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
          c1: 1e-4,
          c2: 0.9,
          populationSize: 50,
          generations: maxIters
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
<div class="absolute inset-0 flex flex-col lg:flex-row bg-[#0f131f] p-2 lg:p-4 gap-4 lg:gap-8 overflow-hidden">
  
  <!-- LEFT PANEL: Setup (50% width on desktop) -->
  <div class="w-full lg:w-1/2 h-full flex-col overflow-y-auto custom-scrollbar 
              {view === 'setup' ? 'flex' : 'hidden lg:flex'}">
    <!-- Fluid content with generous padding but no max-width restriction -->
    <div class="w-full py-6 lg:py-8 px-4 lg:px-8">
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
        onBegin={calculate}
        onClear={clearAll}
      />
    </div>
  </div>

  <!-- RIGHT PANEL: Calculator / Results Sidebar (50% width on desktop) -->
  <div class="w-full lg:w-1/2 h-full flex-col relative overflow-hidden lg:border-l lg:border-white/5
              {view === 'calculator' ? 'flex' : 'hidden lg:flex'}">
    
    <div class="w-full h-full py-6 lg:py-8 px-4 lg:px-8 overflow-y-auto custom-scrollbar">
      <CalculatorView 
        {result}
        {errorMsg}
        onBack={() => view = 'setup'}
      />
    </div>
  </div>
  
</div>
