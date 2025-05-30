// Authentication middleware
export function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Admin level check middleware
export function ensureAdminLevel(requiredLevel) {
    return (req, res, next) => {
        if (req.isAuthenticated() && req.user.level >= requiredLevel) {
            return next();
        }
        res.status(403).send('Access denied. You do not have sufficient permissions.');
    };
}
