import { navItems } from "./data";

export const DEFAULT_ROLE = "employee";
export const DEFAULT_PAGE = "dashboard";

export const ROLE_SLUGS = {
  employee: "employee",
  teamlead: "team-lead",
  admin: "admin",
  superadmin: "super-admin",
};

const ROLE_ALIAS_TO_KEY = Object.entries(ROLE_SLUGS).reduce(
  (aliases, [roleKey, roleSlug]) => ({
    ...aliases,
    [roleKey]: roleKey,
    [roleSlug]: roleKey,
  }),
  {},
);

const PAGE_IDS = Array.from(new Set(Object.values(navItems).flatMap((items) => items.map((item) => item.id))));

export function getAllowedPages(role) {
  return navItems[role]?.map((item) => item.id) ?? [];
}

export function getDefaultPageForRole(role) {
  const allowedPages = getAllowedPages(role);

  if (allowedPages.includes(DEFAULT_PAGE)) {
    return DEFAULT_PAGE;
  }

  return allowedPages[0] ?? DEFAULT_PAGE;
}

export function normalizeRoleSegment(value) {
  return ROLE_ALIAS_TO_KEY[value] ?? null;
}

export function normalizePageSegment(value) {
  return PAGE_IDS.includes(value) ? value : null;
}

export function buildTaskTrackPath(role, page, order = "role-first") {
  const roleSlug = ROLE_SLUGS[role] ?? role;

  return order === "page-first" ? `/${page}/${roleSlug}` : `/${roleSlug}/${page}`;
}

export function resolveTaskTrackRoute(primary, secondary) {
  const primaryRole = normalizeRoleSegment(primary);
  const secondaryRole = normalizeRoleSegment(secondary);
  const primaryPage = normalizePageSegment(primary);
  const secondaryPage = normalizePageSegment(secondary);

  if (primaryRole && secondaryPage) {
    const nextPage = getAllowedPages(primaryRole).includes(secondaryPage)
      ? secondaryPage
      : getDefaultPageForRole(primaryRole);

    return {
      role: primaryRole,
      page: nextPage,
      order: "role-first",
      needsRedirect: nextPage !== secondaryPage,
    };
  }

  if (secondaryRole && primaryPage) {
    const nextPage = getAllowedPages(secondaryRole).includes(primaryPage)
      ? primaryPage
      : getDefaultPageForRole(secondaryRole);

    return {
      role: secondaryRole,
      page: nextPage,
      order: "page-first",
      needsRedirect: nextPage !== primaryPage,
    };
  }

  return null;
}
