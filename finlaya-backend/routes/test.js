const express = require('express');
const router  = express.Router();
const { runReportJob } = require('../jobs/reportScheduler');

// ── Manual trigger for testing — remove in production ─────────────────────────

// POST /api/test/report/weekly
router.post('/report/weekly', async (req, res) => {
  try {
    console.log('[test] Manually triggering weekly report...');
    await runReportJob('weekly');
    res.json({ success: true, message: 'Weekly report job completed. Check your email and notification bell.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/test/report/monthly
router.post('/report/monthly', async (req, res) => {
  try {
    console.log('[test] Manually triggering monthly report...');
    await runReportJob('monthly');
    res.json({ success: true, message: 'Monthly report job completed. Check your email and notification bell.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;