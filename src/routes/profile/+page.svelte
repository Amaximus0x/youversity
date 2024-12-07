<script lang="ts">
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import { user } from '$lib/stores/auth';
  import { getUserCourses } from '$lib/firebase';
  import type { FinalCourseStructure } from '$lib/types/course';
  import CourseList from '$lib/components/CourseList.svelte';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import CourseFilter from '$lib/components/CourseFilter.svelte';
  import { onMount } from 'svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';

  export let data: PageData;
  const { profile } = data;

  let userCourses: (FinalCourseStructure & { id: string })[] = [];
  let loading = false;
  let error: string | null = null;
  let filteredCourses = userCourses;
  let showShareModal = false;
  let selectedCourseId = '';

  $: if ($user) {
    loadUserCourses();
  }

  async function loadUserCourses() {
    try {
      loading = true;
      error = null;
      userCourses = await getUserCourses($user.uid);
      filteredCourses = [...userCourses];
    } catch (err) {
      console.error('Error loading courses:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function handleShareCourse(courseId: string) {
    selectedCourseId = courseId;
    showShareModal = true;
  }

  function handleFilterChange(event: any) {
    const filterValue = event.detail;
    let sortedCourses = [...userCourses];
    
    switch (filterValue) {
      case 'name-asc':
        sortedCourses.sort((a, b) => a.Final_Course_Title.localeCompare(b.Final_Course_Title));
        break;
      case 'name-desc':
        sortedCourses.sort((a, b) => b.Final_Course_Title.localeCompare(a.Final_Course_Title));
        break;
      case 'date-new':
        sortedCourses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date-old':
        sortedCourses.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      default:
        sortedCourses = [...userCourses];
    }
    
    filteredCourses = sortedCourses;
  }
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-[#2A4D61] mb-8">Profile</h1>

  <div class="bg-white rounded-lg shadow-md p-6 mb-8">
    {#if !profile}
      <div class="space-y-4">
        <div class="flex items-center space-x-4">
          <Skeleton height="96px" width="96px" borderRadius="50%" />
          <div class="space-y-2 flex-1">
            <Skeleton height="24px" width="150px" />
            <Skeleton height="20px" width="200px" />
          </div>
        </div>
        <div class="space-y-3">
          <Skeleton height="20px" width="80%" />
          <Skeleton height="20px" width="60%" />
          <Skeleton height="20px" width="70%" />
        </div>
      </div>
    {:else}
      <div class="flex flex-col md:flex-row md:items-center gap-6">
        {#if profile.image}
          <div class="flex-shrink-0">
            <img 
              src={profile.image} 
              alt={profile.name || 'Profile'} 
              class="w-24 h-24 rounded-full"
            />
          </div>
        {/if}
        
        <div class="space-y-2">
          <div>
            <span class="font-semibold">Name:</span>
            <span>{profile.name || 'Not provided'}</span>
          </div>
          
          <div>
            <span class="font-semibold">Email:</span>
            <span>{profile.email || 'Not provided'}</span>
          </div>
          
          <div>
            <span class="font-semibold">User ID:</span>
            <span>{profile.id || 'Not available'}</span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="mb-12">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-[#2A4D61]">My Courses</h2>
      <CourseFilter on:filterChange={handleFilterChange} />
    </div>
    
    <CourseList 
      courses={filteredCourses}
      {loading}
      {error}
      onShare={handleShareCourse}
    />
  </div>
</div>

{#if showShareModal}
  <ShareModal 
    show={showShareModal}
    courseId={selectedCourseId}
    onClose={() => showShareModal = false}
  />
{/if} 