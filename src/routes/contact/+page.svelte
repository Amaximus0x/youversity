<script lang="ts">
  import LandingHeader from '$lib/components/LandingHeader.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { onMount } from 'svelte';

  let name = '';
  let email = '';
  let subject = '';
  let message = '';
  let isSubmitting = false;
  let submitSuccess = false;
  let submitError = false;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    
    // Validate form
    if (!name || !email || !message) {
      return;
    }
    
    isSubmitting = true;
    
    // Simulate form submission
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      submitSuccess = true;
      name = '';
      email = '';
      subject = '';
      message = '';
    } catch (error) {
      submitError = true;
      console.error('Error submitting form:', error);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-screen flex flex-col">
  <!-- Landing Header -->
  <LandingHeader />
  
  <!-- Contact Content -->
  <section class="flex-1 px-4 py-12 md:py-16 bg-dark-bg-primary">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-h1 text-white mb-8 text-center">Contact Us</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Contact Information -->
        <div class="bg-dark-bg-secondary rounded-xl p-6 md:p-8">
          <h2 class="text-h2 text-white mb-6">Get in Touch</h2>
          
          <div class="space-y-6">
            <div class="flex items-start">
              <div class="w-10 h-10 bg-brand-red/20 rounded-full flex items-center justify-center mr-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.5 17.5L18.5 14.5M18.5 14.5L15.5 17.5M18.5 14.5V19.5M12 16C12 16.5 11.8 17 11.42 17.38C11.0343 17.7657 10.5228 17.9956 9.98 18C9.22 18 9 17.5 8.5 17.5C8 17.5 7.73 18 7 18C6.27 18 6 17.5 5.5 17.5C5 17.5 4.78 18 4.02 18C3.48 18 2.96 17.77 2.58 17.38C2.2 17 2 16.5 2 16V5C2 4.5 2.2 4 2.58 3.62C2.96 3.23 3.48 3 4.02 3C4.78 3 5 3.5 5.5 3.5C6 3.5 6.27 3 7 3C7.73 3 8 3.5 8.5 3.5C9 3.5 9.22 3 9.98 3C10.52 3 11.04 3.23 11.42 3.62C11.8 4 12 4.5 12 5V10M12 10H7M12 10V13M7 7H12M4.5 13.5H9.5" stroke="#EE434A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 class="text-h4-medium text-white mb-1">Email</h3>
                <p class="text-semi-body text-white/80">
                  <a href="mailto:support@youversity.com" class="hover:text-brand-red transition-colors">
                    support@youversity.com
                  </a>
                </p>
              </div>
            </div>
            
            <div class="flex items-start">
              <div class="w-10 h-10 bg-brand-turquoise/20 rounded-full flex items-center justify-center mr-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.38028 8.85335C9.07627 10.303 10.0251 11.6616 11.2266 12.8631C12.428 14.0646 13.7867 15.0134 15.2363 15.7094C15.3612 15.7694 15.4237 15.7994 15.5206 15.8167C15.7734 15.8541 16.0346 15.7296 16.1786 15.5199C16.2277 15.4482 16.2674 15.3566 16.3467 15.1732C16.5677 14.6926 16.6782 14.4522 16.7988 14.2681C17.1043 13.8236 17.6265 13.5735 18.1677 13.6204C18.3289 13.6361 18.4992 13.6732 18.8397 13.7473C19.7801 13.9412 20.8779 14.2443 21.8333 14.6316C22.2386 14.7932 22.4412 14.874 22.5883 14.9888C22.9735 15.2917 23.1462 15.7913 23.0193 16.2679C22.9771 16.4212 22.8916 16.5913 22.7207 16.9316C22.2693 17.8093 21.6095 18.5303 20.7917 19.0195C20.5316 19.1842 20.2356 19.2903 19.9287 19.3315C19.7506 19.3557 19.5719 19.3491 19.3233 19.3359C18.6109 19.2963 17.8527 19.1218 17.1698 18.8692C15.5285 18.2271 14.0871 17.2926 12.8464 16.0519C11.6057 14.8112 10.6712 13.3698 10.0291 11.7285C9.77654 11.0456 9.60198 10.2874 9.56241 9.57496C9.54915 9.32633 9.54254 9.14767 9.56682 8.96954C9.60799 8.66258 9.71414 8.36657 9.87883 8.10648C10.368 7.28868 11.089 6.62884 11.9667 6.17743C12.307 6.00656 12.4771 5.92108 12.6304 5.87889C13.107 5.75198 13.6066 5.92463 13.9095 6.30986C14.0243 6.45695 14.1051 6.65952 14.2667 7.06486C14.654 8.02024 14.9571 9.11804 15.151 10.0584C15.2251 10.3989 15.2622 10.5693 15.2779 10.7304C15.3248 11.2717 15.0747 11.7938 14.6302 12.0994C14.4461 12.22 14.2057 12.3305 13.7251 12.5515C13.5417 12.6308 13.4501 12.6705 13.3784 12.7196C13.1687 12.8636 13.0442 13.1248 13.0816 13.3776C13.0989 13.4745 13.1289 13.537 13.1889 13.6619C13.8849 15.1116 14.8337 16.4702 16.0352 17.6717C17.2367 18.8732 18.5954 19.822 20.045 20.518C20.045 20.518 20.7978 20.8518 20.7978 20.8518C20.7978 20.8518 20.7978 20.8518 20.7978 20.8518C20.7978 20.8518 20.045 20.518 20.045 20.518C18.5954 19.822 17.2367 18.8732 16.0352 17.6717C14.8337 16.4702 13.8849 15.1116 13.1889 13.6619C13.1289 13.537 13.0989 13.4745 13.0816 13.3776C13.0442 13.1248 13.1687 12.8636 13.3784 12.7196C13.4501 12.6705 13.5417 12.6308 13.7251 12.5515C14.2057 12.3305 14.4461 12.22 14.6302 12.0994C15.0747 11.7938 15.3248 11.2717 15.2779 10.7304C15.2622 10.5693 15.2251 10.3989 15.151 10.0584C14.9571 9.11804 14.654 8.02024 14.2667 7.06486C14.1051 6.65952 14.0243 6.45695 13.9095 6.30986C13.6066 5.92463 13.107 5.75198 12.6304 5.87889C12.4771 5.92108 12.307 6.00656 11.9667 6.17743C11.089 6.62884 10.368 7.28868 9.87883 8.10648C9.71414 8.36657 9.60799 8.66258 9.56682 8.96954C9.54254 9.14767 9.54915 9.32633 9.56241 9.57496C9.60198 10.2874 9.77654 11.0456 10.0291 11.7285C10.6712 13.3698 11.6057 14.8112 12.8464 16.0519C14.0871 17.2926 15.5285 18.2271 17.1698 18.8692C17.8527 19.1218 18.6109 19.2963 19.3233 19.3359C19.5719 19.3491 19.7506 19.3557 19.9287 19.3315C20.2356 19.2903 20.5316 19.1842 20.7917 19.0195C21.6095 18.5303 22.2693 17.8093 22.7207 16.9316C22.8916 16.5913 22.9771 16.4212 23.0193 16.2679C23.1462 15.7913 22.9735 15.2917 22.5883 14.9888C22.4412 14.874 22.2386 14.7932 21.8333 14.6316C20.8779 14.2443 19.7801 13.9412 18.8397 13.7473C18.4992 13.6732 18.3289 13.6361 18.1677 13.6204C17.6265 13.5735 17.1043 13.8236 16.7988 14.2681C16.6782 14.4522 16.5677 14.6926 16.3467 15.1732C16.2674 15.3566 16.2277 15.4482 16.1786 15.5199C16.0346 15.7296 15.7734 15.8541 15.5206 15.8167C15.4237 15.7994 15.3612 15.7694 15.2363 15.7094C13.7867 15.0134 12.428 14.0646 11.2266 12.8631C10.0251 11.6616 9.07627 10.303 8.38028 8.85335Z" stroke="#42C1C8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 class="text-h4-medium text-white mb-1">Phone</h3>
                <p class="text-semi-body text-white/80">
                  <a href="tel:+1234567890" class="hover:text-brand-turquoise transition-colors">
                    +1 (234) 567-890
                  </a>
                </p>
              </div>
            </div>
            
            <div class="flex items-start">
              <div class="w-10 h-10 bg-brand-navy/20 rounded-full flex items-center justify-center mr-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 13V15M12 9H12.01M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#2A4D61" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 class="text-h4-medium text-white mb-1">Support Hours</h3>
                <p class="text-semi-body text-white/80">
                  Monday - Friday: 9am - 5pm EST
                </p>
              </div>
            </div>
          </div>
          
          <div class="mt-8">
            <h3 class="text-h4-medium text-white mb-4">Follow Us</h3>
            <div class="flex space-x-4">
              <a href="#" class="w-10 h-10 bg-brand-red/20 rounded-full flex items-center justify-center hover:bg-brand-red/30 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="#EE434A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
              <a href="#" class="w-10 h-10 bg-brand-turquoise/20 rounded-full flex items-center justify-center hover:bg-brand-turquoise/30 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 5.79997C21.2483 6.12606 20.4534 6.34163 19.64 6.43997C20.4982 5.92729 21.1413 5.12075 21.45 4.16997C20.6436 4.65003 19.7608 4.98826 18.84 5.16997C18.2245 4.50254 17.405 4.05826 16.5098 3.90682C15.6147 3.75537 14.6945 3.90532 13.8938 4.33315C13.093 4.76099 12.4569 5.4425 12.0852 6.2708C11.7135 7.09911 11.6273 8.02736 11.84 8.90997C10.2094 8.82749 8.61444 8.40292 7.15865 7.66383C5.70287 6.92474 4.41885 5.88766 3.39 4.61997C3.02914 5.25013 2.83952 5.96379 2.84 6.68997C2.83872 7.36435 3.00422 8.02858 3.32176 8.62353C3.63929 9.21848 4.09902 9.72568 4.66 10.1C4.00798 10.082 3.36989 9.90726 2.8 9.58997V9.63997C2.80489 10.5849 3.13599 11.4991 3.73731 12.2279C4.33864 12.9568 5.17326 13.4556 6.1 13.64C5.74326 13.7485 5.37288 13.8058 5 13.81C4.74189 13.807 4.48442 13.7835 4.23 13.74C4.49391 14.5528 5.00462 15.2631 5.69107 15.7721C6.37753 16.2811 7.20558 16.5635 8.06 16.58C6.6172 17.7152 4.83588 18.3348 3 18.34C2.66574 18.3411 2.33174 18.321 2 18.28C3.87443 19.4902 6.05881 20.1327 8.29 20.13C9.82969 20.1462 11.3571 19.8553 12.7831 19.2732C14.2091 18.6912 15.505 17.8308 16.5952 16.7406C17.6854 15.6504 18.5458 14.3545 19.1278 12.9285C19.7099 11.5025 20.0008 9.97506 19.9846 8.43537C19.9846 8.25737 19.9846 8.07437 19.9696 7.89437C20.7713 7.31383 21.4641 6.60306 22 5.79997Z" stroke="#42C1C8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
              <a href="#" class="w-10 h-10 bg-brand-navy/20 rounded-full flex items-center justify-center hover:bg-brand-navy/30 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke="#2A4D61" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6 9H2V21H6V9Z" stroke="#2A4D61" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z" stroke="#2A4D61" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        <!-- Contact Form -->
        <div class="bg-dark-bg-secondary rounded-xl p-6 md:p-8">
          <h2 class="text-h2 text-white mb-6">Send a Message</h2>
          
          {#if submitSuccess}
            <div class="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
              <p class="text-green-400 text-semi-body">
                Thank you for your message! We'll get back to you as soon as possible.
              </p>
            </div>
          {/if}
          
          {#if submitError}
            <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p class="text-red-400 text-semi-body">
                There was an error sending your message. Please try again later.
              </p>
            </div>
          {/if}
          
          <form on:submit={handleSubmit} class="space-y-4">
            <div>
              <label for="name" class="block text-white text-semi-body mb-2">Name</label>
              <input 
                type="text" 
                id="name" 
                bind:value={name} 
                required
                class="w-full px-4 py-3 bg-dark-bg-primary border border-dark-border rounded-lg focus:outline-none focus:border-brand-red text-white"
              />
            </div>
            
            <div>
              <label for="email" class="block text-white text-semi-body mb-2">Email</label>
              <input 
                type="email" 
                id="email" 
                bind:value={email} 
                required
                class="w-full px-4 py-3 bg-dark-bg-primary border border-dark-border rounded-lg focus:outline-none focus:border-brand-red text-white"
              />
            </div>
            
            <div>
              <label for="subject" class="block text-white text-semi-body mb-2">Subject</label>
              <input 
                type="text" 
                id="subject" 
                bind:value={subject}
                class="w-full px-4 py-3 bg-dark-bg-primary border border-dark-border rounded-lg focus:outline-none focus:border-brand-red text-white"
              />
            </div>
            
            <div>
              <label for="message" class="block text-white text-semi-body mb-2">Message</label>
              <textarea 
                id="message" 
                bind:value={message} 
                required
                rows="5"
                class="w-full px-4 py-3 bg-dark-bg-primary border border-dark-border rounded-lg focus:outline-none focus:border-brand-red text-white resize-none"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              class="w-full px-6 py-3 bg-brand-red text-white rounded-lg hover:bg-opacity-90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {#if isSubmitting}
                Sending...
              {:else}
                Send Message
              {/if}
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
  
  <!-- Footer -->
  <Footer />
</div> 