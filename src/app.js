const express =  require('express');
const morgan =  require('morgan');
const cors =  require('cors');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const dbConnection = require('./database/config');

const app = express();

// Middleware
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload()); // enable files upload

// Connection to mongoDB
dbConnection();

// Archivos públicos
app.use('/public', express.static(__dirname + '/public'));

// Rutas
app.get('/', (req, res) => {
  res.send('Ruta raiz');
});
app.use('/api', require('./routes/products'));
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/users'));


app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function () {
  console.log(`App running at port: http://localhost:${app.get('port')}`);
});