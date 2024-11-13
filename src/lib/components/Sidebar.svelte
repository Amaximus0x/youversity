<script lang="ts">
  import { page } from '$app/stores';
  import { 
    Home, 
    Book, 
    TrendingUp, 
    Settings, 
    LogOut, 
    Plus 
  } from 'lucide-svelte';

  $: currentPath = $page.url.pathname;
</script>

<aside class="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 p-4">
  <nav class="space-y-2">
    <a 
      href="/" 
      class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
      class:bg-[#EE434A] class:text-white={currentPath === '/'}
    >
      <Home class="w-5 h-5 mr-3" />
      Home
    </a>
    
    <a 
      href="/create-course" 
      class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
      class:bg-[#EE434A] class:text-white={currentPath === '/create-course'}
    >
      <Plus class="w-5 h-5 mr-3" />
      Add Course
    </a>
    
    <a 
      href="/my-courses" 
      class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
      class:bg-[#EE434A] class:text-white={currentPath === '/my-courses'}
    >
      <Book class="w-5 h-5 mr-3" />
      My Courses
    </a>
    
    <a 
      href="/trending" 
      class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
      class:bg-[#EE434A] class:text-white={currentPath === '/trending'}
    >
      <TrendingUp class="w-5 h-5 mr-3" />
      Trending
    </a>
    
    <a 
      href="/settings" 
      class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
      class:bg-[#EE434A] class:text-white={currentPath === '/settings'}
    >
      <Settings class="w-5 h-5 mr-3" />
      Settings
    </a>
  </nav>
</aside> 