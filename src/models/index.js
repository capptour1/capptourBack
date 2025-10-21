import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,         
      rejectUnauthorized: false,
    },
  },
});

export default sequelize;
