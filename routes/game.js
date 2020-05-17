const express = require('express');
const router = express.Router();

router.get('/:gameId', function(req, res, next) {
    res.render('game', { code: req.params.gameId });
});

module.exports = router;