<script lang="ts">
  import { onMount } from 'svelte';
  import { API_CONFIG, getFetchOptions } from '$lib/config/api';
  import { browser } from '$app/environment';

  let result = '';
  let loading = false;
  let error: string | null = null;
  let platform = 'server';
  
  async function testCors() {
    loading = true;
    error = null;
    result = '';

    try {
      // Test relative URL
      const relativeResponse = await fetch('/api/test-cors', getFetchOptions());
      const relativeData = await relativeResponse.json();
      
      // Test absolute URL 
      const absoluteResponse = await fetch(`${API_CONFIG.baseURL}/api/test-cors`, getFetchOptions());
      const absoluteData = await absoluteResponse.json();
      
      result = `
        Platform: web (Replit)
        API Base URL: ${API_CONFIG.baseURL}
        
        Relative URL Test:
        ${JSON.stringify(relativeData, null, 2)}
        
        Absolute URL Test:
        ${JSON.stringify(absoluteData, null, 2)}
      `;
    } catch (err) {
      console.error('CORS test error:', err);
      error = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    // Auto-run test on page load
    if (browser) {
      platform = 'web';
      testCors();
    }
  });
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">CORS Test Page (Replit Version)</h1>
  
  <div class="mb-4">
    <button 
      class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      on:click={testCors}
      disabled={loading}
    >
      {loading ? 'Testing...' : 'Test CORS'}
    </button>
  </div>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p class="font-bold">Error:</p>
      <p>{error}</p>
    </div>
  {/if}
  
  {#if result}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      <p class="font-bold">Result:</p>
      <pre class="whitespace-pre-wrap">{result}</pre>
    </div>
  {/if}
</div> 