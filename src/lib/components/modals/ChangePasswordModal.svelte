<!-- Change Password Modal -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
    import { auth } from '$lib/firebase';

    const dispatch = createEventDispatcher();

    export let show = false;

    let currentPassword = '';
    let newPassword = '';
    let confirmPassword = '';
    let error: string | null = null;
    let loading = false;

    function close() {
        show = false;
        dispatch('close');
        // Reset form
        currentPassword = '';
        newPassword = '';
        confirmPassword = '';
        error = null;
    }

    async function handleSubmit() {
        error = null;
        loading = true;

        try {
            // Validate passwords
            if (newPassword !== confirmPassword) {
                error = 'New passwords do not match';
                return;
            }

            if (newPassword.length < 6) {
                error = 'New password must be at least 6 characters long';
                return;
            }

            const user = auth.currentUser;
            if (!user || !user.email) {
                error = 'No authenticated user found';
                return;
            }

            // Re-authenticate user
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);

            // Close modal on success
            close();
        } catch (err) {
            console.error('Error changing password:', err);
            if (err instanceof Error) {
                if (err.message.includes('auth/invalid-credential')) {
                    error = 'Invalid current password';
                } else {
                    error = 'Failed to change password. Please try again.';
                }
            } else {
                error = 'An unexpected error occurred';
            }
        } finally {
            loading = false;
        }
    }
</script>

{#if show}
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
        <div class="flex flex-col gap-8 bg-gradient-light dark:bg-gradient-dark rounded-2xl w-full max-w-md p-4">
            <div class="flex items-center gap-4">
                <button 
                    class="text-2xl text-light-text-primary dark:text-dark-text-primary"
                    on:click={close}
                >
                    <img src="/icons/arrow-left.svg" alt="Back" class="w-6 h-6" />
                </button>
                <h2 class="text-h4-medium font-semibold text-light-text-primary dark:text-dark-text-primary">
                    Change Password
                </h2>
            </div>

            {#if error}
                <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-semi-body">
                    {error}
                </div>
            {/if}

            <form on:submit|preventDefault={handleSubmit} class="space-y-4">
                <div>
                    <input
                        id="currentPassword"
                        type="password"
                        bind:value={currentPassword}
                        placeholder="Current Password"
                        class="w-full px-4 py-3 bg-white dark:bg-dark-bg-primary border-2 border-light-border dark:border-dark-border rounded-2xl text-mini-body text-light-text-primary dark:text-dark-text-primary"
                        required
                    />
                </div>

                <div>
                    <input
                        id="newPassword"
                        type="password"
                        bind:value={newPassword}
                        placeholder="New Password"
                        class="w-full px-4 py-3 bg-white dark:bg-dark-bg-primary border-2 border-light-border dark:border-dark-border rounded-2xl text-mini-body text-light-text-primary dark:text-dark-text-primary"
                        required
                    />
                </div>

                <div>
                    <input
                        id="confirmPassword"
                        type="password"
                        bind:value={confirmPassword}
                        placeholder="Re-enter Password"
                        class="w-full px-4 py-3 bg-white dark:bg-dark-bg-primary border-2 border-light-border dark:border-dark-border rounded-2xl text-mini-body text-light-text-primary dark:text-dark-text-primary"
                        required
                    />
                </div>

                <div class="flex justify-end">
                    <button
                    type="submit"
                    class="w-full px-4 py-2 mt-[8px] text-sem-ibody rounded-lg bg-[#EE434A] text-white hover:bg-ButtonHover transition-colors disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
                </div>
            </form>
        </div>
    </div>
{/if} 