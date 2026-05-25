const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');

const requireAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/admin/login');
};

router.get('/login', ctrl.showLogin);
router.post('/login', ctrl.handleLogin);
router.get('/logout', ctrl.handleLogout);
router.get('/', requireAdmin, ctrl.showDashboard);

module.exports = router;
