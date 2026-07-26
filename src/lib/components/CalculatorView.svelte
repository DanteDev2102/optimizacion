<script lang="ts">
  import { ChevronLeft, Maximize2, History, AlertTriangle, CheckCircle2 } from "lucide-svelte";
  import Latex from "./Latex.svelte";
  import TrajectoryPlot from "./TrajectoryPlot.svelte";
  import type { OptimizationResult, IterationResult } from "$lib/utils/core/interfaces";

  let {
    result = null,
    errorMsg = null,
    onBack,
  } = $props<{
    result: OptimizationResult | null;
    errorMsg: string | null;
    onBack: () => void;
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

</script>

<div class="flex flex-col w-full h-full relative gap-6">
  <!-- Top Bar (Mobile only) -->
  <div class="flex items-center justify-between py-2 lg:hidden">
    <button onclick={onBack} class="w-10 h-10 rounded-full bg-[#1e2638] flex items-center justify-center text-zinc-400 hover:text-white transition-all">
      <ChevronLeft class="w-6 h-6" />
    </button>
    <span class="text-sm font-bold tracking-widest text-zinc-500 uppercase">Analysis</span>
    <div class="w-10 h-10"></div>
  </div>

  <h2 class="hidden lg:block text-sm font-bold tracking-[0.2em] text-zinc-400 uppercase pt-4">Results Dashboard</h2>

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
        
        <!-- Feasibility & KKT Check -->
        {#if result.kktViolations && result.kktViolations.length > 0}
          <div class="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col gap-1 text-left mt-2">
            <span class="text-xs font-bold uppercase text-red-400 flex items-center gap-1"><AlertTriangle class="w-4 h-4"/> Infeasible / KKT Violated:</span>
            <ul class="list-disc pl-5 text-xs text-red-300/80">
              {#each result.kktViolations as v}
                <li>{v}</li>
              {/each}
            </ul>
          </div>
        {:else if result.isFeasible !== undefined && result.isFeasible}
          <div class="w-full bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex flex-col gap-2 text-left mt-2">
            <span class="text-xs font-bold uppercase text-green-400 flex items-center gap-1"><CheckCircle2 class="w-4 h-4" /> Optimal KKT Point Found!</span>
            <div class="flex flex-col gap-1 pl-5 text-xs text-green-300/80 font-mono mt-1 border-l border-green-500/30">
              <div>Factibilidad Primal: ✅ Satisfecha</div>
              <div>LICQ (Independencia Lineal): {result.licqSatisfied ? '✅ Satisfecha' : '❌ Falló'}</div>
              <div>Estacionariedad (Lagrangiano): {result.stationaritySatisfied ? '✅ Satisfecha' : '❌ Falló'}</div>
              {#if result.lagrangeMultipliers && result.lagrangeMultipliers.length > 0}
                <div class="mt-1 flex items-center gap-2 flex-wrap">
                  Multiplicadores (λ, μ): 
                  <span class="bg-black/30 px-2 py-1 rounded text-teal-300 text-[10px]">
                     [{result.lagrangeMultipliers.map(m => m.toFixed(4)).join(', ')}]
                  </span>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if result}
    <!-- Visualization Plot -->
    {#if trajectoryPoints.length > 0}
      <TrajectoryPlot points={trajectoryPoints} width={400} height={250} />
    {/if}

    <!-- Detailed Step-by-Step History -->
    <div class="flex-1 bg-[#1e2638] rounded-3xl p-4 flex flex-col gap-4 overflow-y-auto shadow-inner border border-white/5">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <History class="w-4 h-4 text-teal-400" />
          <span class="text-xs font-bold uppercase tracking-wider text-teal-400">Step-by-step Audit</span>
        </div>
      </div>
      
      {#each result.iterations as iter, i}
        <div class="flex flex-col gap-2 p-3 rounded-2xl bg-[#0f131f] border border-white/5 transition-all hover:border-white/10">
          <!-- Header -->
          <div class="flex items-center justify-between text-xs font-bold text-zinc-400">
            <span>Iter {i}</span>
            <span class="text-zinc-500">f(x) = {iter.fxk.toFixed(6)}</span>
          </div>
          
          <!-- State Vector -->
          <div class="w-full overflow-x-auto text-sm text-zinc-300 py-1">
            <Latex math={`X_{${i}} = ${formatVector(iter.xk)}`} />
          </div>

          <!-- Gradients and Step Size -->
          {#if iter.grad || iter.hessian || iter.pk || iter.stepSize !== undefined}
            <div class="flex flex-col gap-2 mt-2 pt-2 border-t border-white/5">
              {#if iter.grad}
                <div class="w-full overflow-x-auto text-xs text-zinc-500">
                  <Latex math="\\nabla f = {formatVector(iter.grad)}" />
                </div>
              {/if}
              {#if iter.hessian}
                <div class="w-full overflow-x-auto text-xs text-zinc-500">
                  <Latex math="H_k = {formatMatrix(iter.hessian)}" />
                </div>
              {/if}
              {#if iter.pk}
                <div class="w-full overflow-x-auto text-xs text-zinc-500">
                  <Latex math="p_k = {formatVector(iter.pk)}" />
                </div>
              {/if}
              {#if iter.stepSize !== undefined}
                <div class="w-full overflow-x-auto text-xs text-teal-500/70 font-mono">
                  α_k (Step Size) = {iter.stepSize.toFixed(6)}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="w-full bg-[#1e2638] rounded-3xl p-4 flex flex-col gap-2 shadow-inner items-center justify-center border border-white/5 min-h-[250px]">
      <span class="text-xs font-bold uppercase tracking-wider text-zinc-600">Trajectory Plot</span>
      <span class="text-sm text-zinc-500 mt-2 text-center max-w-[200px]">Waiting for optimization data...</span>
    </div>
  {/if}
</div>
