const ROLES = Object.freeze({
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  VIEWER: "viewer",
});

const MANAGEABLE_BY_ADMIN = new Set([ROLES.VIEWER]);

const isValidRole = (role) => Object.values(ROLES).includes(role);

const canManageRole = (actorRole, targetRole) => {
  if (actorRole === ROLES.SUPERADMIN) return true;
  if (actorRole === ROLES.ADMIN) return MANAGEABLE_BY_ADMIN.has(targetRole);
  return false;
};

const canAssignRole = (actorRole, nextRole) =>
  canManageRole(actorRole, nextRole);

module.exports = {
  ROLES,
  canAssignRole,
  canManageRole,
  isValidRole,
};
