<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { signInWithGoogle } from '$lib/services/auth';
  import { page } from '$app/stores';
  import { 
    ArrowRight, 
    Share2, 
    ThumbsUp, 
    ThumbsDown, 
    Eye,
    Play 
  } from 'lucide-svelte';

  let learningObjective = '';

  // Sample course data (replace with actual data from your backend)
  const courses = [
    { id: 1, title: 'Python for Beginners', progress: 60, image: '/placeholder.svg' },
    { id: 2, title: 'Advanced JavaScript', progress: 30, image: '/placeholder.svg' },
    { id: 3, title: 'Data Science Fundamentals', progress: 80, image: '/placeholder.svg' },
    { id: 4, title: 'Machine Learning Basics', progress: 10, image: '/placeholder.svg' },
    { id: 5, title: 'Web Development with React', progress: 45, image: '/placeholder.svg' },
    { id: 6, title: 'iOS App Development', progress: 0, image: '/placeholder.svg' },
  ];

  const trendingCourses = [
    { id: 1, title: 'Blockchain Fundamentals', author: 'Crypto Expert', image: '/placeholder.svg', likes: 1200, dislikes: 50, views: 15000 },
    { id: 2, title: 'AI and Machine Learning', author: 'Data Scientist Pro', image: '/placeholder.svg', likes: 980, dislikes: 30, views: 12000 },
    { id: 3, title: 'Full Stack Web Development', author: 'Code Ninja', image: '/placeholder.svg', likes: 850, dislikes: 20, views: 10000 },
  ];

  async function handleCreateCourse(e: Event) {
    e.preventDefault();
    
    if (!learningObjective.trim()) {
      return; // Don't proceed if learning objective is empty
    }

    try {
      if ($user) {
        // For authenticated users, go directly to create-course with the objective
        window.location.href = `/create-course?objective=${encodeURIComponent(learningObjective)}`;
      } else {
        // For unauthenticated users, redirect to login with return URL
        const returnUrl = `/create-course?objective=${encodeURIComponent(learningObjective)}`;
        window.location.href = `/login?redirectTo=${encodeURIComponent(returnUrl)}`;
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  function handleShareCourse(courseId: number) {
    console.log(`Sharing course with ID: ${courseId}`);
    // Implement sharing functionality
  }
</script>

<!-- Create Course Section -->
<div class="relative overflow-hidden bg-gradient-to-br from-[#F5F5F5] to-white rounded-lg shadow-lg p-12 mb-12">
  <div class="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5"></div>
  
  <div class="max-w-2xl mx-auto text-center relative">
    <div class="flex items-center justify-center mb-6">
      <img 
        src="/favicon.png" 
        alt="Youversity Logo" 
        class="w-12 h-12 object-contain"
      />
    </div>
    <h2 class="text-4xl font-bold text-[#2A4D61] mb-4">
      Create Your Course
    </h2>
    
    <p class="text-[#1E3443]/80 mb-8">
      Enter your learning objective and let our AI build a course for you
    </p>

    <form on:submit={handleCreateCourse} class="space-y-6">
      <input
        type="text"
        placeholder="e.g., Learn Python for Data Science"
        bind:value={learningObjective}
        class="w-full text-lg py-6 px-4 rounded-lg bg-white shadow-inner border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EE434A]"
      />

      <button 
        type="submit" 
        class="w-full bg-[#EE434A] hover:bg-[#D93D44] text-white text-lg py-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
      >
        {$user ? 'Build My Course' : 'Start with Google'}
        <ArrowRight class="ml-2 w-6 h-6" />
      </button>
    </form>
  </div>
</div>

{#if $user}
  <!-- My Courses Section -->
  <div class="mb-12">
    <h2 class="text-2xl font-bold text-[#2A4D61] mb-6">My Courses</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each courses as course}
        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div class="relative h-[180px]">
            <img src={course.image} alt={course.title} class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
              <Play class="w-12 h-12 text-white" />
            </div>
          </div>
          <div class="p-4">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold text-lg text-[#2A4D61]">{course.title}</h3>
              <button
                class="p-1 hover:bg-[#F5F5F5] rounded-full transition-colors duration-200"
                on:click={() => handleShareCourse(course.id)}
              >
                <Share2 class="w-5 h-5 text-[#2A4D61]" />
              </button>
            </div>
            <div class="w-full h-2 bg-[#D9E1E3] rounded-full mb-2">
              <div 
                class="h-full bg-[#42C1C8] rounded-full" 
                style="width: {course.progress}%"
              ></div>
            </div>
          </div>
          <div class="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
            <span class="text-sm text-[#1E3443]">{course.progress}% complete</span>
            <a 
              href="/course/{course.id}" 
              class="bg-[#EE434A] hover:bg-[#D93D44] text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Continue
            </a>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Trending Community Courses Section -->
  <div>
    <h2 class="text-2xl font-bold text-[#2A4D61] mb-6">Trending Community Courses</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each trendingCourses as course}
        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div class="relative h-[180px]">
            <img src={course.image} alt={course.title} class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
              <Play class="w-12 h-12 text-white" />
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-lg text-[#2A4D61] mb-1">{course.title}</h3>
            <p class="text-sm text-[#1E3443]/60 mb-2">by {course.author}</p>
            <div class="flex items-center justify-between text-sm text-[#1E3443]/80">
              <div class="flex items-center space-x-4">
                <span class="flex items-center">
                  <ThumbsUp class="w-4 h-4 mr-1" />
                  {course.likes}
                </span>
                <span class="flex items-center">
                  <ThumbsDown class="w-4 h-4 mr-1" />
                  {course.dislikes}
                </span>
              </div>
              <span class="flex items-center">
                <Eye class="w-4 h-4 mr-1" />
                {course.views}
              </span>
            </div>
          </div>
          <div class="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
            <a 
              href="/course/{course.id}" 
              class="border border-[#2A4D61] text-[#2A4D61] hover:bg-[#2A4D61] hover:text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              View Course
            </a>
            <div class="flex space-x-2">
              <button class="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors duration-200">
                <ThumbsUp class="w-5 h-5 text-[#2A4D61]" />
              </button>
              <button class="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors duration-200">
                <ThumbsDown class="w-5 h-5 text-[#2A4D61]" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
