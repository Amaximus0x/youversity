<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { updateProfile } from 'firebase/auth';
    import { updateUserProfile, getUserProfile, uploadProfileImage } from '$lib/services/profile';
    import { auth } from '$lib/firebase';
    import type { User } from 'firebase/auth';
  
    export let user: User;
  
    const dispatch = createEventDispatcher();
  
    let displayName = '';
    let photoURL = '';
    let dateOfBirth = '';
    let gender = '';
    let country = '';
    let phoneNumber = '';
    let loading = false;
    let error: string | null = null;
    let photoFile: FileList;
    let previewURL = '';

    // Handle photo file selection
    function handlePhotoSelect(event: Event) {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files[0]) {
        const file = input.files[0];
        // Create preview URL
        previewURL = URL.createObjectURL(file);
      }
    }
  
    onMount(async () => {
      if (user?.uid) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            // Only set values if they exist in the profile
            if (profile.displayName) displayName = profile.displayName;
            if (profile.photoURL) {
              photoURL = profile.photoURL;
              previewURL = profile.photoURL;
            }
            if (profile.dateOfBirth) dateOfBirth = profile.dateOfBirth;
            if (profile.gender) gender = profile.gender;
            if (profile.country) country = profile.country;
            if (profile.phoneNumber) phoneNumber = profile.phoneNumber;
          }
        } catch (err) {
          console.error('Error loading profile:', err);
          error = 'Failed to load profile data';
        }
      }
    });
  
    async function handleSubmit(e: SubmitEvent) {
      e.preventDefault();
      loading = true;
      error = null;
  
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user found');
        }

        // Handle photo upload if a new photo was selected
        if (photoFile?.[0]) {
          try {
            photoURL = await uploadProfileImage(currentUser.uid, photoFile[0]);
          } catch (uploadError) {
            console.error('Error uploading photo:', uploadError);
            error = 'Failed to upload photo. Please try again.';
            return;
          }
        }

        // First update Firebase Auth user profile
        await updateProfile(currentUser, {
          displayName,
          photoURL
        });

        // Update Firestore profile
        await updateUserProfile(currentUser.uid, {
          displayName,
          photoURL,
          email: currentUser.email || '',
          dateOfBirth,
          gender,
          country,
          phoneNumber,
          updatedAt: new Date()
        });
        
        dispatch('close');
        window.location.reload();
      } catch (err) {
        console.error('Profile update error:', err);
        error = 'Failed to update profile. Please try again.';
      } finally {
        loading = false;
      }
    }
  
    function handleClose() {
      if (previewURL && previewURL !== photoURL) {
        URL.revokeObjectURL(previewURL);
      }
      dispatch('close');
    }

    // Cleanup preview URL when component is destroyed
    onMount(() => {
      return () => {
        if (previewURL && previewURL !== photoURL) {
          URL.revokeObjectURL(previewURL);
        }
      };
    });
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-6 w-full max-w-md">
    <h2 class="text-2xl font-bold mb-4">Edit Profile</h2>
    
    {#if error}
      <div class="bg-red-100 text-red-700 p-3 rounded mb-4">
        {error}
      </div>
    {/if}

    <form on:submit={handleSubmit} class="space-y-4">
      <div>
        <label for="displayName" class="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          id="displayName"
          bind:value={displayName}
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter your name"
        />
      </div>

      <!-- Photo upload section -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
        <div class="flex items-center space-x-4">
          {#if previewURL}
            <img 
              src={previewURL} 
              alt="Profile preview" 
              class="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
          {/if}
          <div class="flex-1">
            <input
              type="file"
              id="photo"
              accept="image/*"
              bind:files={photoFile}
              on:change={handlePhotoSelect}
              class="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
        </div>
      </div>

      <div>
        <label for="dateOfBirth" class="block text-sm font-medium text-gray-700">Date of Birth</label>
        <input
          type="date"
          id="dateOfBirth"
          bind:value={dateOfBirth}
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="gender" class="block text-sm font-medium text-gray-700">Gender</label>
        <select
          id="gender"
          bind:value={gender}
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label for="country" class="block text-sm font-medium text-gray-700">Country</label>
        <input
          type="text"
          id="country"
          bind:value={country}
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter your country"
        />
      </div>

      <div>
        <label for="phoneNumber" class="block text-sm font-medium text-gray-700">Phone Number</label>
        <input
          type="tel"
          id="phoneNumber"
          bind:value={phoneNumber}
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter your phone number"
        />
      </div>

      <div class="flex justify-end space-x-3">
        <button
          type="button"
          on:click={handleClose}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  </div>
</div>