<!-- Header component -->
<script lang="ts">
  import { page } from '$app/stores';
  import MobileMenu from './MobileMenu.svelte';
  import { browser } from '$app/environment';

  let isMenuOpen = false;
  let isMobile = false;

  // Check if mobile on client side
  if (browser) {
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
  }

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }
</script>

<!-- Mobile Menu -->
<MobileMenu isOpen={isMenuOpen} onClose={closeMenu} />

<!-- Header -->
<header class="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-dark-bg-primary/80 backdrop-blur-[100px]">
  <div class="flex justify-between items-center px-4 h-16">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2">
      <img src="/YV.svg" alt="Youversity Logo" class="w-8 h-8" />
      <span class="text-light-text-primary dark:text-dark-text-primary font-medium">Youversity</span>
    </a>

    <!-- Mobile Menu Button -->
    <button 
      class="md:hidden text-light-text-primary dark:text-dark-text-primary"
      on:click={toggleMenu}
      aria-label="Toggle menu"
    >
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M3 12H21M3 6H21M3 18H21" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <!-- Desktop Navigation -->
    <nav class="hidden md:flex items-center gap-8">
      <a 
        href="/" 
        class="{$page.url.pathname === '/' ? 'text-brand-red' : 'text-light-text-primary dark:text-dark-text-primary'} hover:text-brand-red transition-colors"
      >
        Home
      </a>
      <a 
        href="/about" 
        class="{$page.url.pathname === '/about' ? 'text-brand-red' : 'text-light-text-primary dark:text-dark-text-primary'} hover:text-brand-red transition-colors"
      >
        About
      </a>
      <a 
        href="/contact" 
        class="{$page.url.pathname === '/contact' ? 'text-brand-red' : 'text-light-text-primary dark:text-dark-text-primary'} hover:text-brand-red transition-colors"
      >
        Contact
      </a>
    </nav>
  </div>
</header>

<!-- Spacer to prevent content from going under fixed header -->
<div class="h-16"></div> 