const express = require('express');
const app = express();
const usersRouter = require('./routes/usersRouter');
const notesRouter = require('./routes/notesRouter');
const viewsRouter = require('./routes/viewsRouter');
const globalErrorHandler = require('./controllers/globalErrorEandler');
const path = require('path');
const http = require('http');

//3rd party modules
const expressRateLimit = require('express-rate-limit');
const cors = require('cors');
const sanatizer = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const xssClean = require('xss-clean');
const helmet = require('helmet');
const hpp = require('hpp');
const compression = require('compression');

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(expressRateLimit({ max: 200, windoMs: 10 * 60 * 1000 }));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(sanatizer());
app.use(xssClean());
app.use(hpp());
app.use(compression());

app.set('veiw-engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, '/public'), { index: false }));

app.use('/api/users', usersRouter);
app.use('/api/notes', notesRouter);
app.all('/api', (req, res) => res.status(400).send('invalid api route'));

app.use('/', viewsRouter);

app.all('*', (req, res) => res.send('invalid route'));
app.use(globalErrorHandler);

module.exports = app;
