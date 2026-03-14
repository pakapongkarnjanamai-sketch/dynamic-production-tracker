const router = require('express').Router();
const ctrl = require('../controllers/operatorsController');

router.get('/',    ctrl.getOperators);
router.get('/:id', ctrl.getOperatorById);
router.post('/',   ctrl.createOperator);
router.put('/:id', ctrl.updateOperator);
router.delete('/:id', ctrl.deleteOperator);

module.exports = router;
