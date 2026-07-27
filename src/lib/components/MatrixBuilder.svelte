<script lang="ts">
  import { Plus, Minus } from "lucide-svelte";
  import Latex from "./Latex.svelte";
  import MathInput from "./MathInput.svelte";

  let {
    rows = $bindable(2),
    cols = $bindable(2),
    label = "Matrix",
    type = "matrix",
    value = $bindable([["0", "0"], ["0", "0"]]),
    focusedCell = $bindable<{r: number, c: number} | null>(null),
    readonlyDimensions = false
  } = $props<{
    rows?: number;
    cols?: number;
    label?: string;
    type?: "matrix" | "vector";
    value: string[][];
    focusedCell?: {r: number, c: number} | null;
    readonlyDimensions?: boolean;
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
    if (value[r][c] === "0") {
      value[r][c] = "";
    }
  }

  function handleBlur() {
    if (!focusedCell) return;
    let val = value[focusedCell.r][focusedCell.c] || "";
    // Remove leading zeros before digits (e.g. 06 -> 6, 007x -> 7x)
    // Matches 0s at the start of string or after non-alphanumeric, followed by a digit
    val = val.replace(/(^|[^a-zA-Z0-9.])0+(?=\d)/g, '$1');
    if (val.trim() === "") {
      val = "0";
    }
    value[focusedCell.r][focusedCell.c] = val;
    focusedCell = null;
  }



  const labelId = `matrix-builder-${Math.random().toString(36).slice(2, 8)}`;
</script>

<div class="flex flex-col gap-4 w-full" role="group" aria-labelledby={labelId}>
  <!-- Header & Controls -->
  <div class="flex items-center justify-between">
    <span id={labelId} class="text-xs font-bold tracking-wide text-teal-400 uppercase">{label}</span>
    
    <div class="flex items-center gap-3">
      {#if !readonlyDimensions}
        {#if type === 'matrix'}
          <div class="flex items-center gap-1">
            <button onclick={decRows} class="w-6 h-6 flex items-center justify-center rounded-full bg-[#1e2638] text-zinc-400 hover:text-white"><Minus class="w-3 h-3"/></button>
            <span class="text-xs font-mono w-4 text-center">{rows}</span>
            <button onclick={incRows} class="w-6 h-6 flex items-center justify-center rounded-full bg-[#1e2638] text-zinc-400 hover:text-white"><Plus class="w-3 h-3"/></button>
          </div>
          <span class="text-xs text-zinc-600">×</span>
        {/if}
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
              <button 
                class="w-14 h-14 md:w-16 md:h-16 rounded-xl border flex items-center justify-center text-sm md:text-base transition-all outline-none overflow-hidden {focusedCell?.r === r && focusedCell?.c === c ? 'border-teal-400 bg-teal-400/10 text-teal-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'border-[#29344d] bg-[#1e2638] text-zinc-300 hover:border-zinc-500'}"
                onclick={() => handleFocus(r, c)}
              >
                <div class="w-full h-full px-1 md:px-2 flex items-center justify-center overflow-hidden whitespace-nowrap pointer-events-none">
                  <div class="max-w-full overflow-hidden whitespace-nowrap">
                    <Latex math={value[r][c] || "0"} />
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/each}
      </div>

      <div class="absolute right-0 top-0 bottom-0 w-3 border-2 border-l-0 border-zinc-500 rounded-r-lg"></div>
    </div>
  </div>
</div>

{#if focusedCell}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div class="bg-[#1e2638] border border-teal-500/30 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
      <div class="flex justify-between items-center">
        <span class="text-teal-400 font-bold">Editar Celda ({focusedCell.r + 1}, {focusedCell.c + 1})</span>
        <button onclick={handleBlur} class="text-zinc-400 hover:text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="w-full text-2xl bg-teal-400/10 border border-teal-400 rounded-xl p-2 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
        <MathInput 
          bind:value={value[focusedCell.r][focusedCell.c]}
          autofocus={true}
        />
      </div>
      <button 
        onclick={handleBlur}
        class="w-full py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-bold transition-colors"
      >
        Confirmar
      </button>
    </div>
  </div>
{/if}
