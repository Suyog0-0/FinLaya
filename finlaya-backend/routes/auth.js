const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

// DELETE /auth/delete-account
// Protected - requires valid Supabase JWT
router.delete('/delete-account', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`Attempting to delete account for user: ${userId}`);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Supabase admin delete error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`Successfully deleted account for user: ${userId}`);
    return res.status(200).json({ message: 'Account deleted successfully' });

  } catch (err) {
    console.error('Unexpected error deleting account:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;