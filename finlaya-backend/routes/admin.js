const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// DELETE /api/admin/users/:userId
// Deletes user from both public.users and auth.users
router.delete('/users/:userId', async (req, res) => {
  const { userId } = req.params;

  // Create client here so env vars are guaranteed to be loaded
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Step 1: Delete from public.users (cascades to expenses, income, goals etc.)
    const { error: publicError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (publicError) {
      console.error('Error deleting from public.users:', publicError);
      return res.status(500).json({ error: 'Failed to delete user data' });
    }

    // Step 2: Delete from auth.users using service role
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting from auth.users:', authError);
      return res.status(500).json({ error: 'Failed to delete auth account' });
    }

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;