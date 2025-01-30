<script lang="ts">
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: 'primary' | 'secondary' | 'outline' = 'primary';
  export let fullWidth = false;
  export let disabled = false;
  export let loading = false;
  export let textClass = 'body'; // Default text styling
  export let onClick: (() => void) | undefined = undefined;

  const variantStyles = {
    primary: 'bg-brand-red hover:bg-ButtonHover text-white',
    secondary: 'bg-white border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary',
    outline: 'bg-transparent border border-brand-red text-brand-red '
  };
</script>

<button
  {type}
  {disabled}
  on:click={onClick}
  class="min-h-[54px] px-4 py-2 rounded-2xl flex justify-center items-center gap-2 transition-all duration-200 font-poppins {variantStyles[variant]} {textClass} {fullWidth ? 'w-full' : 'w-auto'} {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
>
  {#if loading}
    <div class="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" />
  {/if}
  <slot />
</button>

<style>
  button {
    font-family: 'Poppins';
    font-size: 16px;
    line-height: 24px;
    font-weight: 400;
  }
</style> 