<script lang="ts" module>
  // Context keys need to be somewhat unique
</script>

<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  let { children } = $props();

  // We use a store to keep track of the currently open item if we want an accordion
  // where only one item can be open at a time.
  const activeItem = writable<string | null>(null);

  setContext("accordion", {
    activeItem,
    toggleItem: (id: string) => {
      activeItem.update((current) => (current === id ? null : id));
    },
  });
</script>

<div class="flex flex-col gap-2 w-full">
  {@render children()}
</div>
