const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../utils/jwtConfig');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());
      
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User no longer exists.' });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('JWT Authentication Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
