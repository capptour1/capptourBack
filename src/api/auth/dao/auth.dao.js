import Models from '../../../models/index.js';


const register_client = async (name, email, password) => {
    try {
        console.log('Register client controller called');

        // use raw query to insert client into auth database

        const result = await Models.sequelize.query(
            'INSERT INTO clients (name, email, password) VALUES (:name, :email, :password) RETURNING id',
            {
                replacements: { name, email, password },
                type: Models.sequelize.QueryTypes.INSERT,
            }
        );
        
        return result;
    } catch (error) {
        console.error('Error registering client:', error);
        throw new Error('Error registering client');
    }
}

export {
  register_client,
};
