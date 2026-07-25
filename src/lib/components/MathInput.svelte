<script lang="ts">
  import { onMount } from "svelte";
  import type { MathfieldElement } from "mathlive";

  let {
    value = $bindable(""),
    label = "",
    placeholder = "",
  } = $props<{
    value?: string;
    label?: string;
    placeholder?: string;
  }>();

  let mathfield: MathfieldElement | null = $state(null);
  let container: HTMLDivElement | null = $state(null);

  onMount(async () => {
    // Only import mathlive on the client side
    await import("mathlive");

    if (container) {
      mathfield = document.createElement("math-field") as MathfieldElement;
      // Setup the mathfield
      mathfield.value = value;
      if (placeholder) {
        // MathLive placeholder (sometimes requires config)
        // We'll leave it empty for simplicity or use text.
      }

      // Update our bound value when the mathfield changes
      mathfield.addEventListener("input", (ev) => {
        value = mathfield!.value;
      });

      container.appendChild(mathfield);
    }

    return () => {
      if (container && mathfield) {
        container.removeChild(mathfield);
      }
    };
  });

  // Watch for external value changes
  $effect(() => {
    if (mathfield && mathfield.value !== value) {
      mathfield.value = value;
    }
  });
</script>

<div class="flex flex-col items-center gap-1.5 w-full">
  {#if label}
    <label class="text-sm font-medium text-zinc-300 text-center">{label}</label>
  {/if}
  <!-- The container where math-field will be injected -->
  <div bind:this={container} class="w-full"></div>
</div>
