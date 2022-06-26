const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const app = require('./app.js');
const mongoose = require('mongoose');
const path = require('path');

mongoose
	.connect(
		process.env.NODE_ENV === 'production'
			? process.env.DATABASE_CONNECTION_STRING_PROD
			: process.env.DATABASE_CONNECTION_STRING_DEV
	)
	.catch((err) => console.log(err));

//create a folder for users photos
fs.mkdirSync('./public/static/images/users/', { recursive: true });

let server = app.listen(process.env.PORT, (err) =>
	console.log(err || `server is running on | http://${process.env.HOST_NAME}:${process.env.PORT}`)
);
