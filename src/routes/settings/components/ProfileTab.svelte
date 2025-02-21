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

    // Form data
    let firstName = "";
    let lastName = "";
    let username = "";
    let email = "";
    let about = "";
    let loading = false;
    let error: string | null = null;
    let photoFile: FileList;
    let previewURL = "";
    let photoURL = "";

    // Add state for delete confirmation
    let showDeleteConfirm = false;
    let deleteLoading = false;

    // Add state for re-authentication
    let showReauthDialog = false;
    let password = "";
    let reAuthError: string | null = null;

    // Handle photo file selection
    function handlePhotoSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            photoFile = input.files;

            // Revoke old preview URL if it exists
            if (previewURL && previewURL !== photoURL) {
                URL.revokeObjectURL(previewURL);
            }

            // Create new preview URL
            previewURL = URL.createObjectURL(file);
            console.log("Photo selected:", { file, previewURL });
        }
    }

    // Initialize form data
    onMount(async () => {
        if ($user?.uid) {
            try {
                loading = true;
                console.log(
                    "Starting profile initialization with user:",
                    $user,
                );

                // Wait for the user store to be fully initialized
                await new Promise((resolve) => setTimeout(resolve, 500));

                // First set basic data from Firebase Auth user
                const [first, ...rest] = ($user.displayName || "").split(" ");
                firstName = first || "";
                lastName = rest.join(" ") || "";
                photoURL = $user.photoURL || "";
                previewURL = $user.photoURL || "";
                email = $user.email || "";
                username = $user.username || "";

                // Then fetch and set additional data from Firestore
                const profile = await getUserProfile($user.uid);
                console.log("Fetched Firestore profile:", profile);

                if (profile) {
                    // Update fields with Firestore data if available
                    const [profileFirst, ...profileRest] = (
                        profile.displayName || ""
                    ).split(" ");
                    firstName = profileFirst || firstName;
                    lastName = profileRest.join(" ") || lastName;
                    username = profile.username || username;
                    photoURL = profile.photoURL || photoURL;
                    previewURL = profile.photoURL || previewURL;
                    about = profile.about || "";

                    console.log("Profile data set:", {
                        firstName,
                        lastName,
                        username,
                        photoURL,
                        previewURL,
                        about,
                    });
                }
            } catch (err) {
                console.error("Error loading profile:", err);
                error = "Failed to load profile data";
            } finally {
                loading = false;
            }
        }
    });

    // Handle profile picture change
    async function handleChangePicture() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = handlePhotoSelect;
        input.click();
    }

    // Handle profile picture delete
    async function handleDeletePicture() {
        try {
            if (!$user) return;

            photoURL = "";
            previewURL = "";

            const currentUser = auth.currentUser;
            if (currentUser) {
                // Update Firebase Auth profile
                await updateProfile(currentUser, {
                    photoURL: "",
                });

                // Update Firestore profile with all required fields
                await updateUserProfile($user.uid, {
                    photoURL: "",
                    displayName: currentUser.displayName || "", // Keep existing displayName
                    username: $user.username || "", // Keep existing username
                    email: currentUser.email || "", // Keep existing email
                    about: about || "", // Keep existing about text
                    updatedAt: new Date(),
                });

                // Refresh the user store to update UI
                await user.refresh();
            }
        } catch (err) {
            console.error("Error deleting profile picture:", err);
            error = "Failed to delete profile picture. Please try again.";
        }
    }

    // Handle password change
    function handleChangePassword() {
        // Implement password change logic
        console.log("Change password clicked");
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
        if (!$user) return;

        loading = true;
        error = null;
        console.log("Starting save with:", { photoFile, photoURL, previewURL });

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error("No authenticated user found");
            }

            let updatedPhotoURL = photoURL;

            // Handle photo upload if a new photo was selected
            if (photoFile?.[0]) {
                try {
                    updatedPhotoURL = await uploadProfileImage(
                        currentUser.uid,
                        photoFile[0],
                    );
                    console.log(
                        "Photo uploaded successfully:",
                        updatedPhotoURL,
                    );

                    // Update local state immediately after successful upload
                    photoURL = updatedPhotoURL;
                    previewURL = updatedPhotoURL;
                } catch (uploadError) {
                    console.error("Error uploading photo:", uploadError);
                    error = "Failed to upload photo. Please try again.";
                    return;
                }
            }

            const displayName = `${firstName} ${lastName}`.trim();
            console.log("Before profile updates:", {
                updatedPhotoURL,
                currentPhotoURL: currentUser.photoURL,
            });

            // First update Firebase Auth user profile
            await updateProfile(currentUser, {
                displayName,
                photoURL: updatedPhotoURL,
            });

            // Force reload the current user
            await currentUser.reload();
            console.log(
                "After Auth profile update, new photoURL:",
                currentUser.photoURL,
            );

            // Update Firestore profile
            const updateData = {
                displayName,
                photoURL: updatedPhotoURL,
                username: username || $user.username || "",
                email: currentUser.email || "",
                about: about || "",
                updatedAt: new Date(),
            };

            console.log("Updating Firestore with:", updateData);
            await updateUserProfile(currentUser.uid, updateData);
            console.log("After Firestore update");

            // Clear the file input
            photoFile = null;

            // Force refresh the user store and wait for it
            const updatedUser = await user.refresh();
            console.log("User store updated with:", updatedUser);

            // Force update the UI by triggering a state change
            setTimeout(() => {
                photoURL = updatedPhotoURL;
                previewURL = updatedPhotoURL;
                // Force a re-render of the image
                const img = document.querySelector(
                    ".profile-image",
                ) as HTMLImageElement;
                if (img) {
                    img.src = updatedPhotoURL;
                }
            }, 0);

            // Show success notification
            const notification = document.createElement("div");
            notification.className =
                "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50";
            notification.textContent = "Profile updated successfully!";
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        } catch (err) {
            console.error("Profile update error:", err);
            error = "Failed to update profile. Please try again.";
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

    // Update the reactive statement to handle all user data
    $: if ($user) {
        // Only update if values are empty or different
        if (!firstName || !lastName) {
            const [first, ...rest] = ($user.displayName || "").split(" ");
            firstName = first || firstName;
            lastName = rest.join(" ") || lastName;
        }
        if (!username) {
            username = $user.username || "";
        }
        if (!email) {
            email = $user.email || "";
        }
        if (!about && $user.about) {
            about = $user.about;
        }
        if (!photoURL || photoURL !== $user.photoURL) {
            photoURL = $user.photoURL || "";
            previewURL = $user.photoURL || "";
        }
        console.log("User store updated, refreshing UI with:", $user);
    }

    // Add this near the top of your script section
    $: {
        if ($user) {
            console.log("User store updated, refreshing UI with:", $user);
            const newPhotoURL = $user.photoURL || "";
            if (newPhotoURL !== photoURL) {
                console.log("Updating photo URLs:", {
                    old: photoURL,
                    new: newPhotoURL,
                });
                photoURL = newPhotoURL;
                previewURL = newPhotoURL;
            }
        }
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
                        src={previewURL}
                        alt="Profile"
                        class="profile-image w-full h-full rounded-full object-cover"
                        on:error={() => {
                            console.error("Image failed to load:", previewURL);
                            previewURL = "";
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
                    on:click={handleChangePicture}
                    disabled={loading}
                >
                    Change picture
                </button>
                <button
                    class="px-2 py-1 bg-Black/5 text-[#FF0000] rounded-lg text-semibody-medium"
                    on:click={handleDeletePicture}
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
                    bind:value={firstName}
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
                    bind:value={lastName}
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
                bind:value={about}
                class="w-full px-4 py-3 bg-white dark:bg-dark-bg-primary border-2 border-light-border dark:border-dark-border rounded-2xl text-mini-body text-light-text-primary dark:text-dark-text-primary min-h-[120px] resize-none"
                placeholder="Write something about yourself..."
            />
        </div>

        <!-- Change Password Button -->
        <button
            class="text-brand-turquoise text-semibody-medium text-left"
            on:click={handleChangePassword}
        >
            Change password
            </button>
        </div>

        <!-- Save Changes Button -->
        <div class="mt-6 md:mt-5 md:flex md:justify-end">
            <button
                class="w-fit px-6 py-3 bg-brand-navy hover:bg-GreenHover text-white rounded-2xl text-semibody-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                on:click={handleSaveChanges}
                disabled={loading}
            >
                Save changes
                <!-- {loading ? "Saving..." : "Save changes"} -->
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
</div>
