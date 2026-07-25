<script lang="ts">
  import katex from "katex";
  import "katex/dist/katex.min.css";

  let { math = "", displayMode = false } = $props<{
    math: string;
    displayMode?: boolean;
  }>();

  let renderedHtml = $derived(
    katex.renderToString(math, {
      throwOnError: false,
      displayMode,
      strict: false,
    }),
  );
</script>

<span class="latex-container" class:block={displayMode}>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html renderedHtml}
</span>

<style>
  .latex-container {
    color: inherit;
  }
</style>
