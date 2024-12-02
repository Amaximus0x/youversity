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

  function handleFilterChange(event) {
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
        sortedCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'date-old':
        sortedCourses.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        sortedCourses = [...userCourses];
    }
    
    filteredCourses = sortedCourses;
  }

  $: filteredCourses = userCourses;
</script>

<div class="max-w-2xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-6">Profile</h1>
  
  {#if profile}
    <div class="space-y-4">
      {#if profile.image}
        <div class="flex justify-center">
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
  {:else}
    <p>Loading profile...</p>
  {/if}
</div>

<div class="container mx-auto px-4 py-8">
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

<ShareModal
  show={showShareModal}
  courseId={selectedCourseId}
/> 