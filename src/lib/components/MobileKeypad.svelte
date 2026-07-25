<script lang="ts">
  import { Delete } from "lucide-svelte";
  
  let { 
    onKeyPress, 
    onBackspace, 
    onClear 
  } = $props<{
    onKeyPress: (key: string) => void;
    onBackspace: () => void;
    onClear: () => void;
  }>();

  const keys = [
    { label: "C", action: onClear, type: "normal" },
    { label: "( )", action: () => onKeyPress("()"), type: "normal" },
    { label: "%", action: () => onKeyPress("%"), type: "normal" },
    { label: "÷", action: () => onKeyPress("/"), type: "primary" },
    
    { label: "7", action: () => onKeyPress("7"), type: "normal" },
    { label: "8", action: () => onKeyPress("8"), type: "normal" },
    { label: "9", action: () => onKeyPress("9"), type: "normal" },
    { label: "×", action: () => onKeyPress("*"), type: "primary" },
    
    { label: "4", action: () => onKeyPress("4"), type: "normal" },
    { label: "5", action: () => onKeyPress("5"), type: "normal" },
    { label: "6", action: () => onKeyPress("6"), type: "normal" },
    { label: "-", action: () => onKeyPress("-"), type: "primary" },
    
    { label: "1", action: () => onKeyPress("1"), type: "normal" },
    { label: "2", action: () => onKeyPress("2"), type: "normal" },
    { label: "3", action: () => onKeyPress("3"), type: "normal" },
    { label: "+", action: () => onKeyPress("+"), type: "primary" },
    
    { label: ".", action: () => onKeyPress("."), type: "normal" },
    { label: "0", action: () => onKeyPress("0"), type: "normal" },
    { label: "⌫", action: onBackspace, type: "normal", icon: true },
    { label: "=", action: () => onKeyPress("="), type: "success" }
  ];
</script>

<div class="grid grid-cols-4 gap-3 p-4 bg-[#161c2d] rounded-b-3xl">
  {#each keys as key}
    <button 
      onclick={key.action}
      class="btn-calc aspect-square text-lg {key.type === 'primary' ? 'primary' : key.type === 'success' ? 'success' : ''}"
    >
      {#if key.icon}
        <Delete class="w-6 h-6" />
      {:else}
        {key.label}
      {/if}
    </button>
  {/each}
</div>
