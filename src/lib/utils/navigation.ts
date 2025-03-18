import { browser } from '$app/environment';

// Clear create course state when navigating away
export function clearCreateCourseState() {
  if (browser) {
    // Remove all course creation related items from localStorage
    localStorage.removeItem('youversity_course_objective');
    localStorage.removeItem('youversity_course_structure');
    localStorage.removeItem('youversity_module_videos');
    localStorage.removeItem('youversity_selected_videos');
    localStorage.removeItem('youversity_visited_modules');
    localStorage.removeItem('youversity_current_module_index');
    
    console.log('Create course state cleared from localStorage');
  }
}

// Check if the current page is the create-course page
export function isCreateCoursePage(path: string): boolean {
  return path.startsWith('/create-course');
} 