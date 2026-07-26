<script lang="ts">
  import { Plus, Minus } from "lucide-svelte";
  import Latex from "./Latex.svelte";

  let {
    rows = $bindable(2),
    cols = $bindable(2),
    label = "Matrix",
    type = "matrix",
    value = $bindable([["0", "0"], ["0", "0"]]),
    focusedCell = $bindable<{r: number, c: number} | null>(null)
  } = $props<{
    rows?: number;
    cols?: number;
    label?: string;
    type?: "matrix" | "vector";
    value: string[][];
    focusedCell?: {r: number, c: number} | null;
  }>();

  function updateDim() {
    const newMatrix = Array(rows).fill(null).map(() => Array(cols).fill("0"));
    for(let r=0; r < Math.min(rows, value.length); r++) {
      for(let c=0; c < Math.min(cols, value[0]?.length || 0); c++) {
        newMatrix[r][c] = value[r][c] || "0";
      }
    }
    value = newMatrix;
    focusedCell = null;
  }

  function incRows() { if (rows < 5) { rows++; updateDim(); } }
  function decRows() { if (rows > 1) { rows--; updateDim(); } }
  function incCols() { if (cols < 5) { cols++; updateDim(); } }
  function decCols() { if (cols > 1) { cols--; updateDim(); } }

  function handleFocus(r: number, c: number) {
    focusedCell = { r, c };
  }

  function focusEl(node: HTMLInputElement) {
    node.focus();
  }

  const labelId = `matrix-builder-${Math.random().toString(36).slice(2, 8)}`;
</script>

<div class="flex flex-col gap-4 w-full" role="group" aria-labelledby={labelId}>
  <!-- Header & Controls -->
  <div class="flex items-center justify-between">
    <span id={labelId} class="text-xs font-bold tracking-wide text-teal-400 uppercase">{label}</span>
    
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1">
        <button onclick={decRows} class="w-6 h-6 flex items-center justify-center rounded-full bg-[#1e2638] text-zinc-400 hover:text-white"><Minus class="w-3 h-3"/></button>
        <span class="text-xs font-mono w-4 text-center">{rows}</span>
        <button onclick={incRows} class="w-6 h-6 flex items-center justify-center rounded-full bg-[#1e2638] text-zinc-400 hover:text-white"><Plus class="w-3 h-3"/></button>
      </div>
      {#if type === 'matrix'}
        <span class="text-xs text-zinc-600">×</span>
        <div class="flex items-center gap-1">
          <button onclick={decCols} class="w-6 h-6 flex items-center justify-center rounded-full bg-[#1e2638] text-zinc-400 hover:text-white"><Minus class="w-3 h-3"/></button>
          <span class="text-xs font-mono w-4 text-center">{cols}</span>
          <button onclick={incCols} class="w-6 h-6 flex items-center justify-center rounded-full bg-[#1e2638] text-zinc-400 hover:text-white"><Plus class="w-3 h-3"/></button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Matrix Visual Component -->
  <div class="flex justify-center w-full my-2">
    <div class="relative px-4 inline-block">
      <div class="absolute left-0 top-0 bottom-0 w-3 border-2 border-r-0 border-zinc-500 rounded-l-lg"></div>
      
      <div class="flex flex-col gap-2 py-2 px-3">
        {#each value as row, r}
          <div class="flex gap-2">
            {#each row as col, c}
              {#if focusedCell?.r === r && focusedCell?.c === c}
                <input 
                  type="text"
                  class="w-14 h-14 md:w-16 md:h-16 rounded-xl border text-center text-lg font-mono transition-all outline-none border-teal-400 bg-teal-400/10 text-teal-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                  bind:value={value[r][c]}
                  onblur={() => focusedCell = null}
                  use:focusEl
                />
              {:else}
                <button 
                  class="w-14 h-14 md:w-16 md:h-16 rounded-xl border flex items-center justify-center text-sm md:text-base transition-all outline-none overflow-hidden border-[#29344d] bg-[#1e2638] text-zinc-300 hover:border-zinc-500"
                  onclick={() => handleFocus(r, c)}
                >
                  <Latex math={value[r][c] || "0"} />
                </button>
              {/if}
            {/each}
          </div>
        {/each}
      </div>

      <div class="absolute right-0 top-0 bottom-0 w-3 border-2 border-l-0 border-zinc-500 rounded-r-lg"></div>
    </div>
  </div>
</div>
