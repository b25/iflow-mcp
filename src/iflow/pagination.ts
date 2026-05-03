import { config } from "./config.js";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>
): Promise<T[]> {
  const allResults: T[] = [];
  let currentPage = 1;
  let hasNext = true;

  while (hasNext && currentPage <= config.IFLOW_MAX_PAGES_PER_CALL) {
    const response = await fetchPage(currentPage);
    allResults.push(...response.results);
    hasNext = !!response.next;
    currentPage++;
  }

  return allResults;
}
