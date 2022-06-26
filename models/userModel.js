const bcrypt = require('bcryptjs');
const { default: mongoose, Mongoose } = require('mongoose');
const validator = require('validator').default;

const notesSchema = new mongoose.Schema({
	title: {
		type: String,
		trim: true,
		required: [true, 'please specify a title for your note'],
	},
	body: {
		type: String,
		trim: true,
		required: [true, 'please specify your note'],
	},
	isRemoved: Boolean,
	removeDate: {
		type: Date,
	},
	updatedAt: Date,
	createdAt: Date,
});

notesSchema.pre('save', function (next) {
	if (!this.isNew) this.updatedAt = new Date();
	next();
});

const schema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		maxlength: [50, 'your name cant be longer than 50 characters'],
		required: [true, 'please provide your name'],
	},
	email: {
		type: String,
		validate: {
			validator: validator.isEmail,
			message: 'invalid email address!',
		},
		trim: true,
		maxlength: [50, 'your email cant be longer than 50 characters'],
		required: [true, 'please provide your email address'],
	},
	password: {
		type: String,
		trim: true,
		maxlength: [50, 'your password cant be longer than 20 characters'],
		minlength: [8, 'your password must have at least 8 characters'],
		required: [true, 'please provide a password'],
		select: false,
	},
	passwordConfirm: {
		type: String,
		validate: {
			validator: function (val) {
				return val === this.password;
			},
			message: 'password confirm is not the same as password!',
		},
		trim: true,
		required: [true, 'please provide password confirm'],
	},
	photo: { type: String, trim: true },
	notes: [notesSchema],
});

schema.pre('save', async function (next) {
	if (this.isNew) {
		this.password = await bcrypt.hash(this.password, 12);
		this.passwordConfirm = undefined;
	}

	next();
});

const model = mongoose.model('users', schema, 'users');

module.exports = model;
