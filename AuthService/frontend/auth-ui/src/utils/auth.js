export const hasAdminAccess = (user) => {
  if (!user) {
    return false;
  }

  const roleCandidates = [];

  if (typeof user.role === "string") {
    roleCandidates.push(user.role);
  }

  if (Array.isArray(user.roles)) {
    roleCandidates.push(...user.roles);
  }

  if (Array.isArray(user.permissions)) {
    roleCandidates.push(...user.permissions);
  }

  const normalized = roleCandidates
    .filter((value) => typeof value === "string")
    .map((value) => value.toLowerCase());

  if (normalized.some((value) => value.includes("admin"))) {
    return true;
  }

  return Boolean(
    user.isAdmin ||
      user.is_admin ||
      user.isSuperAdmin ||
      user.is_super_admin ||
      user.isSystemAdmin
  );
};
