const express = require('express');
const Feedback = require('../models/feedbackModel');

const router = express.Router();

router.post('/feedback', function(req, res) {
  const { name, feedback } = req.body;

  const newFeedback = new Feedback({
    name: name || 'Anonymous',
    feedback
  });

  newFeedback.save()
    .then(function() {
      res.status(201).json({ success: true });
    })
    .catch(function(err) {
      console.error('Save error:', err);
      res.status(500).json({ error: 'Server error' });
    });
});

module.exports = router;
