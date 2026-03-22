const express = require('express');
const router  = express.Router();
const { verifyToken }             = require('../middleware/auth');
const { checkAndSendBudgetAlerts } = require('../services/budgetAlertService');

// POST /api/budget-alerts/check
// Called by the frontend right after an expense is added.
// Checks if any category has crossed 80/90/100% and sends an email if so.
router.post('/check', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Run the check asynchronously — don't make the user wait for email sending
    checkAndSendBudgetAlerts(userId).catch((err) => {
      console.error('[budgetAlert route] background error:', err.message);
    });

    return res.status(200).json({ message: 'Budget alert check started' });
  } catch (err) {
    console.error('[budgetAlert route] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;