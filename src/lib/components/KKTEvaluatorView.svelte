<script lang="ts">
  import { CheckCircle2, AlertTriangle } from "lucide-svelte";
  import Latex from "./Latex.svelte";

  let {
    result = null,
    errorMsg = null
  } = $props<{
    result: any;
    errorMsg: string | null;
  }>();

</script>

<div class="flex flex-col w-full h-full relative gap-6">

  <div class="shrink-0 flex flex-col min-h-[150px]">
    {#if errorMsg}
      <div class="text-red-400 text-lg p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
        {errorMsg}
      </div>
    {:else if result}
      <div class="flex flex-col gap-4 w-full animate-fade-in">
        
        {#if result.violations && result.violations.length > 0}
          <div class="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col gap-2 text-left">
            <span class="text-sm font-bold uppercase text-red-400 flex items-center gap-2"><AlertTriangle class="w-5 h-5"/> Solución Infactible / KKT Violado</span>
            <ul class="list-disc pl-5 text-sm text-red-300/80">
              {#each result.violations as v}
                <li>{v}</li>
              {/each}
            </ul>
          </div>
        {:else if result.isFeasible !== undefined && result.isFeasible}
          <div class="w-full bg-green-500/10 border border-green-500/20 rounded-xl p-6 flex flex-col gap-4 text-left shadow-lg">
            <div class="flex items-center gap-3 border-b border-green-500/20 pb-4">
               <CheckCircle2 class="w-8 h-8 text-green-400" />
               <span class="text-xl font-bold uppercase text-green-400 tracking-wider">Punto Óptimo KKT Confirmado</span>
            </div>
            
            <div class="flex flex-col gap-3 pl-2 text-sm text-green-300/90 font-mono mt-2">
              <div class="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                <span>Factibilidad Primal (Restricciones):</span>
                <span>✅ Satisfecha</span>
              </div>
              <div class="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                <span>LICQ (Independencia Lineal):</span>
                <span>{result.licqSatisfied ? '✅ Satisfecha' : '❌ Falló'}</span>
              </div>
              <div class="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                <span>Estacionariedad (Lagrangiano = 0):</span>
                <span>{result.stationaritySatisfied ? '✅ Satisfecha' : '❌ Falló'}</span>
              </div>
              {#if result.lagrangeMultipliers && result.lagrangeMultipliers.length > 0}
                <div class="mt-4 flex flex-col gap-2 bg-black/30 p-4 rounded-lg border border-teal-500/20">
                  <span class="text-teal-400 font-bold tracking-widest uppercase text-xs">Multiplicadores (λ, μ):</span> 
                  <div class="text-teal-300 text-base font-bold">
                     [{result.lagrangeMultipliers.map((m: number) => m.toFixed(4)).join(', ')}]
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
