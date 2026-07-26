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
  <main class="flex-1 flex flex-col h-screen relative z-10">
    <!-- Top Navigation -->
    <div class="w-full flex items-center justify-center gap-4 py-4 z-50">
      <a href="/" class="px-6 py-2 rounded-full text-sm font-bold tracking-widest uppercase transition-all bg-[#1e2638] text-zinc-400 hover:text-white border border-white/5 hover:border-teal-500/50">
        Optimizador
      </a>
      <a href="/kkt" class="px-6 py-2 rounded-full text-sm font-bold tracking-widest uppercase transition-all bg-[#1e2638] text-zinc-400 hover:text-white border border-white/5 hover:border-teal-500/50">
        Evaluador KKT
      </a>
    </div>
    
    <div class="flex-1 relative overflow-hidden">
      <div class="absolute inset-0">
        {@render children()}
      </div>
    </div>
  </main>
</div>
