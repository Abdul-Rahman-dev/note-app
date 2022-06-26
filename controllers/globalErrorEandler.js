const appError = require('../utils/appError');

module.exports = (err, req, res, next) => {
	err.statusCode ??= 500;
	err.status ??= 'error';

	if (process.env.NODE_ENV === 'development') sendErrorDev(err, req, res);
	else if (process.env.NODE_ENV === 'production') {
		if (err.name === 'CastError') err = handleCastErrorDB(err); //handle error for wrong _id errors
		if (err.code === 11000) err = handleDuplicateFieldsDB(err); //handle error for duplicate tours
		if (err.name === 'ValidationError') err = handleValidationErrorDb(err);
		if (err.name === 'JsonWebTokenError') err = handleJTWErrors(err);
		if (err.name === 'TokenExpiredError') err = handleJTWExpiredError(err);
		sendErrorProd(err, req, res);
	}
};

function sendErrorDev(err, req, res) {
	if (req.originalUrl.startsWith('/api')) {
		res.status(err.statusCode).json({
			stauts: err.status,
			message: err.message,
			stack: err.stack,
			error: err,
		});
	} else {
		res.status(400).render('error', { title: 'something went wrong', message: err.message });
	}
}

function sendErrorProd(err, req, res) {
	//operational error is trusted : send message to client
	if (req.originalUrl.startsWith('/api')) {
		if (err.isOperational) {
			res.status(err.statusCode).json({
				stauts: err.status,
				message: err.message,
			});
		}
		//programming or other unknown error : dont leak error details
		else {
			// 1) log error to console
			console.error(err, '---logged in line:34---global.error.handler');
			// 2) send generic message to client
			res.status(500).json({
				stauts: 'error',
				message: 'something went very wrong',
			});
		}
	} else {
		if (err.isOperational) {
			res.status(err.statusCode).render('error', {
				title: 'something went wrong',
				message: err.message,
			});
		} else {
			res.status(500).render('error', { title: 'something went wrong' });
		}
	}
}

function handleCastErrorDB(err) {
	let message = `Invalid ${err.path} : ${err.value}`;
	return new appError(message, 400);
}

function handleDuplicateFieldsDB(err) {
	const message = `duplicate --${Object.keys(err.keyValue)[0]}-- value (${
		Object.values(err.keyValue)[0]
	}) , please try another name~`;

	return new appError(message, 400);
}

function handleValidationErrorDb(err) {
	let customeMessage;

	if (err.errors) {
		customeMessage = [];
		for (item in err.errors) {
			customeMessage.push(err.errors[item].properties.message);
		}
	}

	let message = customeMessage || err.message;
	return new appError(message, 400);
}

function handleJTWErrors(err) {
	let message = `something went wrong : ${err.message}`;
	return new appError(message, 401);
}

function handleJTWExpiredError(err) {
	let message = `Json web token has expired! please login again`;
	return new appError(message, 401);
}
