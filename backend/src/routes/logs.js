const router = require('express').Router();
const ctrl = require('../controllers/logsController');

router.get('/summary', ctrl.getLogsSummary);  // must be before /:id-style routes
router.get('/',        ctrl.getLogs);
router.post('/',       ctrl.createLog);
router.put('/:id',     ctrl.updateLog);
router.delete('/:id',  ctrl.deleteLog);

module.exports = router;
