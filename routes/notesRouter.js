const express = require('express');
const authController = require('../controllers/authController');
const controller = require('../controllers/notesController');

const router = express.Router();

router.use(authController.protect);
router.param('id', controller.getNote);

router.get('/', controller.getNotes);
router.post('/', controller.addNote);

router.delete('/:id', controller.removeNote);
router.put('/:id', controller.updateNote);
router.patch('/:id', controller.restoreNote);

module.exports = router;
