import { collection, query, where, getDocs, orderBy, limit, type Query, type QuerySnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '$lib/firebase';
import type { FinalCourseStructure } from '$lib/types/course';

export type SearchFilter = 'relevance' | 'latest' | 'earliest';

interface SearchResult {
  courses: (FinalCourseStructure & { id: string })[];
  total: number;
}

interface RecentSearch {
  query: string;
  timestamp: number;
}

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

export async function searchCourses(
  searchQuery: string,
  filter: SearchFilter = 'relevance',
  pageSize = 10
): Promise<SearchResult> {
  console.log('Search service called with:', { searchQuery, filter, pageSize });
  
  const coursesRef = collection(db, 'courses');
  let q = query(coursesRef, where('isPublic', '==', true));

  try {
    // First try with the composite index
    if (filter === 'latest' || filter === 'earliest') {
      q = query(q, orderBy('createdAt', filter === 'earliest' ? 'asc' : 'desc'));
    } else {
      q = query(q, orderBy('views', 'desc'));
    }

    const snapshot = await getDocs(q);
    let courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (FinalCourseStructure & { id: string })[];

    // Apply search filtering
    if (searchQuery) {
      const searchTerms = searchQuery.toLowerCase().split(' ');
      courses = courses.filter(course => {
        const title = course.Final_Course_Title?.toLowerCase() || '';
        const objective = course.Final_Course_Objective?.toLowerCase() || '';
        const modulesTitles = course.Final_Module_Title?.map(title => title.toLowerCase()) || [];
        
        return searchTerms.some(term => 
          title.includes(term) || 
          objective.includes(term) ||
          modulesTitles.some(moduleTitle => moduleTitle.includes(term))
        );
      });

      // Sort by relevance if needed
      if (filter === 'relevance') {
        courses.sort((a, b) => {
          const scoreA = calculateRelevanceScore(a, searchTerms);
          const scoreB = calculateRelevanceScore(b, searchTerms);
          return scoreB - scoreA;
        });
      }
    }

    // Limit results after filtering
    courses = courses.slice(0, pageSize);

    return {
      courses,
      total: courses.length
    };

  } catch (error) {
    console.error('Search error:', error);
    
    // Fallback: If index error, fetch all and sort client-side
    if (error.toString().includes('requires an index')) {
      const fallbackQuery = query(coursesRef, where('isPublic', '==', true));
      const snapshot = await getDocs(fallbackQuery);
      let courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (FinalCourseStructure & { id: string })[];

      // Apply search and sorting client-side
      if (searchQuery) {
        const searchTerms = searchQuery.toLowerCase().split(' ');
        courses = courses.filter(course => {
          const title = course.Final_Course_Title?.toLowerCase() || '';
          const objective = course.Final_Course_Objective?.toLowerCase() || '';
          const modulesTitles = course.Final_Module_Title?.map(title => title.toLowerCase()) || [];
          
          return searchTerms.some(term => 
            title.includes(term) || 
            objective.includes(term) ||
            modulesTitles.some(moduleTitle => moduleTitle.includes(term))
          );
        });
      }

      // Apply sorting
      if (filter === 'latest' || filter === 'earliest') {
        courses.sort((a, b) => {
          const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || 0);
          const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || 0);
          return filter === 'earliest' ? 
            dateA.getTime() - dateB.getTime() : 
            dateB.getTime() - dateA.getTime();
        });
      }

      courses = courses.slice(0, pageSize);
      return {
        courses,
        total: courses.length
      };
    }

    throw error;
  }
}

function calculateRelevanceScore(
  course: FinalCourseStructure, 
  searchTerms: string[]
): number {
  const title = course.Final_Course_Title?.toLowerCase() || '';
  const objective = course.Final_Course_Objective?.toLowerCase() || '';
  const modulesTitles = course.Final_Module_Title?.map(title => title.toLowerCase()) || [];
  
  let score = 0;
  
  // Calculate exact match bonus
  const exactMatchBonus = searchTerms.join(' ');
  if (title.includes(exactMatchBonus)) score += 50;
  if (objective.includes(exactMatchBonus)) score += 25;
  
  // Calculate individual term matches
  searchTerms.forEach(term => {
    // Title matches (highest priority)
    if (title.includes(term)) score += 10;
    
    // Objective matches (medium priority)
    if (objective.includes(term)) score += 5;
    
    // Module title matches (lower priority)
    modulesTitles.forEach(moduleTitle => {
      if (moduleTitle.includes(term)) score += 3;
    });
  });

  // Add normalized view count as a tiebreaker
  score += (course.views || 0) / 1000;
  
  return score;
}

// Recent searches management
export function saveRecentSearch(query: string): void {
  if (!query.trim()) return;

  const searches = getRecentSearches();
  const newSearch: RecentSearch = {
    query: query.trim(),
    timestamp: Date.now()
  };

  // Remove duplicate if exists
  const uniqueSearches = searches.filter(s => s.query !== newSearch.query);
  
  // Add new search at the beginning
  uniqueSearches.unshift(newSearch);
  
  // Keep only the most recent searches
  const limitedSearches = uniqueSearches.slice(0, MAX_RECENT_SEARCHES);

  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(limitedSearches));
}

export function getRecentSearches(): RecentSearch[] {
  try {
    const searches = localStorage.getItem(RECENT_SEARCHES_KEY);
    return searches ? JSON.parse(searches) : [];
  } catch {
    return [];
  }
}

export function clearRecentSearches(): void {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

// Get popular search recommendations
export async function getSearchRecommendations(): Promise<string[]> {
  const recommendationsRef = collection(db, 'searchRecommendations');
  const q = query(recommendationsRef, orderBy('count', 'desc'), limit(5));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().query as string);
} 