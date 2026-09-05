import jwt from 'jsonwebtoken';

export const login = (req, res) => {
    try {
        const { username, password, institutionId } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const validUsername = process.env.ISSUER_USERNAME || 'admin';
        const validPassword = process.env.ISSUER_PASSWORD || 'admin123';

        if (username !== validUsername || password !== validPassword) {
            return res.status(401).json({ error: 'Invalid login credentials' });
        }

        const secret = process.env.JWT_SECRET || 'supersecretjwtkey123';
        const payload = {
            username,
            institutionId: institutionId || 'UNIV01',
            role: 'issuer'
        };

        const token = jwt.sign(payload, secret, { expiresIn: '24h' });

        res.json({
            message: 'Authentication successful',
            token,
            expiresIn: '24h',
            user: payload
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal authentication error', details: error.message });
    }
};
