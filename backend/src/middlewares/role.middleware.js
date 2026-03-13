const ROLES = require("../constants/role");

exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {

        // Kiểm tra req.user tồn tại
        if (!req.user) {
            return res.status(401).json({ 
                message: "Unauthorized - User not found in request" 
            });
        }

        // Kiểm tra req.user.role tồn tại
        if (!req.user.role) {
            return res.status(401).json({ 
                message: "Unauthorized - User role not found" 
            });
        }

        // Kiểm tra role có trong allowedRoles không
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Forbidden - Role ${req.user.role} not allowed. Allowed: ${allowedRoles.join(', ')}` 
            });
        }

        next();
    };
};