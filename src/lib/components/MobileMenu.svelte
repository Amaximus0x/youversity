<!-- Mobile Menu component -->
<script lang="ts">
    import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  export let isOpen = false;
  export let onClose: () => void;
</script>

{#if isOpen}
<div class="fixed inset-0 z-[60]">
  <!-- Backdrop -->
  <div class="absolute inset-0 bg-black/50" on:click={onClose}></div>
  
  <!-- Menu Content -->
  <div class="absolute right-0 top-0 h-full w-[80%] bg-gradient-light dark:bg-gradient-dark transform transition-transform duration-300 ease-in-out">
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex justify-between items-center px-5 pt-[52px]">
        <div class="flex items-center gap-2">
          <img src="/YV.svg" alt="Youversity Logo" class="w-[37.14px] h-10 relative" />
          <!-- <span class="text-light-text-primary dark:text-dark-text-primary font-medium">Youversity</span> -->
        </div>
        <button on:click={onClose} class="p-2 border border-light-border dark:border-dark-border rounded-full">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="cancel-circle">
                <path id="Vector" d="M14.9994 15L9 9M9.00064 15L15 9" stroke="#FF0000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path id="Vector_2" d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke="#FF0000" stroke-width="1.5"/>
                </g>
                </svg>
        </button>
      </div>

      <!-- Navigation and Sign In Container -->
      <div class="self-stretch px-5 pb-[71px] flex flex-col justify-between items-center flex-grow">
        <!-- Navigation Links -->
        <div class="self-stretch h-[136px] px-5 flex flex-col justify-start items-start gap-8 mt-[45px]">
          <a 
            href="/" 
            class="self-stretch text-center {$page.url.pathname === '/' ? 'text-[#eb434a]' : 'text-black dark:text-white'} text-base font-medium font-['Poppins'] leading-normal"
            on:click={onClose}
          >
            Home
          </a>
          <a 
            href="/about" 
            class="self-stretch text-center {$page.url.pathname === '/about' ? 'text-[#eb434a]' : 'text-black dark:text-white'} text-base font-medium font-['Poppins'] leading-normal"
            on:click={onClose}
          >
            About
          </a>
          <a 
            href="/contact" 
            class="self-stretch text-center {$page.url.pathname === '/contact' ? 'text-[#eb434a]' : 'text-black dark:text-white'} text-base font-medium font-['Poppins'] leading-normal"
            on:click={onClose}
          >
            Contact
          </a>
        </div>

        <!-- Sign In Button -->
        <div class="self-stretch px-4 py-2 bg-[#ee3d4e] rounded-lg shadow-[0px_4px_6px_-1px_rgba(99,55,174,0.25)] shadow-[inset_0px_2px_4px_0px_rgba(99,55,174,0.25)] inline-flex justify-center items-center">
          <button 
            class="relative justify-center text-white text-base font-semibold font-['Poppins'] leading-normal w-full"
            on:click={() => {
              onClose();
              // Add sign in navigation logic here
              goto('/login');
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
{/if} 