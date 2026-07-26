<script lang="ts">
  import "../app.css";
  let { children } = $props();
</script>

<div class="min-h-screen relative overflow-hidden flex flex-col">
  <!-- Decorative background elements -->
  <div
    class="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 mix-blend-screen pointer-events-none"
  ></div>
  <div
    class="absolute top-1/3 -right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl opacity-40 mix-blend-screen pointer-events-none"
  ></div>

  <!-- Main Content -->
  <main class="flex-1 w-full relative z-10">
    {@render children()}
  </main>
</div>
