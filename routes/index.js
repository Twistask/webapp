import express from "express";
import Database from "../db.js";
let router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Twistask' });
  console.log(Database.connection.authStore);
});

export default router;
