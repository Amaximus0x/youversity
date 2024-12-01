<script lang="ts">
  import { goto } from '$app/navigation';
  export let course: {
    id: string;
    Final_Course_Title: string;
    Final_Course_Objective: string;
    Final_Module_Title: string[];
  };

  function handleCourseClick() {
    goto(`/course/${course.id}`);
  }
</script>

<button
  on:click={handleCourseClick}
  class="text-left border rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:scale-102 bg-white"
>
  <h2 class="text-xl font-semibold mb-2 text-blue-600">{course.Final_Course_Title}</h2>
  <p class="text-gray-600 mb-4">{course.Final_Course_Objective}</p>
  <div class="flex justify-between items-center text-sm text-gray-500">
    <span>{course.Final_Module_Title.length} Modules</span>
    <span class="text-blue-500 hover:text-blue-700">View Course →</span>
  </div>
</button>
