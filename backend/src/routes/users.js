const router = require('express').Router();

const ctrl = require('../controllers/usersController');
const { ROLES } = require('../auth/roles');
const { requireRoles } = require('../middleware/auth');

router.get('/', requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.listUsers);
router.post('/', requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.createUser);
router.put('/:id', requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.updateUser);
router.delete('/:id', requireRoles(ROLES.SUPERADMIN, ROLES.ADMIN), ctrl.deleteUser);

module.exports = router;
