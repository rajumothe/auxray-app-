const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  let token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'No token provided. Access denied.' });
  }

  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Will now cleanly pass: { id, empId, role, managerId }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied. User role not found.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user.role}) is not allowed to access this resource.` 
      });
    }
    next();
  };
};