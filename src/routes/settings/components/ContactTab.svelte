<script lang="ts">
  let firstName = "";
  let lastName = "";
  let email = "";
  let message = "";
  let loading = false;
  let formStatus: { success: boolean; message: string } | null = null;

  async function handleSubmit() {
    loading = true;
    formStatus = null;
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email, message }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        formStatus = { success: true, message: 'Thank you for your message! We will get back to you soon.' };
        // Reset form fields on success
        firstName = "";
        lastName = "";
        email = "";
        message = "";
      } else {
        formStatus = { success: false, message: result.message || 'Failed to send message. Please try again.' };
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      formStatus = { success: false, message: 'An unexpected error occurred. Please try again later.' };
    } finally {
      loading = false;
    }
  }
</script>

<div class="w-full">
  <div class="flex flex-col lg:flex-row lg:gap-16 lg:justify-between">
    <!-- Left Content -->
    <div class="flex flex-col gap-8 lg:max-w-[480px]">
      <!-- Header -->
      <div class="text-light-text-primary dark:text-dark-text-primary text-h2">
        Contact Us
      </div>

      <!-- Contact Info -->
      <div class="flex-col justify-start items-start gap-4 inline-flex">
        <div class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body">
          Email, call or fill the form to learn how youversity can solve your
          learning difficulties.
        </div>
        <div class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body">
          team@youversity.io
        </div>
        <div class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body">
          411-334-567
        </div>
      </div>

      <!-- Customer Support Section -->
      <div class="flex flex-col gap-4">
        <div class="text-light-text-primary dark:text-dark-text-primary text-body underline">
          Customer support
        </div>
        <div class="flex flex-col gap-[18px]">
          <div class="flex flex-col gap-2">
            <div class="text-light-text-primary dark:text-dark-text-primary text-body-semibold">
              Customer support
            </div>
            <div class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body">
              Our support team is here 24/7 to assist you with any questions or
              concerns you may have.
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <div class="text-light-text-primary dark:text-dark-text-primary text-body-semibold">
              Feedback and suggestion
            </div>
            <div class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body">
              We truly appreciate your feedback and are constantly striving to
              enhance Youversity. Your insights play a vital role in shaping its
              future.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Content - Contact Form -->
    <div class="mt-8 lg:mt-0 lg:flex-1 lg:max-w-[573px] xl:max-w-[700px]">
      <div class="w-full bg-white dark:bg-dark-bg-primary rounded-[32px] border border-light-border dark:border-dark-border p-4 md:p-6 lg:p-8">
        <!-- Form Header -->
        <div class="flex flex-col gap-2 mb-6">
          <div class="text-light-text-primary dark:text-dark-text-primary text-h2 font-medium">
            Get in touch
          </div>
          <div class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body">
            You can reach us anytime
          </div>
        </div>

        <!-- Form Status Message -->
        {#if formStatus}
          <div class="mb-6 p-4 rounded-2xl text-semi-body" class:bg-light-bg-tertiary={formStatus.success} class:bg-light-bg-secondary={!formStatus.success} class:text-brand-navy={formStatus.success} class:text-brand-red={!formStatus.success}>
            {formStatus.message}
          </div>
        {/if}

        <!-- Form Content -->
        <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-6">
          <!-- Name Fields -->
          <div class="flex flex-col gap-1">
            <div class="text-light-text-primary dark:text-dark-text-primary text-semibody-medium mb-1">
              Name
            </div>
            <div class="grid grid-cols-2 gap-2">
              <input
                type="text"
                bind:value={firstName}
                placeholder="First name"
                class="w-full h-12 px-4 py-2 bg-white dark:bg-dark-bg-primary rounded-2xl border border-light-border dark:border-dark-border text-semi-body placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary"
                required
              />
              <input
                type="text"
                bind:value={lastName}
                placeholder="Last name"
                class="w-full h-12 px-4 py-2 bg-white dark:bg-dark-bg-primary rounded-2xl border border-light-border dark:border-dark-border text-semi-body placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary"
                required
              />
            </div>
          </div>

          <!-- Email Field -->
          <div class="flex flex-col gap-1">
            <div class="text-light-text-primary dark:text-dark-text-primary text-semibody-medium mb-1">
              Email address
            </div>
            <input
              type="email"
              bind:value={email}
              placeholder="Enter email address"
              class="w-full h-12 px-4 py-2 bg-white dark:bg-dark-bg-primary rounded-2xl border border-light-border dark:border-dark-border text-semi-body placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary"
              required
            />
          </div>

          <!-- Message Field -->
          <div class="flex flex-col gap-1">
            <textarea
              bind:value={message}
              placeholder="How we can help?"
              class="w-full h-[135px] px-4 py-2 bg-white dark:bg-dark-bg-primary rounded-2xl border border-light-border dark:border-dark-border text-semi-body placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary resize-none"
              required
            />
          </div>

          <!-- Submit Button and Terms -->
          <div class="flex flex-col gap-4 mt-2">
            <button
              type="submit"
              class="w-full px-6 py-3 bg-brand-red hover:bg-ButtonHover rounded-2xl text-white text-body disabled:opacity-50 transition-colors"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
            
            <div class="text-center">
              <span class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body">
                By contacting us you agree with our{" "}
              </span>
              <a href="/terms" class="text-brand-red hover:underline text-semi-body">
                Terms of service
              </a>
              <span class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body">
                {" "}and{" "}
              </span>
              <a href="/privacy" class="text-brand-red hover:underline text-semi-body">
                Privacy Policy
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
