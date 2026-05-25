require('dotenv').config();

const express = require('express');
const session = require('express-session');
const { engine } = require('express-handlebars');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: false,
  partialsDir: path.join(__dirname, 'views/partials'),
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/video', express.static(path.join(__dirname, 'video')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'pcs-admin-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 4 * 60 * 60 * 1000 }, // 4 hours
}));

app.use('/', require('./routes/applicationRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

app.listen(PORT, () => {
  console.log(`Peterson Care Solutions running on port ${PORT}`);
});