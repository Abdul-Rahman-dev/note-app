const model = require('../models/userModel');
const appError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.addNote = catchAsync(async (req, res, next) => {
	const user = req.user;

	const createdAt = new Date();
	const updatedAt = createdAt;

	const newNoteIndex = user.notes.push({ ...req.body, updatedAt, createdAt }) - 1;

	user.$ignore('password');
	user.$ignore('passwordConfirm');

	await user.save({ validateBeforeSave: false });
	res.status(200).json(user.notes[newNoteIndex]);
});

exports.getNotes = catchAsync(async (req, res, next) => {
	res.status(200).json({ status: 'success', notes: req.user.notes });
});

exports.updateNote = catchAsync(async (req, res, next) => {
	const note = req.note;
	note.title = req.body.title;
	note.body = req.body.body;

	await req.user.save({ validateBeforeSave: false });
	res.status(200).json({ status: 'success' });
});

exports.removeNote = catchAsync(async (req, res, next) => {
	const note = req.note;

	if (note.isRemoved) {
		note.remove();
		await req.user.save({ validateBeforeSave: false });
	} else {
		note.isRemoved = true;
		note.removeDate = Date.now();
		await req.user.save({ validateBeforeSave: false });
	}

	res.status(200).json({ status: 'success' });
});

exports.restoreNote = catchAsync(async (req, res, next) => {
	const note = req.note;

	note.isRemoved = undefined;
	note.removeDate = undefined;

	await req.user.save({ validateBeforeSave: false });
	res.status(200).json({ status: 'success' });
});

//middlwares
exports.getNote = (req, res, next, id) => {
	const note = req.user.notes.id(id);
	if (!note) return next(new appError('note not found', 404));
	req.note = note;
	next();
};
