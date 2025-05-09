const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(500).json({
        success: false,
        message: 'Role not defined in token or user not authenticated'
      });
    }

    // Flatten the roles array in case it's nested
    const allowedRoles = roles.flat();
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

export default roleCheck;
