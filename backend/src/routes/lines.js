const router = require('express').Router();
const { ROLES } = require('../auth/roles');
const ctrl = require('../controllers/linesController');
const { requireAuth, requireRoles } = require('../middleware/auth');

router.get('/',              requireAuth, ctrl.getLines);
router.get('/:id',           requireAuth, ctrl.getLineById);
router.get('/:id/processes', requireAuth, ctrl.getLineWithProcesses);
router.post('/',             requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.createLine);
router.put('/:id',           requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.updateLine);
router.delete('/:id',        requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.deleteLine);

module.exports = router;
