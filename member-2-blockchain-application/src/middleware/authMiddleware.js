import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header is missing' });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Invalid authorization format. Format must be: Bearer <token>' });
    }

    const token = tokenParts[1];
    const secret = process.env.JWT_SECRET || 'supersecretjwtkey123';

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ error: 'Token has expired', details: err.message });
            }
            return res.status(403).json({ error: 'Invalid or malformed token', details: err.message });
        }
        req.user = user;
        next();
    });
}
