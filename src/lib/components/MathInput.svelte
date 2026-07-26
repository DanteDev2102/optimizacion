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
  let labelId = `math-input-${Math.random().toString(36).slice(2, 8)}`;

  onMount(() => {
    let cleanup = () => {};

    import("mathlive").then(() => {
      if (container) {
        mathfield = document.createElement("math-field") as MathfieldElement;
        // Setup the mathfield
        mathfield.value = value;
        if (placeholder) {
          // MathLive placeholder (sometimes requires config)
          // We'll leave it empty for simplicity or use text.
        }

        // Update our bound value when the mathfield changes
        mathfield.addEventListener("input", () => {
          value = mathfield!.value;
        });

        container.appendChild(mathfield);
        cleanup = () => {
          if (container && mathfield) {
            container.removeChild(mathfield);
          }
        };
      }
    });

    return () => {
      cleanup();
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
    <span id={labelId} class="text-sm font-medium text-zinc-300 text-center">{label}</span>
  {/if}
  <!-- The container where math-field will be injected -->
  <div
    bind:this={container}
    class="w-full"
    role="textbox"
    aria-labelledby={label ? labelId : undefined}
    aria-label={label ? undefined : placeholder || "Math input"}
  ></div>
</div>
