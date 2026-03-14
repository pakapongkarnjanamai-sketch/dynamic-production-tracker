const router = require('express').Router();
const ctrl = require('../controllers/linesController');

router.get('/',         ctrl.getLines);
router.get('/:id',      ctrl.getLineById);
router.get('/:id/processes', ctrl.getLineWithProcesses);
router.post('/',        ctrl.createLine);
router.put('/:id',      ctrl.updateLine);
router.delete('/:id',   ctrl.deleteLine);

module.exports = router;
