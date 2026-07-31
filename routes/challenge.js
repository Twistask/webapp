var express = require('express');
var router = express.Router();

const pb = require("../db")

async function loadTasks() {
    return await pb.collection('tasks').getFullList()
}

/* GET challenge page. */
router.get('/', async (req, res, next) => {
    try {
        const tasks = await loadTasks();
        console.log(tasks);
        res.render('challenge', { title: 'Twistask', timed: false, tasks });
    } catch (err) {
        next(err); // lets Express error middleware handle/log and return a 500
    }
});

module.exports = router;
