const router = require('express').Router();
const ctrl = require('../controllers/processesController');

router.get('/',       ctrl.getProcesses);
router.get('/:id',    ctrl.getProcessById);
router.post('/',      ctrl.createProcess);
router.put('/:id',    ctrl.updateProcess);
router.delete('/:id', ctrl.deleteProcess);

module.exports = router;
