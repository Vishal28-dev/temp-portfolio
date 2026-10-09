export function buildPage({ page = 1, limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  return { limit: safeLimit, skip: (safePage - 1) * safeLimit, page: safePage };
}

export const pageMeta = ({ total, page, limit }) => ({
  total,
  page,
  limit,
  pages: Math.max(Math.ceil(total / limit), 1),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});
