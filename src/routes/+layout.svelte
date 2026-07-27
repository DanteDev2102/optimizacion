<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";

  let { children } = $props();
  let keyboardVisible = $state(false);

  onMount(() => {
    const checkKeyboard = () => {
      // @ts-ignore
      if (typeof window !== "undefined" && window.mathVirtualKeyboard) {
        // @ts-ignore
        keyboardVisible = window.mathVirtualKeyboard.visible;
      }
    };

    const interval = setInterval(checkKeyboard, 300);

    window.addEventListener("virtual-keyboard-toggle", checkKeyboard);
    window.addEventListener("focusin", checkKeyboard);
    window.addEventListener("focusout", () => setTimeout(checkKeyboard, 100));

    return () => {
      clearInterval(interval);
      window.removeEventListener("virtual-keyboard-toggle", checkKeyboard);
      window.removeEventListener("focusin", checkKeyboard);
      window.removeEventListener("focusout", checkKeyboard);
    };
  });

  function hideKeyboard() {
    // @ts-ignore
    if (typeof window !== "undefined" && window.mathVirtualKeyboard) {
      // @ts-ignore
      window.mathVirtualKeyboard.hide();
      keyboardVisible = false;
    }
  }
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
  <main class="flex-1 w-full flex flex-col h-screen relative z-10">
    <div class="flex-1 relative overflow-hidden">
      <div class="absolute inset-0">
        {@render children()}
      </div>
    </div>
  </main>
</div>

{#if keyboardVisible}
  <div class="fixed bottom-[340px] right-4 z-[9999] transition-all duration-300">
    <button 
      onclick={hideKeyboard}
      class="bg-[#1e2638]/90 backdrop-blur-md text-teal-400 font-bold px-4 py-3 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.4)] border border-teal-500/50 flex items-center gap-2 hover:bg-[#29344d] active:scale-95 transition-all"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
      Minimizar teclado
    </button>
  </div>
{/if}
