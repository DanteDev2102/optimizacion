<script lang="ts">
  import { ChevronLeft, Maximize2, History, AlertTriangle, CheckCircle2, FileBarChart2 } from "lucide-svelte";
  import { slide } from "svelte/transition";
  import Latex from "./Latex.svelte";
  import TrajectoryPlot from "./TrajectoryPlot.svelte";
  import type { OptimizationResult, IterationResult } from "$lib/utils/core/interfaces";

  let {
    result = null,
    errorMsg = null,
  } = $props<{
    result: OptimizationResult | null;
    errorMsg: string | null;
  }>();

  function formatVector(vec: number[] | undefined): string {
    if (!vec) return "\\text{N/A}";
    if (vec.length <= 4) {
      return `\\begin{bmatrix} ${vec.map(v => v.toFixed(4)).join(' \\\\ ')} \\end{bmatrix}`;
    }
    return `\\begin{bmatrix} ${vec[0].toFixed(4)} \\\\ ${vec[1].toFixed(4)} \\\\ \\dots \\\\ ${vec[vec.length-1].toFixed(4)} \\end{bmatrix}`;
  }

  function formatMatrix(mat: number[][]): string {
    return `\\begin{bmatrix} ${mat.map(row => row.map(v => v.toFixed(4)).join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;
  }

  // Derive points for D3 Trajectory (using first two dimensions)
  let trajectoryPoints = $derived(
    result ? result.iterations.map(i => [i.xk[0] || 0, i.xk[1] || 0] as [number, number]) : []
  );

  let activeTab = $state<"calculos" | "graficas">("calculos");

</script>

<div class="flex flex-col w-full min-h-full relative gap-6">
  <h2 class="text-sm font-bold tracking-[0.2em] text-zinc-400 uppercase">Results Dashboard</h2>

  <!-- Main Display (Optimal Solution) -->
  <div class="shrink-0 flex flex-col justify-end min-h-[150px]">
    {#if errorMsg}
      <div class="text-red-400 text-lg text-right p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
        {errorMsg}
      </div>
    {:else if result}
      <div class="flex flex-col gap-2 w-full animate-fade-in">
        <div class="flex justify-between items-end mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-teal-500 bg-teal-500/10 px-2 py-1 rounded-md">
            {result.exitCondition}
          </span>
          <span class="text-zinc-500 text-sm font-mono">{result.iterations.length} Iterations</span>
        </div>
        
        <div class="text-4xl text-white font-mono tracking-wide w-full overflow-x-auto custom-scrollbar text-right pb-4">
          <Latex math="x^* \approx {formatVector(result.solution)}" />
        </div>
        
        <!-- KKT Analysis Dashboard -->
        {#if result.kktAnalysis}
          <div class="w-full bg-[#1e2638]/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 text-left mt-2 shadow-inner" transition:slide>
            
            <div class="flex items-center justify-between pb-2 border-b border-white/5">
              <div class="flex items-center gap-2 text-zinc-400">
                <FileBarChart2 class="w-4 h-4" />
                <span class="text-xs font-bold uppercase tracking-widest">KKT Analysis</span>
              </div>
              <div class="flex items-center gap-2">
                {#if result.kktAnalysis.isFeasible}
                  <span class="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                    <CheckCircle2 class="w-3 h-3" /> Feasible & Optimal
                  </span>
                {:else}
                  <span class="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                    <AlertTriangle class="w-3 h-3" /> Infeasible / Not Optimal
                  </span>
                {/if}
              </div>
            </div>

            <!-- Conditions Check -->
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1 p-2 rounded-xl bg-black/20 border border-white/5 transition-all hover:border-white/10">
                <span class="text-[10px] text-zinc-500 uppercase tracking-widest">Stationarity</span>
                <div class="flex items-center gap-2 text-sm font-bold {result.kktAnalysis.stationarity ? 'text-teal-400' : 'text-red-400'}">
                  {#if result.kktAnalysis.stationarity} <CheckCircle2 class="w-4 h-4"/> Satisfied {:else} <AlertTriangle class="w-4 h-4"/> Failed {/if}
                </div>
              </div>
              <div class="flex flex-col gap-1 p-2 rounded-xl bg-black/20 border border-white/5 transition-all hover:border-white/10">
                <span class="text-[10px] text-zinc-500 uppercase tracking-widest">Complementarity</span>
                <div class="flex items-center gap-2 text-sm font-bold {result.kktAnalysis.complementarity ? 'text-teal-400' : 'text-red-400'}">
                  {#if result.kktAnalysis.complementarity} <CheckCircle2 class="w-4 h-4"/> Satisfied {:else} <AlertTriangle class="w-4 h-4"/> Failed {/if}
                </div>
              </div>
            </div>

            <!-- Lagrange Multipliers -->
            {#if result.kktAnalysis.lagrangeMultipliersEq.length > 0 || result.kktAnalysis.lagrangeMultipliersIneq.length > 0}
              <div class="flex flex-col gap-2 pt-2">
                <span class="text-[10px] text-zinc-500 uppercase tracking-widest">Lagrange Multipliers</span>
                <div class="grid grid-cols-2 gap-3">
                  {#if result.kktAnalysis.lagrangeMultipliersEq.length > 0}
                    <div class="flex flex-col gap-1">
                      {#each result.kktAnalysis.lagrangeMultipliersEq as lambda, i}
                        <div class="flex items-center justify-between text-sm text-zinc-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                          <Latex math="\lambda_{i+1}" />
                          <span class="font-mono text-teal-400">{lambda.toFixed(4)}</span>
                        </div>
                      {/each}
                    </div>
                  {/if}
                  {#if result.kktAnalysis.lagrangeMultipliersIneq.length > 0}
                    <div class="flex flex-col gap-1">
                      {#each result.kktAnalysis.lagrangeMultipliersIneq as mu, i}
                        <div class="flex items-center justify-between text-sm text-zinc-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                          <Latex math="\mu_{i+1}" />
                          <span class="font-mono text-teal-400">{mu.toFixed(4)}</span>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            {/if}

            <!-- Violations List -->
            {#if !result.kktAnalysis.isFeasible && result.kktAnalysis.violations.length > 0}
              <div class="flex flex-col gap-1 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <span class="text-[10px] text-red-400 font-bold uppercase tracking-widest">Violations Details</span>
                <ul class="list-disc pl-4 text-xs text-red-300/80">
                  {#each result.kktAnalysis.violations as v}
                    <li>{v}</li>
                  {/each}
                </ul>
              </div>
            {/if}

          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if result}
    <!-- Timeline Header Tabs -->
    <div class="flex gap-4 mt-4 shrink-0">
      <button 
        onclick={() => activeTab = 'calculos'}
        class="px-6 py-2 rounded-xl text-sm font-bold tracking-widest uppercase transition-all border {activeTab === 'calculos' ? 'bg-teal-500/20 text-teal-400 border-teal-500/50' : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/20'}"
      >
        Cálculos
      </button>
      <button 
        onclick={() => activeTab = 'graficas'}
        class="px-6 py-2 rounded-xl text-sm font-bold tracking-widest uppercase transition-all border {activeTab === 'graficas' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/20'}"
      >
        Gráficas
      </button>
    </div>

    <!-- Timeline Feed -->
    <div class="flex-1 flex flex-col gap-6 w-full pt-4">
      {#each result.iterations as iter, i}
        <div class="flex flex-col rounded-3xl bg-[#1e2638] border border-white/5 overflow-hidden shadow-lg transition-all hover:border-white/10">
          
          <!-- Card Header -->
          <div class="flex items-center justify-between px-6 py-4 bg-[#0a0d14]/50 border-b border-white/5">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold font-mono text-sm">
                {i}
              </div>
              <span class="text-sm font-bold tracking-[0.2em] text-zinc-300 uppercase">Iteración: {i}</span>
            </div>
            <span class="text-xs font-mono text-zinc-500 bg-black/20 px-3 py-1 rounded-lg">
              f(x) = {iter.fxk.toFixed(6)}
            </span>
          </div>
          
          <!-- Card Content -->
          <div class="p-6">
            {#if activeTab === 'calculos'}
              <div class="flex flex-col gap-6" transition:slide>
                <!-- State Vector -->
                <div class="w-full overflow-x-auto">
                  <Latex math={`X_{${i}} = ${formatVector(iter.xk)}`} />
                </div>

                <!-- Gradients and Step Size -->
                {#if iter.grad || iter.hessian || iter.pk || iter.stepSize !== undefined}
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    {#if iter.grad}
                      <div class="w-full overflow-x-auto bg-black/20 p-4 rounded-xl border border-white/5">
                        <span class="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Gradiente</span>
                        <Latex math="\\nabla f = {formatVector(iter.grad)}" />
                      </div>
                    {/if}
                    {#if iter.hessian}
                      <div class="w-full overflow-x-auto bg-black/20 p-4 rounded-xl border border-white/5">
                        <span class="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Hessiana</span>
                        <Latex math="H_k = {formatMatrix(iter.hessian)}" />
                      </div>
                    {/if}
                    {#if iter.pk}
                      <div class="w-full overflow-x-auto bg-black/20 p-4 rounded-xl border border-white/5">
                        <span class="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Dirección de Búsqueda</span>
                        <Latex math="p_k = {formatVector(iter.pk)}" />
                      </div>
                    {/if}
                    {#if iter.stepSize !== undefined}
                      <div class="w-full overflow-x-auto bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                        <span class="block text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Tamaño de Paso</span>
                        <Latex math={`\\alpha_k = ${iter.stepSize.toFixed(6)}`} />
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            {:else}
              <div transition:slide>
                {#if trajectoryPoints.length > 0}
                  <TrajectoryPlot points={trajectoryPoints.slice(0, i + 1)} width={600} height={280} />
                {/if}
              </div>
            {/if}
          </div>
          
        </div>
      {/each}
    </div>
  {/if}
</div>
