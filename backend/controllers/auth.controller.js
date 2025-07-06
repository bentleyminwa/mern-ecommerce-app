import jwt from 'jsonwebtoken';
import { redis } from '../lib/redis.js';
import User from '../models/user.model.js';

const generateToken = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m',
    });

    const refreshToken = jwt.sign(
        { userId },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: '7d',
        }
    );

    return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(
        `refresh_token:${userId}`,
        refreshToken,
        'EX',
        60 * 60 * 24 * 7
    ); // Store for 7 days
};

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true, // prevents xss attacks -> client-side scripts cannot access the cookie
        secure: process.env.NODE_ENV === 'production', // use secure cookies in production
        sameSite: 'strict', // prevents CSRF attacks
        maxAge: 1000 * 60 * 15, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, // prevents xss attacks -> client-side scripts cannot access the cookie
        secure: process.env.NODE_ENV === 'production', // use secure cookies in production
        sameSite: 'strict', // prevents CSRF attacks
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
};

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

        // Authenticate the user and generate a JWT token
        const { accessToken, refreshToken } = generateToken(user._id);
        await storeRefreshToken(user._id, refreshToken);

        setCookies(res, accessToken, refreshToken);

        res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
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
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            const { accessToken, refreshToken } = generateToken(user._id);
            await storeRefreshToken(user._id, refreshToken);

            setCookies(res, accessToken, refreshToken);
            res.status(200).json({
                status: 'success',
                message: 'User logged in successfully',
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } else {
            res.status(401).json({
                status: 'failed',
                message: 'Invalid email or password',
            });
        }
    } catch (error) {
        console.log('Error occuring in the login controller:', error);
        res.status(500).json({
            status: 'failed',
            message: 'Error logging in user',
            error: error.message,
        });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            const decoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET
            );
            await redis.del(`refresh_token:${decoded.userId}`);
        }

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.json({
            status: 'success',
            message: 'user logged out successfully',
        });
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: 'Error logging out user',
            error: error.message,
        });
    }
};

export const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                status: 'failed',
                message: 'Refresh token is required',
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        // Check if the refresh token exists in Redis
        const storedRefreshToken = await redis.get(
            `refresh_token:${decoded.userId}`
        );

        if (storedRefreshToken === refreshToken) {
            // Generate new access token
            const accessToken = jwt.sign(
                { userId: decoded.userId },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            );

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 15, // 15 minutes
            });

            res.status(200).json({
                status: 'success',
                message: 'Access token refreshed successfully',
            });
        } else {
            res.status(401).json({
                status: 'failed',
                message: 'Invalid refresh token',
            });
        }
    } catch (error) {
        console.log('Error in refreshAccessToken controller:', error);
        res.status(500).json({
            status: 'failed',
            message: 'Error refreshing access token',
            error: error.message,
        });
    }
};

//Todo: Implement getProfile controller
// export const getProfile = async (req, res) => {}
