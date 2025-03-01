<script lang="ts">
    import { user } from "$lib/stores/auth";
    import { updateProfile } from "firebase/auth";
    import {
        updateUserProfile,
        getUserProfile,
        uploadProfileImage,
    } from "$lib/services/profile";
    import { deleteUserAccount } from "$lib/services/auth";
    import { auth } from "$lib/firebase";
    import { onMount, onDestroy } from "svelte";
    import { goto } from "$app/navigation";
    import { writable } from 'svelte/store';
    import { get } from 'svelte/store';
    import { browser } from '$app/environment';
    import ChangePasswordModal from '$lib/components/modals/ChangePasswordModal.svelte';
    import { NotificationService } from "$lib/services/notificationService";
    import { NotificationType } from "$lib/types/notification";

    // First, update the interface at the top of the file
    interface UserProfile {
        displayName: string;
        username: string;
        email: string;
        photoURL: string;
        about?: string;
        createdAt: Date;
        updatedAt: Date;
    }

    // Create a store for form values
    const formStore = writable({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        about: '',
        photoURL: '',
        previewURL: '',
        photoFile: undefined as FileList | undefined
    });

    // Bind form values to store
    $: ({ firstName, lastName, username, email, about, photoURL, previewURL, photoFile } = $formStore);

    // Track if form has been initialized
    let formInitialized = false;
    let loading = true;
    let error: string | null = null;

    // Add state for delete confirmation
    let showDeleteConfirm = false;
    let deleteLoading = false;

    // Add state for re-authentication
    let showReauthDialog = false;
    let password = "";
    let reAuthError: string | null = null;

    // Add these after the existing state variables
    let initialFormState = {
        firstName: "",
        lastName: "",
        about: ""
    };

    let hasChanges = false;

    // Track if auth is ready
    let authInitialized = false;
    let initialAuthCheck = true;

    // Add state for change password modal
    let showChangePasswordModal = false;

    // Add state to track if user is email/password user
    let isEmailPasswordUser = false;

    // Update user subscription to check auth provider
    user.subscribe((userData) => {
        if (userData) {
            console.log('Auth provider data:', userData.providerData);
            // Check if any provider is password-based authentication
            isEmailPasswordUser = userData.providerData.some((provider: { providerId?: string }) => provider?.providerId === 'password');
            console.log('Is email/password user:', isEmailPasswordUser);
        }
    });

    // Load user profile data
    async function loadUserProfile(userData: any) {
        if (!userData && authInitialized) {
            goto('/login');
            return;
        }

        if (!userData) {
            return; // Wait for auth to initialize
        }

        try {
            loading = true;
            console.log('Loading profile for user:', userData);
            // Check auth provider when loading profile
            isEmailPasswordUser = userData.providerData.some((provider: { providerId?: string }) => provider?.providerId === 'password');
            console.log('Is email/password user (on load):', isEmailPasswordUser);

            // First set basic data from Firebase Auth user
            const [first, ...rest] = (userData.displayName || '').split(' ');
            const initialData = {
                firstName: first || '',
                lastName: rest.join(' ') || '',
                username: userData.username || '',
                email: userData.email || '',
                about: '',
                photoURL: userData.photoURL || '',
                previewURL: userData.photoURL || '',
                photoFile: undefined as FileList | undefined
            };

            // Then fetch and set additional data from Firestore
            const profile = await getUserProfile(userData.uid);
            console.log('Fetched Firestore profile:', profile);

            if (profile) {
                // Update with Firestore data if available
                const [profileFirst, ...profileRest] = (profile.displayName || '').split(' ');
                const updatedData = {
                    ...initialData,
                    firstName: profileFirst || initialData.firstName,
                    lastName: profileRest.join(' ') || initialData.lastName,
                    username: profile.username || initialData.username,
                    email: profile.email || initialData.email,
                    about: profile.about || '',
                    photoURL: profile.photoURL || initialData.photoURL,
                    previewURL: profile.photoURL || initialData.photoURL
                };

                formStore.set(updatedData);
                
                // Store initial form state for change detection
                initialFormState = {
                    firstName: updatedData.firstName,
                    lastName: updatedData.lastName,
                    about: updatedData.about
                };
            } else {
                // If no Firestore profile, use Firebase Auth data
                formStore.set(initialData);
                initialFormState = {
                    firstName: initialData.firstName,
                    lastName: initialData.lastName,
                    about: initialData.about
                };
            }

            formInitialized = true;
            console.log('Profile data initialized:', { initialFormState, formStore: get(formStore) });

        } catch (err) {
            console.error('Error loading profile:', err);
            error = err instanceof Error ? err.message : 'Failed to load profile';
        } finally {
            loading = false;
        }
    }

    // Subscribe to auth state changes
    user.subscribe(async (userData) => {
        console.log('Auth state changed:', userData);
        
        if (initialAuthCheck) {
            initialAuthCheck = false;
            // Don't redirect on the first auth check
            if (userData) {
                authInitialized = true;
                await loadUserProfile(userData);
            }
            return;
        }
        
        // After initial check, mark auth as initialized and handle state changes
        authInitialized = true;
        
        if (userData) {
            await loadUserProfile(userData);
        } else if (authInitialized && !initialAuthCheck) {
            // Only redirect if auth is initialized and this isn't the first check
            console.log('No authenticated user, redirecting to login');
            goto('/login');
        }

        if (userData) {
            isEmailPasswordUser = userData.providerData[0]?.providerId === 'password';
        }
    });

    // Initialize form data when component mounts
    onMount(() => {
        console.log('ProfileTab mounted');
        const userData = get(user);
        if (userData) {
            console.log('User data available on mount:', {
                photoURL: userData.photoURL,
                displayName: userData.displayName
            });
            authInitialized = true;
            loadUserProfile(userData);
        }
    });

    // Track form changes
    $: hasChanges = formInitialized && (
        $formStore.firstName !== initialFormState.firstName ||
        $formStore.lastName !== initialFormState.lastName ||
        $formStore.about !== initialFormState.about ||
        $formStore.photoFile !== undefined
    );

    // Update form values
    function updateFormValue(field: string, value: any) {
        formStore.update(form => ({ ...form, [field]: value }));
    }

    // Clear photo file
    function clearPhotoFile() {
        formStore.update(form => ({ ...form, photoFile: undefined }));
    }

    // Force refresh the profile picture
    function forceRefreshProfilePicture(url: string) {
        if (!url) return;
        
        // Don't add timestamp to data URLs
        const refreshedUrl = url.startsWith('data:') 
            ? url 
            : (url.includes('?') 
                ? `${url}&t=${Date.now()}` 
                : `${url}?t=${Date.now()}`);
            
        console.log("Forcing profile picture refresh with URL type:", 
            url.startsWith('data:') ? 'data URL' : 'regular URL');
        
        // Update the form store with the refreshed URL
        formStore.update(form => ({
            ...form,
            previewURL: refreshedUrl
        }));
    }

    // Handle photo file selection
    function handlePhotoChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            const file = input.files[0];
            if (file) {
                console.log("New photo file selected:", file.name);
                
                // Create preview URL immediately
                const reader = new FileReader();
                reader.onload = function(e: ProgressEvent<FileReader>) {
                    if (e.target?.result) {
                        const result = e.target.result;
                        if (typeof result === 'string') {
                            // Update both photoFile and previewURL in a single update
                            formStore.update(form => ({
                                ...form,
                                photoFile: input.files || undefined,
                                previewURL: result
                            }));
                            console.log("Profile picture updated, photoFile is now set", $formStore.photoFile !== undefined);
                            console.log("Preview URL updated: data URL (length: " + result.length + ")");
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    }

    // Handle profile picture change
    function handleProfilePictureChange() {
        console.log("Change picture button clicked");
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = handlePhotoChange;
        input.click();
    }

    // Handle profile picture remove
    async function handleProfilePictureRemove() {
        if (!$user) return;

        loading = true;
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                await updateProfile(currentUser, {
                    photoURL: "",
                });
                
                // Update the user store to trigger UI updates
                user.update(u => {
                    if (!u) return u;
                    return {
                        ...u,
                        photoURL: ""
                    };
                });

                // Update Firestore
                await updateUserProfile(currentUser.uid, {
                    photoURL: "",
                    updatedAt: new Date()
                });

                // Update form store
                formStore.update(form => ({ 
                    ...form, 
                    photoURL: '', 
                    previewURL: '',
                    photoFile: undefined 
                }));

                await currentUser.reload();
            }
        } catch (err) {
            console.error("Error removing profile picture:", err);
            error = "Failed to remove profile picture";
        } finally {
            loading = false;
        }
    }

    // Handle password change
    function handleChangePassword() {
        showChangePasswordModal = true;
    }

    // Handle modal close
    function handleModalClose() {
        showChangePasswordModal = false;
    }

    // Handle account deletion
    async function handleDeleteAccount() {
        if (!$user) return;

        try {
            if (!showDeleteConfirm) {
                showDeleteConfirm = true;
                return;
            }

            // For email/password users, show re-auth dialog first
            if (
                $user.providerData[0]?.providerId === "password" &&
                !showReauthDialog
            ) {
                showReauthDialog = true;
                return;
            }

            deleteLoading = true;
            await deleteUserAccount($user.uid, password);
            goto("/login");
        } catch (err: any) {
            // Type assertion for the error
            console.error("Error deleting account:", err);
            if (err?.message?.includes("requires-recent-login")) {
                showReauthDialog = true;
                error = "Please confirm your password to continue";
            } else {
                error = "Failed to delete account. Please try again.";
            }
        } finally {
            deleteLoading = false;
        }
    }

    // Cancel delete confirmation
    function cancelDelete() {
        showDeleteConfirm = false;
        showReauthDialog = false;
        password = "";
        reAuthError = null;
        error = null;
    }

    // Handle form save
    async function handleSaveChanges() {
        const userData = get(user);
        if (!userData) return;

        loading = true;
        error = null;

        try {
            let newPhotoURL = $formStore.photoURL;
            let shouldUpdateAuth = false;
            let changedFields = [];

            // Check which fields have changed
            if ($formStore.firstName !== initialFormState.firstName || $formStore.lastName !== initialFormState.lastName) {
                changedFields.push('name');
            }
            if ($formStore.about !== initialFormState.about) {
                changedFields.push('about');
            }

            // Handle photo upload if there's a new photo
            if (photoFile && photoFile.length > 0) {
                try {
                    console.log("Uploading new profile picture...");
                    newPhotoURL = await uploadProfileImage(userData.uid, photoFile[0]);
                    console.log("Profile picture uploaded successfully:", newPhotoURL);
                    shouldUpdateAuth = true;
                    changedFields.push('profile picture');
                } catch (err) {
                    console.error('Error uploading profile image:', err);
                    error = 'Failed to upload profile image';
                    loading = false;
                    return;
                }
            }

            // Create the full display name from first and last name
            const displayName = `${$formStore.firstName} ${$formStore.lastName}`.trim();

            // Update Firebase Auth profile first if display name or photo changed
            const currentUser = auth.currentUser;
            if (currentUser && (shouldUpdateAuth || displayName !== currentUser.displayName)) {
                console.log("Updating Firebase Auth profile with new photo URL:", newPhotoURL);
                await updateProfile(currentUser, {
                    displayName,
                    photoURL: newPhotoURL
                });

                // Update the user store to trigger UI updates
                user.update(u => {
                    if (!u) return u;
                    return {
                        ...u,
                        displayName,
                        photoURL: newPhotoURL
                    };
                });
                
                // Force reload the user to ensure we have the latest data
                await currentUser.reload();
                
                // Get the updated user data after reload
                const updatedUser = auth.currentUser;
                if (updatedUser) {
                    console.log("User reloaded with new photo URL:", updatedUser.photoURL);
                }
            }

            // Update Firestore profile
            await updateUserProfile(userData.uid, {
                displayName,
                firstName: $formStore.firstName,
                lastName: $formStore.lastName,
                username: $formStore.username,
                email: $formStore.email,
                about: $formStore.about,
                photoURL: newPhotoURL,
                updatedAt: new Date()
            });

            // Create notifications for each changed field
            if (changedFields.length > 0) {
                const notificationPromises = changedFields.map(field => {
                    let title = '';
                    let message = '';

                    switch (field) {
                        case 'name':
                            title = 'Name Updated';
                            message = `Your name has been updated to ${displayName}`;
                            break;
                        case 'about':
                            title = 'About Section Updated';
                            message = 'Your about section has been successfully updated';
                            break;
                        case 'profile picture':
                            title = 'Profile Picture Updated';
                            message = 'Your profile picture has been successfully updated';
                            break;
                    }

                    return NotificationService.createNotification({
                        userId: userData.uid,
                        title,
                        message,
                        type: NotificationType.PROFILE_UPDATE,
                        createdAt: new Date(),
                        isRead: false
                    });
                });

                await Promise.all(notificationPromises);
            }

            // Clear photo file after successful upload
            clearPhotoFile();
            
            // Update form store with new photo URL - IMPORTANT for UI update
            // Do this BEFORE updating initialFormState to ensure the reactive statement detects the change
            formStore.update(form => ({
                ...form,
                photoURL: newPhotoURL,
                previewURL: newPhotoURL,
                photoFile: undefined
            }));
            
            // Update initial form state to reflect saved changes
            initialFormState = {
                firstName: $formStore.firstName,
                lastName: $formStore.lastName,
                about: $formStore.about
            };

            // Force UI refresh by directly updating the bound variables
            photoURL = newPhotoURL;
            previewURL = newPhotoURL;
            
            // Force a refresh of the profile picture to bypass cache
            if (newPhotoURL && !newPhotoURL.startsWith('data:')) {
                forceRefreshProfilePicture(newPhotoURL);
            }
            
            console.log("Profile updated successfully. New photo URL:", newPhotoURL);
            
            // Trigger a manual update to the UI by forcing a reactive update
            formStore.update(form => ({ ...form }));
            
            // Show success message
            error = null;
        } catch (err) {
            console.error('Error updating profile:', err);
            error = err instanceof Error ? err.message : 'Failed to update profile';
            
            // Reset preview if there was an error
            if (photoFile) {
                formStore.update(form => ({
                    ...form,
                    previewURL: $formStore.photoURL,
                    photoFile: undefined
                }));
            }
        } finally {
            loading = false;
        }
    }

    // Add cleanup for preview URL
    onDestroy(() => {
        if (previewURL && previewURL !== photoURL) {
            URL.revokeObjectURL(previewURL);
        }
    });

    // Keep only the photo URL update reactive statement
    $: {
        if ($user && formInitialized) {
            const newPhotoURL = $user.photoURL || "";
            console.log("Reactive statement checking photo URL:", { 
                newPhotoURL, 
                currentPhotoURL: photoURL,
                hasPhotoFile: $formStore.photoFile !== undefined,
                previewIsDataURL: $formStore.previewURL?.startsWith('data:')
            });
            
            // Always update the local photoURL variable
            if (newPhotoURL !== photoURL) {
                console.log("Updating photo URLs from user store:", {
                    old: photoURL,
                    new: newPhotoURL,
                });
                
                photoURL = newPhotoURL;
                
                // Update the form store if we don't have a pending photo change
                // or if we're coming from a successful save operation
                if (!$formStore.photoFile && !$formStore.previewURL?.startsWith('data:')) {
                    formStore.update(form => ({
                        ...form,
                        photoURL: newPhotoURL,
                        previewURL: newPhotoURL
                    }));
                    console.log("Form store updated with new photo URL");
                }
            }
        }
    }

    // Add this after form data initialization in onMount
    $: {
        // Check if any field has changed from its initial state
        hasChanges = formInitialized && (
            $formStore.firstName !== initialFormState.firstName ||
            $formStore.lastName !== initialFormState.lastName ||
            $formStore.about !== initialFormState.about ||
            $formStore.photoFile !== undefined
        );
    }
</script>

<div class="max-w-[632px]">
    {#if error}
        <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
        </div>
    {/if}

    <!-- Profile Picture Section -->
    <div class="flex items-center justify-between">
        <div class="mb-6 lg:mb-4 flex items-center justify-center gap-6">
            <div
                class="w-[72px] h-[72px] lg:w-[105px] lg:h-[105px] relative"
            >
                {#if loading}
                    <div
                        class="w-full h-full rounded-full bg-gray-200 animate-pulse"
                    />
                {:else if previewURL}
                    <img
                        src={previewURL.startsWith('data:') ? previewURL : previewURL + '?t=' + Date.now()}
                        alt="Profile"
                        class="profile-image w-full h-full rounded-full object-cover"
                        on:error={(e) => {
                            console.error("Image failed to load:", previewURL);
                            // If the preview URL fails, try using the photoURL directly
                            if (previewURL !== photoURL && photoURL) {
                                console.log("Falling back to photoURL:", photoURL);
                                formStore.update(form => ({
                                    ...form,
                                    previewURL: photoURL
                                }));
                            } else {
                                previewURL = "";
                            }
                        }}
                    />
                {:else}
                    <div
                        class="w-full h-full rounded-full bg-[#9a9999] flex items-center justify-center"
                    >
                        <span class="text-[#2A4D61] font-medium text-h4">
                            {(firstName[0] || "").toUpperCase()}
                        </span>
                    </div>
                {/if}
            </div>
            <div class="flex items-center justify-center gap-2 lg:gap-4">
                <button
                    class="px-2 py-1 bg-brand-navy text-white rounded-lg text-semibody-medium"
                    on:click={handleProfilePictureChange}
                    disabled={loading}
                >
                    Change picture
                </button>
                <button
                    class="px-2 py-1 bg-Black/5 text-[#FF0000] rounded-lg text-semibody-medium"
                    on:click={handleProfilePictureRemove}
                    disabled={loading}
                >
                    Delete Picture
                </button>
            </div>
        </div>
    </div>

    <div class="flex flex-col">
        <!-- Form Fields -->
    <div class="flex flex-col gap-4 md:gap-5">
        <!-- Name Fields -->
        <div class="grid grid-cols-2  gap-4">
            <div class="flex flex-col gap-2">
                <label
                    class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary"
                >
                    First Name
                </label>
                <input
                    type="text"
                    bind:value={$formStore.firstName}
                    class="w-full px-4 py-3 bg-white dark:bg-dark-bg-primary border-2 border-light-border dark:border-dark-border rounded-2xl text-mini-body text-light-text-primary dark:text-dark-text-primary"
                    placeholder="First Name"
                />
            </div>
            <div class="flex flex-col gap-2">
                <label
                    class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary"
                >
                    Last Name
                </label>
                <input
                    type="text"
                    bind:value={$formStore.lastName}
                    class="w-full px-4 py-3 bg-white dark:bg-dark-bg-primary border-2 border-light-border dark:border-dark-border rounded-2xl text-mini-body text-light-text-primary dark:text-dark-text-primary"
                    placeholder="Last Name"
                />
            </div>
        </div>

        <!-- Username -->
        <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
                <label
                    class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary"
                >
                    Username
                </label>
                <input
                    type="text"
                    value={username}
                    class="w-full px-4 py-3 bg-white/50 dark:bg-dark-bg-primary/50 border-2 border-light-border dark:border-dark-border rounded-2xl text-mini-body text-light-text-tertiary dark:text-dark-text-tertiary cursor-not-allowed"
                    placeholder="@username"
                    disabled
                />
            </div>

            <!-- Email -->
            <div class="flex flex-col gap-2">
                <label
                    class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary"
                >
                    Email address
                </label>
                <input
                    type="email"
                    value={email}
                    class="w-full px-4 py-3 bg-white/50 dark:bg-dark-bg-primary/50 border-2 border-light-border dark:border-dark-border rounded-2xl text-mini-body text-light-text-tertiary dark:text-dark-text-tertiary cursor-not-allowed"
                    placeholder="email"
                    disabled
                />
            </div>
        </div>

        <!-- About -->
        <div class="flex flex-col gap-2">
            <label
                class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary"
            >
                About
            </label>
            <textarea
                bind:value={$formStore.about}
                class="w-full px-4 py-3 bg-white dark:bg-dark-bg-primary border-2 border-light-border dark:border-dark-border rounded-2xl text-mini-body text-light-text-primary dark:text-dark-text-primary min-h-[120px] resize-none"
                placeholder="Write something about yourself..."
            />
        </div>

        <!-- Change Password Button -->
        {#if isEmailPasswordUser}
            <button
                class="text-brand-turquoise text-semibody-medium text-left hover:text-brand-navy transition-colors"
                on:click={handleChangePassword}
            >
                Change password
            </button>
        {/if}
        </div>

        <!-- Save Changes Button -->
        <div class="mt-6 md:mt-5 md:flex md:justify-end">
            <button
                class="w-fit px-6 py-3 text-semibody-medium rounded-2xl transition-colors {hasChanges ? 'bg-brand-navy hover:bg-GreenHover text-white' : 'bg-Black/5 text-light-text-tertiary dark:text-dark-text-tertiary'}"
                on:click={handleSaveChanges}
                disabled={!hasChanges || loading}
            >
                {loading ? "Saving..." : "Save changes"}
            </button>
        </div>

        <!-- Delete Account Button -->
        <div class="flex flex-col gap-4">
            {#if showDeleteConfirm}
                <div class="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                    <p
                        class="text-semi-body text-red-700 dark:text-red-400 mb-4"
                    >
                        Are you sure you want to delete your account? This
                        action cannot be undone.
                    </p>

                    {#if showReauthDialog}
                        <div class="mb-4">
                            <label
                                class="block text-semibody-medium text-light-text-primary dark:text-dark-text-primary mb-2"
                            >
                                Please enter your password to confirm
                            </label>
                            <input
                                type="password"
                                bind:value={password}
                                class="w-full px-4 py-3 bg-white dark:bg-dark-bg-primary border-2 border-light-border dark:border-dark-border rounded-2xl text-semi-body text-light-text-primary dark:text-dark-text-primary"
                                placeholder="Enter your password"
                            />
                            {#if reAuthError}
                                <p class="mt-1 text-sm text-red-600">
                                    {reAuthError}
                                </p>
                            {/if}
                        </div>
                    {/if}

                    <div class="flex gap-4">
                        <button
                            class="px-4 py-2 bg-[#FF0000] text-white rounded-2xl text-semibody-medium hover:bg-ButtonHover"
                            on:click={handleDeleteAccount}
                            disabled={deleteLoading}
                        >
                            {deleteLoading
                                ? "Deleting..."
                                : "Yes, Delete Account"}
                        </button>
                        <button
                            class="px-4 py-2 bg-[#F5F5F5] dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary rounded-2xl text-semibody-medium"
                            on:click={cancelDelete}
                            disabled={deleteLoading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            {:else}
                <div class="mt-8 md:mt-6 md:w-full md:flex md:items-center md:justify-start">
                <button
                    class="px-4 py-2 text-[#FF0000] text-semibody-medium rounded-lg bg-Black/5 w-full md:w-fit"
                    on:click={handleDeleteAccount}
                >
                    Delete Account
                    </button>
                </div>
            {/if}
        </div>
    </div>

    <!-- Add the modal component -->
    <ChangePasswordModal 
        bind:show={showChangePasswordModal}
        on:close={handleModalClose}
    />
</div>
