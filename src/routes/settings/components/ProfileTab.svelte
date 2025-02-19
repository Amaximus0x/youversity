<script lang="ts">
    import { user } from "$lib/stores/auth";
    import { updateProfile } from 'firebase/auth';
    import { updateUserProfile, getUserProfile, uploadProfileImage } from '$lib/services/profile';
    import { auth } from '$lib/firebase';
    import { onMount } from 'svelte';

    // Form data
    let firstName = "";
    let lastName = "";
    let username = "";
    let email = "";
    let about = "";
    let loading = false;
    let error: string | null = null;
    let photoFile: FileList;
    let previewURL = '';
    let photoURL = '';

    // Handle photo file selection
    function handlePhotoSelect(event: Event) {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files[0]) {
        const file = input.files[0];
        photoFile = input.files;
        // Create preview URL
        previewURL = URL.createObjectURL(file);
      }
    }

    // Initialize form data
    onMount(async () => {
      if ($user?.uid) {
        try {
          // First set basic data from Firebase Auth user
          const [first, ...rest] = ($user.displayName || '').split(' ');
          firstName = first || '';
          lastName = rest.join(' ') || '';
          photoURL = $user.photoURL || '';
          previewURL = $user.photoURL || '';
          email = $user.email || '';

          // Then fetch and set additional data from Firestore
          const profile = await getUserProfile($user.uid);
          if (profile) {
            // Update fields with Firestore data if available
            firstName = profile.displayName?.split(' ')[0] || firstName;
            lastName = profile.displayName?.split(' ').slice(1).join(' ') || lastName;
            username = profile.username || '';
            photoURL = profile.photoURL || photoURL;
            previewURL = profile.photoURL || previewURL;
            about = profile.about || '';
          }
        } catch (err) {
          console.error('Error loading profile:', err);
          error = 'Failed to load profile data';
        }
      }
    });

    // Handle profile picture change
    async function handleChangePicture() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = handlePhotoSelect;
        input.click();
    }

    // Handle profile picture delete
    function handleDeletePicture() {
        photoURL = '';
        previewURL = '';
        if ($user) {
            updateUserProfile($user.uid, { photoURL: '' });
            updateProfile($user.currentUser, { photoURL: '' });
        }
    }

    // Handle password change
    function handleChangePassword() {
        // Implement password change logic
        console.log("Change password clicked");
    }

    // Handle account deletion
    function handleDeleteAccount() {
        // Implement account deletion logic
        console.log("Delete account clicked");
    }

    // Handle form save
    async function handleSaveChanges() {
        if (!$user) return;
        
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
                    previewURL = photoURL;
                } catch (uploadError) {
                    console.error('Error uploading photo:', uploadError);
                    error = 'Failed to upload photo. Please try again.';
                    return;
                }
            }

            // First update Firebase Auth user profile
            await updateProfile(currentUser, {
                displayName: `${firstName} ${lastName}`.trim(),
                photoURL
            });

            // Update Firestore profile with only allowed fields
            await updateUserProfile(currentUser.uid, {
                displayName: `${firstName} ${lastName}`.trim(),
                photoURL,
                username,
                email: currentUser.email || '',
                about,
                updatedAt: new Date()
            });

            // Show success message
            error = null;
        } catch (err) {
            console.error('Profile update error:', err);
            error = 'Failed to update profile. Please try again.';
        } finally {
            loading = false;
        }
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

<div class="max-w-[632px]">
    {#if error}
        <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
        </div>
    {/if}

    <!-- Profile Picture Section -->
    <div class="flex items-center justify-between">
        <div class="mb-8 flex items-center justify-center gap-6">
            <div class="w-[72px] h-[72px] lg:w-[105px] lg:h-[105px] relative mb-4">
                {#if previewURL}
                    <img
                        src={previewURL}
                        alt="Profile"
                        class="w-full h-full rounded-full object-cover"
                    />
                {:else}
                    <div class="w-full h-full rounded-full bg-[#9a9999] flex items-center justify-center">
                        <span class="text-[#2A4D61] font-medium text-h4">
                            {(firstName[0] || "").toUpperCase()}
                        </span>
                    </div>
                {/if}
            </div>
            <div class="flex items-center justify-center gap-4">
                <button
                    class="px-4 py-2 bg-brand-navy text-white rounded-lg text-semibody-medium"
                    on:click={handleChangePicture}
                    disabled={loading}
                >
                    Change picture
                </button>
                <button
                    class="px-4 py-2 bg-Black/5 text-brand-red rounded-lg text-semibody-medium"
                    on:click={handleDeletePicture}
                    disabled={loading}
                >
                    Delete Picture
                </button>
            </div>
        </div>
    </div>

    <!-- Form Fields -->
    <div class="flex flex-col gap-6">
        <!-- Name Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
                <label
                    class="text-semi-body text-light-text-primary dark:text-dark-text-primary"
                >
                    First Name
                </label>
                <input
                    type="text"
                    bind:value={firstName}
                    class="w-full px-4 py-3 bg-white dark:bg-dark-bg-primary border border-light-border dark:border-dark-border rounded-lg text-semi-body text-light-text-primary dark:text-dark-text-primary"
                    placeholder="First Name"
                />
            </div>
            <div class="flex flex-col gap-2">
                <label
                    class="text-semi-body text-light-text-primary dark:text-dark-text-primary"
                >
                    Last Name
                </label>
                <input
                    type="text"
                    bind:value={lastName}
                    class="w-full px-4 py-3 bg-white dark:bg-dark-bg-primary border border-light-border dark:border-dark-border rounded-lg text-semi-body text-light-text-primary dark:text-dark-text-primary"
                    placeholder="Last Name"
                />
            </div>
        </div>

        <!-- Username -->
        <div class="flex flex-col gap-2">
            <label
                class="text-semi-body text-light-text-primary dark:text-dark-text-primary"
            >
                Username
            </label>
            <input
                type="text"
                bind:value={username}
                class="w-full px-4 py-3 bg-white dark:bg-dark-bg-primary border border-light-border dark:border-dark-border rounded-lg text-semi-body text-light-text-primary dark:text-dark-text-primary"
                placeholder="@username"
            />
        </div>

        <!-- Email -->
        <div class="flex flex-col gap-2">
            <label
                class="text-semi-body text-light-text-primary dark:text-dark-text-primary"
            >
                Email address
            </label>
            <input
                type="email"
                bind:value={email}
                class="w-full px-4 py-3 bg-white dark:bg-dark-bg-primary border border-light-border dark:border-dark-border rounded-lg text-semi-body text-light-text-primary dark:text-dark-text-primary"
                placeholder="email"
            />
        </div>

        <!-- About -->
        <div class="flex flex-col gap-2">
            <label
                class="text-semi-body text-light-text-primary dark:text-dark-text-primary"
            >
                About
            </label>
            <textarea
                bind:value={about}
                class="w-full px-4 py-3 bg-white dark:bg-dark-bg-primary border border-light-border dark:border-dark-border rounded-lg text-semi-body text-light-text-primary dark:text-dark-text-primary min-h-[120px] resize-none"
                placeholder="Write something about yourself..."
            />
        </div>

        <!-- Change Password Button -->
        <button
            class="text-brand-turquoise text-semi-body text-left"
            on:click={handleChangePassword}
        >
            Change password
        </button>

        <!-- Save Changes Button -->
        <button
            class="w-fit px-4 py-2 bg-[#F5F5F5] text-light-text-primary dark:text-dark-text-primary rounded-lg text-semi-body"
            on:click={handleSaveChanges}
            disabled={loading}
        >
            {loading ? 'Saving...' : 'Save changes'}
        </button>

        <!-- Delete Account Button -->
        <button
            class="text-brand-red text-semi-body text-left"
            on:click={handleDeleteAccount}
        >
            Delete Account
        </button>
    </div>
</div>
