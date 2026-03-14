const router = require('express').Router();

const ctrl = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', ctrl.login);
router.get('/me', requireAuth, ctrl.getCurrentUser);

module.exports = router;
