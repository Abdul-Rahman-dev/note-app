const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.all('*', authController.isLoggedIn, (req, res, next) => {
	res.render('index.pug', { isloggedin: req.isLoggedIn });
});

module.exports = router;
