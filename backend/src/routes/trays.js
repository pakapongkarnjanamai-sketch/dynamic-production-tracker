const router = require('express').Router();
const ctrl = require('../controllers/traysController');

router.get('/scan/:qrCode', ctrl.scanTray);   // must be before /:id
router.get('/stats',        ctrl.getTrayStats); // must be before /:id
router.get('/',             ctrl.getTrays);
router.get('/:id',          ctrl.getTrayById);
router.post('/',            ctrl.createTray);
router.put('/:id',          ctrl.updateTray);
router.delete('/:id',       ctrl.deleteTray);

module.exports = router;
