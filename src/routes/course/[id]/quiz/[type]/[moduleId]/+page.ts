import { error } from '@sveltejs/kit';
import { getSharedCourse } from '$lib/firebase';

export async function load({ params }) {
    try {
        const courseData = await getSharedCourse(params.id);
        const moduleId = parseInt(params.moduleId) - 1; // Convert to 0-based index
        
        if (!courseData?.Final_Module_Quiz?.[moduleId]) {
            throw error(404, 'Quiz not found');
        }

        return {
            courseData,
            moduleId,
            quiz: courseData.Final_Module_Quiz[moduleId],
            moduleTitle: courseData.Final_Module_Title[moduleId]
        };
    } catch (err) {
        console.error('Error loading quiz:', err);
        throw error(500, 'Failed to load quiz');
    }
} 