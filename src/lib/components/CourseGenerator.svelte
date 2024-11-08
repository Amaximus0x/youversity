<script lang="ts">
    export let courseObjective: string;
    export let loading: boolean;
    export let error: string | null;
    export let onSubmit: () => void;
  </script>
  
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <label for="objective" class="block text-lg mb-2">
        Enter your course objective
      </label>
      <textarea
        id="objective"
        bind:value={courseObjective}
        class="w-full p-3 border rounded-lg min-h-[120px]"
        placeholder="e.g., Learn Python for Data Science"
        disabled={loading}
      ></textarea>
    </div>
  
    {#if error}
      <div class="text-red-500 mb-4">{error}</div>
    {/if}
  
    <button
      on:click={onSubmit}
      disabled={loading || !courseObjective}
      class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Building...' : 'Build My Course'}
    </button>
  </div>