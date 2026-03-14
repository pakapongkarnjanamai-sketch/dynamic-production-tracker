const router = require('express').Router();
const { ROLES } = require('../auth/roles');
const ctrl = require('../controllers/operatorsController');
const { requireAuth, requireRoles } = require('../middleware/auth');

router.get('/',      requireAuth, ctrl.getOperators);
router.get('/:id',   requireAuth, ctrl.getOperatorById);
router.post('/',     requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.createOperator);
router.put('/:id',   requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.updateOperator);
router.delete('/:id', requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.deleteOperator);

module.exports = router;
