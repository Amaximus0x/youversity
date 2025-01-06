import { collection, query, where, getDocs, orderBy, type Query, type QuerySnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '$lib/firebase';
import type { FinalCourseStructure } from '$lib/types/course';

export type SearchFilter = 'relevance' | 'rating' | 'latest';

interface SearchResult extends FinalCourseStructure {
  id: string;
  relevanceScore: number;
}

export async function searchCourses(
  searchQuery: string,
  filter: SearchFilter = 'relevance'
): Promise<SearchResult[]> {
  try {
    // Get all public courses
    const coursesRef = collection(db, 'courses');
    const q = query(
      coursesRef,
      where('isPublic', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    let results: SearchResult[] = [];

    // Process each document and calculate relevance score
    querySnapshot.forEach((doc) => {
      const courseData = doc.data() as FinalCourseStructure;
      const title = courseData.Final_Course_Title.toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      
      // Calculate relevance score
      let relevanceScore = 0;
      
      // Exact match in title gets highest score
      if (title === searchLower) {
        relevanceScore = 100;
      }
      // Title starts with search term gets high score
      else if (title.startsWith(searchLower)) {
        relevanceScore = 80;
      }
      // Contains exact search term gets medium score
      else if (title.includes(searchLower)) {
        relevanceScore = 60;
      }
      // Contains any word from search term gets lower score
      else {
        const searchWords = searchLower.split(' ');
        for (const word of searchWords) {
          if (title.includes(word)) {
            relevanceScore += 20;
          }
        }
      }

      // Only include results that have some relevance
      if (relevanceScore > 0) {
        results.push({
          ...courseData,
          id: doc.id,
          relevanceScore
        });
      }
    });

    // Sort results based on filter
    switch (filter) {
      case 'relevance':
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        break;
      case 'rating':
        results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'latest':
        results.sort((a, b) => {
          const dateA = a.createdAt instanceof Date 
            ? a.createdAt 
            : a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date 
            ? b.createdAt 
            : b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        break;
    }

    return results;
  } catch (error) {
    console.error('Error searching courses:', error);
    throw error;
  }
} 