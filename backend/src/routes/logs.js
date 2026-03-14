const router = require('express').Router();
const ctrl = require('../controllers/logsController');

router.get('/summary', ctrl.getLogsSummary);  // must be before /:id-style routes
router.get('/',        ctrl.getLogs);
router.post('/',       ctrl.createLog);

module.exports = router;
