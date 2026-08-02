import express from "express";
let router = express.Router();

import Database from "../db.js";

/* GET challenge page. */
router.get('/', async (req, res, next) => {
    try {
        const tasks = await Database.functions.loadContent("tasks");
        console.log(tasks);
        const answers = [];
        res.render('challenge', { title: 'Twistask', tasks, answers });
    } catch (err) {
        next(err); // lets Express error middleware handle/log and return a 500
    }
});

router.post('/submit', async (req, res, next) => {
    try {
        let body = req.body;
        const result = await Database.functions.sendContent("answer", body);
        console.log(result);
    } catch (err) {
        next(err); // lets Express error middleware handle/log and return a 500
    }
})

router.get('/result', async (req, res, next) => {
    try {
        res.render('result', { title: 'Twistask' });
    } catch (err) {
        next(err); // lets Express error middleware handle/log and return a 500
    }
});

export default router;
