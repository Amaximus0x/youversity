<!-- Contact Page -->
<script lang="ts">
  import LandingHeader from '$lib/components/LandingHeader.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import ReCaptcha from '$lib/components/ReCaptcha.svelte';
  import { onMount } from 'svelte';
  import { theme } from '$lib/stores/theme';
  import { initRecaptcha, recaptchaToken } from '$lib/stores/recaptcha';
  import { RECAPTCHA_SITE_KEY } from '$lib/config/recaptcha';

  let firstName = "";
  let lastName = "";
  let email = "";
  let message = "";
  let loading = false;
  let formStatus: { success: boolean; message: string } | null = null;
  let token: string | null = null;

  recaptchaToken.subscribe((value) => {
    token = value;
  });

  onMount(async () => {
    await initRecaptcha(RECAPTCHA_SITE_KEY);
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!token) {
      formStatus = { 
        success: false, 
        message: 'Please complete the reCAPTCHA verification.' 
      };
      return;
    }

    loading = true;
    formStatus = null;
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          firstName, 
          lastName, 
          email, 
          message,
          recaptchaToken: token 
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        formStatus = { success: true, message: 'Thank you for your message! We will get back to you soon.' };
        // Reset form fields on success
        firstName = "";
        lastName = "";
        email = "";
        message = "";
        // Reset reCAPTCHA
        if (typeof window !== 'undefined' && window.grecaptcha) {
          window.grecaptcha.reset();
        }
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

<div class="min-h-screen flex flex-col bg-gradient-light dark:bg-gradient-dark">
  <!-- Landing Header -->
  <LandingHeader />
  
  <!-- Contact Content -->
  <section class="flex-1 px-4 pt-5 md:pt-12 pb-[20rem] ">
    <div class="max-w-[1160px] mx-auto">
      <!-- Header Text -->
      <div class="max-w-[800px] mx-auto text-center mb-12 lg:mb-16">
        <h1 class="text-h2-landing-mobile md:text-h2-landing text-light-text-secondary dark:text-dark-text-secondary mb-4">
          Collaborate with us
        </h1>
        <p class="text-light-text-tertiary dark:text-dark-text-tertiary text-mini-body md:text-body leading-snug">
          At Youversity, we're more than just a learning platform. We're a community driven by innovation and collaboration. We're eager to partner with educators, creators, and forward thinking businesses to shape the future of structured, AI-powered learning. Whether you have a partnership proposal, creative ideas, or simply want to explore collaboration opportunities, we'd love to hear from you. Please use the form below to reach out, and let's build something amazing together.
        </p>
      </div>

      <!-- Form Card -->
      <div class="max-w-[529px] h-[587px] mx-auto">
        <div class="bg-white dark:bg-dark-bg-primary rounded-[32px] border border-light-border dark:border-dark-border p-4 ">
          <div class="w-full">
            <!-- Form Header -->
            <div class="flex flex-col gap-2 mb-6">
              <h2 class="text-light-text-secondary dark:text-dark-text-secondary text-[32px] md:text-[40px] font-bold font-['Poppins'] leading-[44px]">Get in touch</h2>
              <p class="text-light-text-tertiary dark:text-dark-text-tertiary text-body">You can reach us anytime</p>
            </div>
            
            {#if formStatus}
              <div class="mb-6 p-4 rounded-2xl text-semi-body" class:bg-light-bg-tertiary={formStatus.success} class:bg-light-bg-secondary={!formStatus.success} class:text-brand-navy={formStatus.success} class:text-brand-red={!formStatus.success}>
                {formStatus.message}
              </div>
            {/if}
            
            <form on:submit={handleSubmit} class="flex flex-col gap-5">
              <!-- Name Fields -->
              <div class="flex flex-col gap-1">
                <div class="text-light-text-primary dark:text-dark-text-primary text-semibody-medium mb-1">
                  Name
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    bind:value={firstName} 
                    required
                    placeholder="First name"
                    class="w-full h-12 px-4 py-2 text-light-text-primary dark:text-dark-text-primary bg-white dark:bg-dark-bg-primary rounded-2xl border border-light-border dark:border-dark-border text-semi-body placeholder:text-mini-body placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
                  />
                  <input 
                    type="text" 
                    bind:value={lastName} 
                    required
                    placeholder="Last name"
                    class="w-full h-12 px-4 py-2 text-light-text-primary dark:text-dark-text-primary bg-white dark:bg-dark-bg-primary rounded-2xl border border-light-border dark:border-dark-border text-semi-body placeholder:text-mini-body placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
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
                  required
                  placeholder="Enter email address"
                  class="w-full h-12 px-4 py-2 text-light-text-primary dark:text-dark-text-primary bg-white dark:bg-dark-bg-primary rounded-2xl border border-light-border dark:border-dark-border text-semi-body placeholder:text-mini-body placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
                />
              </div>
              
              <!-- Message Field -->
              <div class="flex flex-col gap-1">
                <!-- <div class="text-light-text-primary dark:text-dark-text-primary text-semibody-medium mb-1">
                  How we can help?
                </div> -->
                <textarea 
                  bind:value={message} 
                  required
                  placeholder="How we can help?"
                  class="w-full h-[135px] px-4 py-2 text-light-text-primary dark:text-dark-text-primary bg-white dark:bg-dark-bg-primary rounded-2xl border border-light-border dark:border-dark-border text-semi-body placeholder:text-mini-body placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
                ></textarea>
              </div>

              <!-- ReCaptcha -->
              <div class="flex justify-center">
                <ReCaptcha siteKey={RECAPTCHA_SITE_KEY} />
              </div>
              
              <!-- Submit Button and Terms -->
              <div class="flex flex-col gap-4 mt-2">
                <button 
                  type="submit" 
                  class="w-full px-6 py-3 bg-brand-red hover:bg-ButtonHover rounded-2xl text-white text-body disabled:opacity-50 transition-colors"
                  disabled={loading}
                >
                  {#if loading}
                    Submitting...
                  {:else}
                    Submit
                  {/if}
                </button>

                <div class="text-center px-8">
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
  </section>
  
  <!-- Footer -->
  <Footer />
</div>

<style>
  :global(body) {
    @apply antialiased;
  }
</style> 