const supabase = require('../config/supabase');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin1234';

exports.showLogin = (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.render('admin-login', { error: null });
};

exports.handleLogin = (req, res) => {
  const { passcode } = req.body;
  if (passcode === ADMIN_PASSCODE) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  res.render('admin-login', { error: 'Incorrect passcode. Try again.' });
};

exports.handleLogout = (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
};

exports.showDashboard = async (req, res) => {
  try {
    const [{ data: applications }, { data: contacts }] = await Promise.all([
      supabase
        .from('caregiver_applications')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    res.render('admin-dashboard', {
      applications: applications || [],
      contacts: contacts || [],
      appCount: (applications || []).length,
      contactCount: (contacts || []).length,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).send('Server error');
  }
};
