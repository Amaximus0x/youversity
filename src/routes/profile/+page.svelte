<script lang="ts">
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import { user } from '$lib/stores/auth';
  import { getUserCourses, toggleCoursePrivacy, getUserBookmarks } from '$lib/firebase';
  import type { FinalCourseStructure } from '$lib/types/course';
  import CourseList from '$lib/components/CourseList.svelte';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import CourseFilter from '$lib/components/CourseFilter.svelte';
  import { onMount } from 'svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import ProfileEditModal from '$lib/components/ProfileEditModal.svelte';
  import { getUserProfile } from '$lib/services/profile';

  export let data: PageData;
  
  let userCourses: (FinalCourseStructure & { id: string })[] = [];
  let bookmarkedCourses: (FinalCourseStructure & { id: string })[] = [];
  let loading = false;
  let bookmarksLoading = false;
  let error: string | null = null;
  let bookmarksError: string | null = null;
  let filteredCourses = userCourses;
  let filteredBookmarks = bookmarkedCourses;
  let showShareModal = false;
  let selectedCourseId = '';
  let showEditModal = false;

  $: profile = $user ? {
    name: $user.displayName,
    email: $user.email,
    image: $user.photoURL,
    id: $user.uid
  } : null;

  $: if ($user) {
    loadUserCourses();
    loadBookmarkedCourses();
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

  async function loadBookmarkedCourses() {
    if (!$user) return;
    
    try {
      bookmarksLoading = true;
      bookmarksError = null;
      bookmarkedCourses = await getUserBookmarks($user.uid);
      filteredBookmarks = [...bookmarkedCourses];
    } catch (err) {
      console.error('Error loading bookmarked courses:', err);
      bookmarksError = err.message;
    } finally {
      bookmarksLoading = false;
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

  function handleBookmarksFilterChange(event: any) {
    const filterValue = event.detail;
    let sortedCourses = [...bookmarkedCourses];
    
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
        sortedCourses = [...bookmarkedCourses];
    }
    
    filteredBookmarks = sortedCourses;
  }

  async function handleTogglePrivacy(courseId: string, isPublic: boolean) {
    try {
      await toggleCoursePrivacy(courseId, isPublic);
      await loadUserCourses();
    } catch (error) {
      console.error('Error toggling course privacy:', error);
    }
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
      <div class="flex flex-col lg:flex-row gap-6">
        <div class="flex-shrink-0 flex flex-col items-center">
          {#if profile.image}
            <img 
              src={profile.image} 
              alt={profile.name || 'Profile'} 
              class="w-32 h-32 rounded-full mb-4 object-cover border-4 border-blue-100"
            />
          {/if}
          <button
            on:click={() => showEditModal = true}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 w-full"
          >
            Edit Profile
          </button>
        </div>

        <div class="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="profile-field">
              <span class="text-gray-600 font-semibold">Name:</span>
              <span class="text-gray-800">{profile.name || 'Not provided'}</span>
            </div>
            
            <div class="profile-field">
              <span class="text-gray-600 font-semibold">Email:</span>
              <span class="text-gray-800">{profile.email || 'Not provided'}</span>
            </div>
          </div>

          <div class="space-y-2">
            {#await getUserProfile(profile.id) then userProfile}
              <div class="profile-field">
                <span class="text-gray-600 font-semibold">Date of Birth:</span>
                <span class="text-gray-800">{userProfile?.dateOfBirth || 'Not provided'}</span>
              </div>

              <div class="profile-field">
                <span class="text-gray-600 font-semibold">Gender:</span>
                <span class="text-gray-800">{userProfile?.gender || 'Not provided'}</span>
              </div>

              <div class="profile-field">
                <span class="text-gray-600 font-semibold">Country:</span>
                <span class="text-gray-800">{userProfile?.country || 'Not provided'}</span>
              </div>

              <div class="profile-field">
                <span class="text-gray-600 font-semibold">Phone Number:</span>
                <span class="text-gray-800">{userProfile?.phoneNumber || 'Not provided'}</span>
              </div>

              <div class="profile-field">
                <span class="text-gray-600 font-semibold">Member Since:</span>
                <span class="text-gray-800">
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Not available'}
                </span>
              </div>
            {/await}
          </div>
        </div>
      </div>

      {#if showEditModal}
        <ProfileEditModal 
          user={$user} 
          on:close={() => showEditModal = false} 
        />
      {/if}
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
      onTogglePrivacy={handleTogglePrivacy}
    />
  </div>

  <div class="mb-12">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-[#2A4D61]">Bookmarked Courses</h2>
      <CourseFilter on:filterChange={handleBookmarksFilterChange} />
    </div>
    
    <CourseList 
      courses={filteredBookmarks}
      loading={bookmarksLoading}
      error={bookmarksError}
      onShare={handleShareCourse}
      onTogglePrivacy={handleTogglePrivacy}
      showPrivacyToggle={false}
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

<style>
  .profile-field {
    @apply flex flex-col;
  }

  @screen md {
    .profile-field {
      @apply flex-row gap-2;
    }
  }
</style> 