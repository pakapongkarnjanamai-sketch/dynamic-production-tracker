const test = require("node:test");
const assert = require("node:assert/strict");

const { ROLES, canAssignRole, canManageRole } = require("../../src/auth/roles");

test("superadmin can manage all roles", () => {
  assert.equal(canManageRole(ROLES.SUPERADMIN, ROLES.ADMIN), true);
  assert.equal(canManageRole(ROLES.SUPERADMIN, ROLES.VIEWER), true);
});

test("admin can manage viewer only", () => {
  assert.equal(canManageRole(ROLES.ADMIN, ROLES.VIEWER), true);
  assert.equal(canManageRole(ROLES.ADMIN, ROLES.ADMIN), false);
  assert.equal(canManageRole(ROLES.ADMIN, ROLES.SUPERADMIN), false);
});

test("canAssignRole follows role manage policy", () => {
  assert.equal(canAssignRole(ROLES.ADMIN, ROLES.VIEWER), true);
  assert.equal(canAssignRole(ROLES.ADMIN, ROLES.ADMIN), false);
});
