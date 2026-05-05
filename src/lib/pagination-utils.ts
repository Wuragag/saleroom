export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(
  searchParams: URLSearchParams,
  { defaultLimit = 20, maxLimit = 100 }: PaginationOptions = {}
): Pagination {
  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const rawLimit = parseInt(
    searchParams.get("limit") ?? String(defaultLimit),
    10
  );
  const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.isFinite(rawLimit) ? rawLimit : defaultLimit)
  );
  return { page, limit, skip: (page - 1) * limit };
}
