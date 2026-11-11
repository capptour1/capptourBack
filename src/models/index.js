
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Sequelize, DataTypes } from 'sequelize';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    }
);

const Models = {};

async function initializeModels() {
    // 1. Obtener archivos de modelos
    const files = fs.readdirSync(__dirname)
        .filter(file =>
            file !== 'index.js' &&
            file.endsWith('.js')
        )
        .sort();

    // 2. Registrar todos los modelos
    for (const file of files) {
        const modulePath = pathToFileURL(
            path.join(__dirname, file)
        ).href;

        const { default: defineModel } = await import(modulePath);

        const model = defineModel(sequelize, DataTypes);

        Models[model.name] = model;
    }

    // 3. Configurar asociaciones
    for (const model of Object.values(Models)) {
        if (typeof model.associate === 'function') {
            model.associate(Models);
        }
    }

    return Models;
}

await initializeModels();

export { Sequelize, sequelize, Models };
export default sequelize;
