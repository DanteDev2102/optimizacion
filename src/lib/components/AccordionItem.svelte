<script lang="ts">
  import { getContext } from "svelte";
  import { slide } from "svelte/transition";
  import { ChevronDown } from "lucide-svelte";
  import type { Writable } from "svelte/store";

  let { id, title, children } = $props<{
    id: string;
    title: string;
    children: any;
  }>();

  const accordionContext = getContext<{
    activeItem: Writable<string | null>;
    toggleItem: (id: string) => void;
  }>("accordion");

  const { activeItem, toggleItem } = accordionContext;

  let isOpen = $derived($activeItem === id);
</script>

<div
  class="border border-white/10 rounded-lg overflow-hidden glass transition-colors duration-200"
>
  <button
    class="w-full px-4 py-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
    onclick={() => toggleItem(id)}
    aria-expanded={isOpen}
  >
    <span class="font-medium text-foreground">{title}</span>
    <ChevronDown
      class="w-5 h-5 text-muted-foreground transition-transform duration-200 {isOpen
        ? 'rotate-180'
        : ''}"
    />
  </button>

  {#if isOpen}
    <div
      transition:slide={{ duration: 200 }}
      class="px-4 py-4 border-t border-white/10"
    >
      {@render children()}
    </div>
  {/if}
</div>
