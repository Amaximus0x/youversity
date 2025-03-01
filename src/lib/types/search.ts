// Define search filter options
export type SearchFilter = 'relevance' | 'latest' | 'earliest';

// Define search result types
export interface SearchResult {
  id: string;
  type: 'course' | 'user' | 'module';
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
    photoURL?: string;
  };
  relevanceScore?: number;
}

// Define search query parameters
export interface SearchParams {
  query: string;
  filter?: SearchFilter;
  limit?: number;
  page?: number;
  userId?: string;
}

// Define search history item
export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  userId: string;
}

// Define search recommendation
export interface SearchRecommendation {
  id: string;
  text: string;
  category?: string;
  weight: number;
} 