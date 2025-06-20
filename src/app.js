import express from 'express';
import bodyParser from 'body-parser';
import routes from './routes/index.js';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

pool.connect()
  .then(client => {
    console.log('Conexión a la base de datos exitosa');
    client.release();
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos', err);
  });

app.use('/api', routes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});