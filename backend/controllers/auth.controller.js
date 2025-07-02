import User from '../models/user.model.js';

export const signup = async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists!' });
    }

    try {
        const user = await User.create({
            name,
            email,
            password,
        });
        res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            user: user,
        });
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: 'Error creating user',
            error: error.message,
        });
    }
};

export const login = async (req, res) => {
    res.send('user login route');
};

export const logout = async (req, res) => {
    res.send('user logout route');
};
