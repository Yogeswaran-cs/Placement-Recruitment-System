const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { fail } = require('../utils/response');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return fail(res, 401, 'Not authorized, user not found');
      }
      
      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return fail(res, 401, 'Not authorized, token failed');
    }
  }

  if (!token) {
    return fail(res, 401, 'Not authorized, no token provided');
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, 403, `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this route`);
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
