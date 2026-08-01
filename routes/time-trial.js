var express = require('express');
var router = express.Router();

const pb = require("../db")

async function loadTasks() {
    return await pb.collection('tasks').getFullList()
}

async function sendAnswer(body) {
    const record = await pb.collection('answers').create(body);
}

/* GET time-trial main page. */
router.get('/', function(req, res, next) {
    res.render('time-trial', { title: 'Twistask' });
});
router.get('/test', async function (req, res, next) {
    const tasks = await loadTasks();
    console.log(tasks);
    res.render('challenge', {title: 'Twistask', timed: true, tasks});
});

module.exports = router;
