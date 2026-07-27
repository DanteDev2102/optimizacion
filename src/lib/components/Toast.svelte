<script lang="ts">
  import { CheckCircle2, AlertTriangle, X } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";
  import { onMount } from "svelte";

  let {
    message,
    type = "success",
    onClose
  } = $props<{
    message: string;
    type?: "success" | "error";
    onClose: () => void;
  }>();

  onMount(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  });
</script>

<div 
  class="fixed z-50 flex items-center justify-between p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md border 
         w-[90%] left-1/2 -translate-x-1/2 top-4 
         lg:left-auto lg:-translate-x-0 lg:right-6 lg:top-auto lg:bottom-6 lg:w-auto lg:min-w-[320px] lg:max-w-[400px]
         {type === 'success' ? 'bg-[#1e2638] border-green-500/30' : 'bg-[#1e2638] border-red-500/30'}"
  in:fly={{ y: 50, duration: 400, opacity: 0 }} 
  out:fade={{ duration: 200 }}
>
  <div class="flex items-center gap-3">
    <div class="shrink-0">
      {#if type === 'success'}
        <CheckCircle2 class="w-6 h-6 text-green-400" />
      {:else}
        <AlertTriangle class="w-6 h-6 text-red-400" />
      {/if}
    </div>
    <div class="flex flex-col">
      <span class="text-xs font-bold tracking-widest uppercase {type === 'success' ? 'text-green-400' : 'text-red-400'}">
        {#if type === 'success'}
          Éxito
        {:else}
          Error
        {/if}
      </span>
      <span class="text-sm text-zinc-300 font-medium leading-tight mt-0.5">{message}</span>
    </div>
  </div>
  <button onclick={onClose} class="ml-4 p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0">
    <X class="w-5 h-5" />
  </button>
</div>
