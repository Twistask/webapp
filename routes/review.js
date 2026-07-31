var express = require('express');
var router = express.Router();

const pb = require("../db")

async function loadTasks() {
    return await pb.collection('tasks').getFullList()
}

async function loadAnswers() {
    return await pb.collection('answers').getFullList()
}

async function sendComment(body) {
    const record = await pb.collection('comments').create(body);
}

/* GET review page. */
router.get('/', async (req, res, next) => {
    try {
        const tasks = await loadTasks();
        const answers = await loadAnswers();
        res.render('review', { title: 'Twistask', timed: false, tasks, answers });
    } catch (err) {
        next(err); // lets Express error middleware handle/log and return a 500
    }
});

router.post('/submit', async (req, res, next) => {
    try {
        let body = req.body;
        const result = await sendComment(body);
        console.log(result);
    } catch (err) {
        next(err); // lets Express error middleware handle/log and return a 500
    }
})

module.exports = router;
