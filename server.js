require('dotenv').config();

const express = require('express');
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

app.use('/', require('./routes/applicationRoutes'));

app.listen(PORT, () => {
  console.log(`Peterson Care Solutions running on port ${PORT}`);
});