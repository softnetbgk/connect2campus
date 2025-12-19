const jwt = require('jsonwebtoken');

const { pool } = require('../config/db');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        try {
            // Verify if this is the active session token
            const dbRes = await pool.query('SELECT current_session_token FROM users WHERE id = $1', [user.id]);
            if (dbRes.rows.length === 0 || dbRes.rows[0].current_session_token !== token) {
                return res.status(401).json({ message: 'Session expired or invalidated. You may have logged in on another device.' });
            }
        } catch (dbErr) {
            console.error('Session verification failed:', dbErr);
            return res.status(500).json({ message: 'Session verification failed' });
        }

        // Robustness: If schoolId is missing (legacy token) and not Super Admin, fetch it
        // Note: We already fetched DB above, but user might not have school_id.
        // We can optimize by fetching * from users above?
        // Let's keep it simple and just do the check.

        if (!user.schoolId && user.role !== 'SUPER_ADMIN') {
            try {
                const res = await pool.query('SELECT school_id FROM users WHERE id = $1', [user.id]);
                if (res.rows.length > 0) {
                    user.schoolId = res.rows[0].school_id;
                }
            } catch (dbErr) {
                console.error('Auth Middleware DB Error:', dbErr);
            }
        }

        req.user = user;
        next();
    });
};

const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Access denied: Super Admin only' });
    }
    next();
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { authenticateToken, requireSuperAdmin, authorize };
