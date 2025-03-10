<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import MobileMenu from './MobileMenu.svelte';
  
  let isMenuOpen = false;
  let isMobile = false;
  let scrolled = false;
  
  function navigateToLogin() {
    goto('/login');
  }
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }
  
  // Check if we're on mobile and handle scroll
  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };
    
    const handleScroll = () => {
      scrolled = window.scrollY > 0;
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  });
</script>

<!-- Mobile Menu -->
<MobileMenu isOpen={isMenuOpen} onClose={closeMenu} />

<header class="w-full flex flex-col fixed top-0 left-0 right-0 z-50">
  <!-- Red Banner -->
  <div class="w-full bg-brand-red py-2 px-4 text-center">
    <p class="text-white text-mini-body md:text-body md:font-normal">if it's on YouTube, you can master it on YouVersity.</p>
  </div>
  
  <!-- Main Header -->
  <div class="w-full bg-light-bg-secondary dark:bg-dark-bg-secondary py-4 px-4 md:px-16 md:border-b md:border-light-border md:dark:border-dark-border shadow-sm {scrolled ? 'shadow-md' : ''}">
    <div class="mx-auto flex justify-between items-center">
      <!-- Logo -->
      <div class="flex items-center">
        <a href="/" class="flex items-center">
          <img 
            src="/YV.svg"
            alt="Youversity Logo" 
            class="w-[35.29px] h-[38px] lg:w-[44.97px] lg:h-[48.43px]"
          />

          <div class="pt-2">
            <!-- //logo text -->
            <svg
              class="w-[86.61px] h-[16.76px] lg:w-[107.83px] lg:h-[21.36px] text-light-text-primary dark:text-dark-text-primary"
              viewBox="0 0 109 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <g id="Youversity">
                <path
                  d="M12.8206 1.85152L8.04707 11.0458V16.276H5.68104V11.0458L0.886719 1.85152H3.52256L6.86406 8.92886L10.2056 1.85152H12.8206Z"
                  fill="currentColor"
                />
                <path
                  d="M19.6587 16.4628C18.5794 16.4628 17.6039 16.2207 16.7322 15.7364C15.8605 15.2383 15.1756 14.5465 14.6775 13.6609C14.1794 12.7616 13.9304 11.7238 13.9304 10.5477C13.9304 9.38546 14.1863 8.35465 14.6983 7.45528C15.2102 6.55591 15.909 5.86409 16.7945 5.37981C17.68 4.89554 18.6693 4.6534 19.7624 4.6534C20.8555 4.6534 21.8448 4.89554 22.7303 5.37981C23.6159 5.86409 24.3146 6.55591 24.8266 7.45528C25.3385 8.35465 25.5945 9.38546 25.5945 10.5477C25.5945 11.71 25.3316 12.7408 24.8058 13.6402C24.28 14.5395 23.5605 15.2383 22.6473 15.7364C21.748 16.2207 20.7517 16.4628 19.6587 16.4628ZM19.6587 14.4081C20.2675 14.4081 20.8347 14.2628 21.3605 13.9722C21.9002 13.6817 22.336 13.2458 22.6681 12.6647C23.0001 12.0836 23.1662 11.3779 23.1662 10.5477C23.1662 9.71754 23.0071 9.0188 22.6888 8.4515C22.3706 7.87037 21.9486 7.43452 21.4228 7.14396C20.897 6.85339 20.3297 6.70811 19.7209 6.70811C19.1121 6.70811 18.5448 6.85339 18.019 7.14396C17.5071 7.43452 17.0989 7.87037 16.7945 8.4515C16.4901 9.0188 16.3379 9.71754 16.3379 10.5477C16.3379 11.7792 16.6492 12.7339 17.2719 13.4119C17.9083 14.076 18.7039 14.4081 19.6587 14.4081Z"
                  fill="currentColor"
                />
                <path
                  d="M38.29 4.84019V16.276H35.924V14.927C35.5504 15.3974 35.0592 15.771 34.4504 16.0477C33.8554 16.3106 33.2189 16.442 32.541 16.442C31.6416 16.442 30.8322 16.2552 30.1127 15.8817C29.407 15.5081 28.8466 14.9546 28.4315 14.2213C28.0303 13.488 27.8297 12.6024 27.8297 11.5647V4.84019H30.1749V11.2119C30.1749 12.2358 30.4309 13.0244 30.9429 13.5779C31.4548 14.1175 32.1535 14.3873 33.0391 14.3873C33.9246 14.3873 34.6233 14.1175 35.1353 13.5779C35.6611 13.0244 35.924 12.2358 35.924 11.2119V4.84019H38.29Z"
                  fill="currentColor"
                />
                <path
                  d="M45.8325 14.159L49.0703 4.84019H51.5816L47.2231 16.276H44.4005L40.0627 4.84019H42.5948L45.8325 14.159Z"
                  fill="currentColor"
                />
                <path
                  d="M63.8511 10.2779C63.8511 10.7068 63.8235 11.0943 63.7681 11.4402H55.0304C55.0996 12.3534 55.4386 13.0867 56.0474 13.6402C56.6562 14.1936 57.4034 14.4704 58.2889 14.4704C59.5618 14.4704 60.4612 13.9376 60.987 12.8722H63.5398C63.1939 13.9238 62.5643 14.7886 61.6511 15.4666C60.7518 16.1307 59.631 16.4628 58.2889 16.4628C57.1958 16.4628 56.2134 16.2207 55.3417 15.7364C54.4839 15.2383 53.8059 14.5465 53.3078 13.6609C52.8235 12.7616 52.5814 11.7238 52.5814 10.5477C52.5814 9.37162 52.8166 8.34081 53.287 7.45528C53.7713 6.55591 54.4424 5.86409 55.3002 5.37981C56.1719 4.89554 57.1681 4.6534 58.2889 4.6534C59.3681 4.6534 60.3298 4.88862 61.1738 5.35906C62.0178 5.8295 62.675 6.49365 63.1455 7.3515C63.6159 8.19553 63.8511 9.171 63.8511 10.2779ZM61.3813 9.53074C61.3675 8.65905 61.0562 7.96031 60.4474 7.43452C59.8386 6.90874 59.0845 6.64585 58.1851 6.64585C57.3688 6.64585 56.67 6.90874 56.0889 7.43452C55.5078 7.94647 55.1619 8.64521 55.0512 9.53074H61.3813Z"
                  fill="currentColor"
                />
                <path
                  d="M68.5456 6.50056C68.8915 5.91943 69.3481 5.46975 69.9154 5.15151C70.4965 4.81944 71.1814 4.6534 71.9701 4.6534V7.10245H71.3682C70.4412 7.10245 69.7355 7.33767 69.2512 7.80811C68.7808 8.27855 68.5456 9.0949 68.5456 10.2572V16.276H66.1796V4.84019H68.5456V6.50056Z"
                  fill="currentColor"
                />
                <path
                  d="M78.2959 16.4628C77.3965 16.4628 76.5871 16.3037 75.8676 15.9854C75.1619 15.6534 74.6016 15.2106 74.1865 14.6571C73.7714 14.0898 73.55 13.4603 73.5223 12.7685H75.9714C76.0129 13.2527 76.2412 13.6609 76.6563 13.993C77.0852 14.3112 77.6179 14.4704 78.2544 14.4704C78.9185 14.4704 79.4305 14.3458 79.7902 14.0968C80.1638 13.8339 80.3506 13.5018 80.3506 13.1005C80.3506 12.6716 80.1431 12.3534 79.728 12.1458C79.3267 11.9383 78.6833 11.71 77.7978 11.4609C76.9399 11.2257 76.2412 10.9974 75.7016 10.776C75.1619 10.5546 74.6915 10.2156 74.2902 9.75904C73.9028 9.30244 73.7091 8.70056 73.7091 7.95339C73.7091 7.34459 73.889 6.79113 74.2487 6.29302C74.6085 5.78107 75.1204 5.37981 75.7846 5.08925C76.4626 4.79868 77.2374 4.6534 78.1091 4.6534C79.4097 4.6534 80.4544 4.98547 81.243 5.64962C82.0456 6.29993 82.4745 7.19238 82.5298 8.32697H80.1638C80.1223 7.81502 79.9147 7.40685 79.5412 7.10245C79.1676 6.79805 78.6626 6.64585 78.0261 6.64585C77.4034 6.64585 76.9261 6.76346 76.594 6.99867C76.2619 7.23389 76.0959 7.54521 76.0959 7.93263C76.0959 8.23704 76.2066 8.49301 76.428 8.70056C76.6494 8.9081 76.9192 9.07414 77.2374 9.19867C77.5556 9.30936 78.0261 9.45464 78.6487 9.63452C79.4789 9.8559 80.1569 10.0842 80.6827 10.3194C81.2223 10.5408 81.6858 10.8729 82.0732 11.3156C82.4606 11.7584 82.6613 12.3465 82.6751 13.0798C82.6751 13.7301 82.4952 14.3112 82.1355 14.8232C81.7757 15.3351 81.2638 15.7364 80.5996 16.0269C79.9493 16.3175 79.1814 16.4628 78.2959 16.4628Z"
                  fill="currentColor"
                />
                <path
                  d="M86.4354 3.3251C86.0065 3.3251 85.6468 3.17982 85.3562 2.88925C85.0656 2.59869 84.9203 2.23894 84.9203 1.81001C84.9203 1.38108 85.0656 1.02133 85.3562 0.73077C85.6468 0.440205 86.0065 0.294922 86.4354 0.294922C86.8505 0.294922 87.2034 0.440205 87.4939 0.73077C87.7845 1.02133 87.9298 1.38108 87.9298 1.81001C87.9298 2.23894 87.7845 2.59869 87.4939 2.88925C87.2034 3.17982 86.8505 3.3251 86.4354 3.3251ZM87.5977 4.84019V16.276H85.2317V4.84019H87.5977Z"
                  fill="currentColor"
                />
                <path
                  d="M93.4645 6.77037V13.1005C93.4645 13.5295 93.5613 13.8408 93.755 14.0345C93.9626 14.2144 94.3085 14.3043 94.7927 14.3043H96.2456V16.276H94.3777C93.3123 16.276 92.4959 16.0269 91.9286 15.5288C91.3613 15.0307 91.0777 14.2213 91.0777 13.1005V6.77037H89.7286V4.84019H91.0777V1.9968H93.4645V4.84019H96.2456V6.77037H93.4645Z"
                  fill="currentColor"
                />
                <path
                  d="M108.721 4.84019L101.706 21.6515H99.2565L101.581 16.0892L97.0772 4.84019H99.7131L102.93 13.5571L106.272 4.84019H108.721Z"
                  fill="currentColor"
                />
              </g>
            </svg>
          </div>
        </a>
      </div>
      
      <!-- Desktop Navigation -->
      <div class="hidden md:flex-1 md:flex items-center justify-center">
        <nav class="flex items-center space-x-16  ">
          <div class="px-6">
          <a 
            href="/" 
            class="text-brand-red transition-colors text-body font-medium {$page.url.pathname === '/' ? 'text-brand-red' : 'text-light-text-primary dark:text-dark-text-primary'}"
          >
            Home
          </a>
          </div>
          <div class="px-6">
          <a 
            href="/about" 
            class="transition-colors text-body font-medium {$page.url.pathname === '/about' ? 'text-brand-red' : 'text-light-text-primary dark:text-dark-text-primary'}"
          >
            About
          </a>
          </div>
          <div class="px-6">
          <a 
            href="/contact" 
            class="transition-colors text-body font-medium {$page.url.pathname === '/contact' ? 'text-brand-red' : 'text-light-text-primary dark:text-dark-text-primary'}"
          >
            Contact
          </a>
          </div>
        </nav>
      </div>
      
      <!-- Sign In Button -->
      <div class="hidden md:block">
        <button 
          on:click={navigateToLogin}
          class="px-8 py-4 text-h4 bg-brand-red text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold"
        >
          Sign in
        </button>
      </div>
      
      <!-- Mobile Navigation -->
      <div class="flex md:hidden items-center space-x-4">
        <button 
          on:click={navigateToLogin}
          class="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-opacity-90 transition-all font-medium"
        >
          Sign in
        </button>
        
        <button 
          on:click={toggleMenu}
          class="p-2 text-light-text-primary dark:text-dark-text-primary focus:outline-none border border-light-border dark:border-dark-border rounded-lg"
          aria-label="Toggle menu"
        >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g id="menu-11">
          <path id="Vector" d="M20 12H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path id="Vector_2" d="M20 5H4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path id="Vector_3" d="M20 19H4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          </svg>
            
        </button>
      </div>
    </div>
  </div>
    
</header>

<!-- Spacer to prevent content from being hidden under the fixed header -->
<div class="h-[100px] md:h-[120px]"></div> 