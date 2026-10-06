// Blocks a route unless the user is logged in (has a session).
function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }
  next();
}

module.exports = { requireLogin };
