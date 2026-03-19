const router = require("express").Router();
const { ROLES } = require("../auth/roles");
const ctrl = require("../controllers/processesController");
const { requireAuth, requireRoles } = require("../middleware/auth");

router.get("/", requireAuth, ctrl.getProcesses);
router.get("/:id", requireAuth, ctrl.getProcessById);
router.put(
  "/reorder",
  requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN),
  ctrl.reorderProcesses,
);
router.post(
  "/",
  requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN),
  ctrl.createProcess,
);
router.put(
  "/:id",
  requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN),
  ctrl.updateProcess,
);
router.delete(
  "/:id",
  requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN),
  ctrl.deleteProcess,
);

module.exports = router;
