<script lang="ts">
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  
  export let data: PageData;
  const { profile } = data;
</script>

<div class="max-w-2xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-6">Profile</h1>
  
  {#if profile}
    <div class="space-y-4">
      {#if profile.image}
        <div class="flex justify-center">
          <img 
            src={profile.image} 
            alt={profile.name || 'Profile'} 
            class="w-24 h-24 rounded-full"
          />
        </div>
      {/if}
      
      <div class="space-y-2">
        <div>
          <span class="font-semibold">Name:</span>
          <span>{profile.name || 'Not provided'}</span>
        </div>
        
        <div>
          <span class="font-semibold">Email:</span>
          <span>{profile.email || 'Not provided'}</span>
        </div>
        
        <div>
          <span class="font-semibold">User ID:</span>
          <span>{profile.id || 'Not available'}</span>
        </div>
      </div>
    </div>
  {:else}
    <p>Loading profile...</p>
  {/if}
</div> 