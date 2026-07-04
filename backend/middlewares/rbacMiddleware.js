// This function takes an array of allowed roles
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user was set by the verifyToken middleware in Step 17
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied. User role not found.' });
    }

    // Check if the user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user.role}) is not allowed to access this resource.` 
      });
    }

    next(); // User is authorized, move to the controller
  };
};