import { error } from '@sveltejs/kit';
import { getSharedCourse } from '$lib/firebase';

export async function load({ params }) {
    try {
        const courseData = await getSharedCourse(params.id);
        if (!courseData?.Final_Course_Quiz) {
            throw error(404, 'Quiz not found');
        }
        return {
            courseData
        };
    } catch (err) {
        throw error(500, 'Failed to load quiz');
    }
} 