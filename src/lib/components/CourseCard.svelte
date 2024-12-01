<script lang="ts">
  import { Play, Share2 } from 'lucide-svelte';
  export let course;

  function handleShareCourse(courseId: string) {
    // Implement sharing functionality
    console.log(`Sharing course with ID: ${courseId}`);
  }
</script>

<div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
  <div class="relative h-[180px]">
    {#if course.Final_Module_YouTube_Video_URL && course.Final_Module_YouTube_Video_URL[0]}
      {@const videoId = new URL(course.Final_Module_YouTube_Video_URL[0]).searchParams.get('v')}
      <img 
        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
        alt={course.Final_Course_Title}
        class="w-full h-full object-cover"
        onerror="this.onerror=null; this.src=`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;"
      />
    {:else}
      <img 
        src="/placeholder.svg" 
        alt={course.Final_Course_Title} 
        class="w-full h-full object-cover" 
      />
    {/if}
    <div class="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
      <Play class="w-12 h-12 text-white" />
    </div>
  </div>
  <div class="p-4">
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-semibold text-lg text-[#2A4D61]">{course.Final_Course_Title}</h3>
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
        style="width: {course.completed_modules?.filter(Boolean).length / course.Final_Module_Title.length * 100}%"
      ></div>
    </div>
  </div>
  <div class="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
    <span class="text-sm text-[#1E3443]">
      {Math.round(course.completed_modules?.filter(Boolean).length / course.Final_Module_Title.length * 100)}% complete
    </span>
    <a 
      href="/course/{course.id}" 
      class="bg-[#EE434A] hover:bg-[#D93D44] text-white px-4 py-2 rounded-lg transition-colors duration-200"
    >
      Continue
    </a>
  </div>
</div>
