import express from "express";
let router = express.Router();

import Database from "../db.js";

/* GET editor page. */
router.get('/', async (req, res, next) => {
    try {
        res.render('editor', { title: 'Twistask' });
    } catch (err) {
        next(err); // lets Express error middleware handle/log and return a 500
    }
});

router.post('/submit', async (req, res, next) => {
    try {
        let body = req.body;
        const result = await Database.functions.createTask(body);
        console.log(result);
    } catch (err) {
        next(err); // lets Express error middleware handle/log and return a 500
    }
})

export default router;
