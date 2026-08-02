var express = require('express');
const pb = require("../db");
var router = express.Router();

async function createUser(body) {
  await pb.collection('users').create(body);
}

async function loginUser(username, pass) {
  return await pb.collection('users').authWithPassword(
      username,
      pass,
  );
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Twistask' });
});

router.post('/register/submit', async (req, res, next) => {
  try {
    let body = req.body;
    const result = await createUser(body);
    console.log(result);
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
})

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Twistask' });
});

router.post('/login/submit', async (req, res, next) => {
  try {
    let body = req.body;
    const result = await loginUser(body.email, body.password);
    console.log(result);
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
})

module.exports = router;
