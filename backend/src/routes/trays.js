const router = require('express').Router();
const { ROLES } = require('../auth/roles');
const ctrl = require('../controllers/traysController');
const { requireAuth, requireRoles } = require('../middleware/auth');

router.get('/scan/:qrCode', requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.OPERATOR), ctrl.scanTray);   // must be before /:id
router.get('/stats',        requireAuth, ctrl.getTrayStats); // must be before /:id
router.get('/',             requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.getTrays);
router.get('/:id',          requireAuth, ctrl.getTrayById);
router.post('/',            requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.createTray);
router.put('/:id',          requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.updateTray);
router.delete('/:id',       requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.deleteTray);

module.exports = router;
