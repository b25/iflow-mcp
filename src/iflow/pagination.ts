import { config } from "./config.js";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
  maxPages: number = config.IFLOW_MAX_PAGES_PER_CALL
): Promise<T[]> {
  const allResults: T[] = [];
  let currentPage = 1;
  let hasNext = true;

  while (hasNext && currentPage <= maxPages) {
    const response = await fetchPage(currentPage);
    allResults.push(...response.results);
    hasNext = !!response.next;
    currentPage++;
  }

  return allResults;
}
