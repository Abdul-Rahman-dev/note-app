const catchAsync = require('../utils/catchAsync');
const model = require('../models/userModel');
const appError = require('../utils/appError');
const jsonwebtoken = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');

exports.signUp = catchAsync(async (req, res, next) => {
	if (!req.body.email) return next(new appError('please fill the form inputs'));
	const existingUser = await model.findOne({ email: req.body.email });

	if (existingUser) return next(new appError('user already exists!', 400));
	const user = await model.create(req.body);

	sendToken(res, user, 201);
});

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;
	if (!email || !password)
		return next(new appError('please provide your email and password', 400));

	const user = await model.findOne({ email }).select('+password');
	if (!user) return next(new appError('incorrect email or password!', 400));

	const isPasswordCorrect = await bcrypt.compare(password, user.password);
	if (!isPasswordCorrect) return next(new appError('incorrect email or password!', 400));

	sendToken(res, user);
});

exports.logout = catchAsync(async (req, res, next) => {
	res.status(200).clearCookie('jwt').end();
});

exports.getMe = (req, res, next) => {
	res.status(200).json(filterUserData(req.user));
};

exports.updateMe = catchAsync(async (req, res, next) => {
	if (!req.body.email || !req.body.name) return next(new appError('please fill the form inputs'));
	const existingUser = await model.findOne({ email: req.body.email });

	if (existingUser && existingUser.email !== req.user.email)
		return next(new appError('this email is already in use', 400));

	req.user.name = req.body.name;
	req.user.email = req.body.email;
	if (req.body.photo) req.user.photo = req.body.photo;

	await req.user.validate(['name', 'email', 'photo']);
	await req.user.save({ validateBeforeSave: false });

	res.status(200).json({ name: req.user.name, email: req.user.email, photo: req.user.photo });
});

//!middlwares

exports.protect = catchAsync(async (req, res, next) => {
	const cookie = req.cookies.jwt;
	if (!cookie) return next(new appError('you are not logged in', 404));

	//catch signature error if token is not valid
	try {
		const userId = jsonwebtoken.verify(cookie, process.env.JWT_SECRET_KEY).payload;
		const user = await model.findById(userId);

		if (!user) return next(new appError('you are not logged in', 404));

		req.user = user;
	} catch (err) {
		return next(new appError('you are not logged in', 404));
	}

	next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
	const cookie = req.cookies.jwt;
	if (!cookie) {
		req.isLoggedIn = false;
		return next();
	}

	//catch signature error if token is not valid
	try {
		const userId = jsonwebtoken.verify(cookie, process.env.JWT_SECRET_KEY).payload;
		const user = await model.findById(userId);
		req.isLoggedIn = !!user;
	} catch (err) {
		req.isLoggedIn = false;
	}

	next();
});

exports.saveImage = catchAsync(async (req, res, next) => {
	if (!req.file) return next();

	req.body.photo = `static/images/users/user-${
		(+new Date()).toString(36).slice() + Math.random().toString(36).slice(2)
	}.png`;

	await sharp(req.file.buffer)
		.resize(300, 300)
		.jpeg({ quality: 70 })
		.toFormat('png')
		.toFile(`public/${req.body.photo}`);

	next();
});

//!helpers
function sendToken(res, user, status = 200) {
	const token = jsonwebtoken.sign({ payload: user.id }, process.env.JWT_SECRET_KEY, {
		expiresIn: '60d',
	});

	const cookieOptions = {
		maxAge: 1000 * 60 * 60 * 24 * 60,
		httpOnly: true,
		secure: true,
	};

	const filteredUserData = filterUserData(user);
	res.cookie('jwt', token, cookieOptions);
	res.status(status).json(filteredUserData);
}

function filterUserData(user) {
	return (({ name, email, notes, photo }) => ({
		name,
		email,
		photo,
		notes,
	}))(user);
}
