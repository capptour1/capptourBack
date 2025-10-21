
import AuthDAO from '../dao/auth.dao.js';

const register_client = (req, res) => async () => {
    try {
        console.log('Register client controller called');
        const { name, email, password } = req.body;

        const result = await AuthDAO.register_client(name, email, password);
        res.status(200).json(result);

    } catch (error) {
        console.error('Error in register client controller:', error);
        res.status(500).json({ message: 'Error in register client controller' });
    }
}

export default {
  register_client,
};

