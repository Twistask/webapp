var express = require('express');
var router = express.Router();

/* GET time-trial main page. */
router.get('/', function(req, res, next) {
    res.render('time-trial', { title: 'Twistask' });
});
router.get('/test', function(req, res, next) {
    res.render('challenge', { title: 'Twistask', timed: true });
});

module.exports = router;
