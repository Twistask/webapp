var express = require('express');
var router = express.Router();

/* GET challenge page. */
router.get('/', function(req, res, next) {
    res.render('challenge', { title: 'Twistask', timed: false });
});

module.exports = router;
