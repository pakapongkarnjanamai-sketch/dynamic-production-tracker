const router = require("express").Router();
const { ROLES } = require("../auth/roles");
const ctrl = require("../controllers/logsController");
const { requireRoles } = require("../middleware/auth");

router.get(
  "/summary",
  requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.VIEWER),
  ctrl.getLogsSummary,
); // must be before /:id-style routes
router.get(
  "/",
  requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.VIEWER),
  ctrl.getLogs,
);
router.post("/", requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.createLog);
router.put("/:id", requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.updateLog);
router.delete(
  "/:id",
  requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN),
  ctrl.deleteLog,
);

module.exports = router;
