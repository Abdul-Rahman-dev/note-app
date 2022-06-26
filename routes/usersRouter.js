const express = require('express');
const multer = require('multer');
const router = express.Router();
const controller = require('../controllers/authController');
const catchPhotoMiddlware = require('../utils/catchPhotoMiddlware');

router.post('/signup', catchPhotoMiddlware, controller.saveImage, controller.signUp);
router.post('/login', controller.login);
router.delete('/logout', controller.protect, controller.logout);

router.patch(
	'/updateMe',
	controller.protect,
	catchPhotoMiddlware,
	controller.saveImage,
	controller.updateMe
);
router.get('/getMe', controller.protect, controller.getMe);

module.exports = router;
