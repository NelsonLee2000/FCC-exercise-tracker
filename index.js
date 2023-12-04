const express = require('express');
const app = express();
const cors = require('cors');
const pool = require("./db");
require('dotenv').config();
var bodyParser = require('body-parser')

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//when new users are posted, it add the username into the "users" table and get it a unique user_id
app.post('/api/users', async (req, res) => {
  try {
    const username = req.body.username;
    const newUser = await pool.query(
      "INSERT INTO users (username) VALUES($1) RETURNING user_id, username",
      [username]
    );
    const { user_id, username: insertedUsername } = newUser.rows[0];

    res.json({
      username: insertedUsername,
      _id: user_id,
    });
  } catch (err) {
    console.error(err.message);
  }
});

//this function checks if the userId exists
async function userIdCheck(userId) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', 
    [userId]
    );
    return result.rows.length > 0;
  } catch (err) {
    console.error(err.message);
    return false;
  }
}

// this function retrieves the username for a given user_Id
async function getUsername(userId) {
  const result = await pool.query('SELECT username FROM users WHERE user_id = $1',
  [userId]
  );
  return result.rows[0].username;
};

// if the user_id exists, this function will add the description, duration, and date into the exercises table
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const userId = req.body[":_id"];
    const description = req.body.description;
    const duration = req.body.duration;
    const date = req.body.date;

    if (await userIdCheck(userId)) {
      let newDateValue;

      if(date === "") {
        currentDate = new Date();
        newDateValue = currentDate.toISOString().split('T')[0];
      } else {
        newDateValue = date;
      }

      const newExercise = await pool.query(
        "INSERT INTO exercises (user_id, description, duration, date) VALUES($1, $2, $3, $4) RETURNING user_id, description, duration, date",
        [userId, description, duration, newDateValue]
      );
      const { user_id, description: newDescription, duration: newDuration, date: newDate} = newExercise.rows[0];
      const username = await getUsername(userId);

      newDateObject = new Date(newDate);
      formattedDate = newDateObject.toDateString();

        res.json({
          _id: user_id,
          username: username,
          date: formattedDate,
          duration: newDuration,
          description: newDescription
        });
      
    } else {
      res.json({error: "user_id does not exist"});
    };

  } catch (err) {
    console.error(err.message);
  }
});

//return an array of all users with user_id and usernames
app.get('/api/users', async (req, res) => {
  try {
    const allUsers = await pool.query(
      "SELECT user_id, username FROM users"
    );

    res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
  }
});

//shows users exercise logs, can restrict to a date range and limit how many exercises are shown
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const userId = req.params._id
    const username = await getUsername(userId);
    const from = req.query.from;
    const to = req.query.to;
    const limit = req.query.limit;
    let logExercises;

    if (from && to && limit) {
      logExercises = await pool.query(
        'SELECT description, duration, date FROM exercises WHERE user_id = $1 AND date BETWEEN $2 and $3 LIMIT $4',
        [userId, from, to, limit]
      );
      console.log("using from to and limit")
    } else {
      logExercises = await pool.query(
        'SELECT description, duration, date FROM exercises WHERE user_id = $1',
        [userId]
      );
      console.log("not using from to and limit")
    }

  const logExercisesFormattedDate = logExercises.rows.map(exercise => ({
    description: exercise.description,
    duration: exercise.duration,
    date: new Date(exercise.date).toDateString()
  }));

  res.json({
    _id: userId,
    username: username,
    count: logExercises.rows.length,
    log: logExercisesFormattedDate
  });
  } catch (err) {
    console.error(err.message)
  }

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});



