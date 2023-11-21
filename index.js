const express = require('express')
const app = express()
const mongoose = require("mongoose")
const cors = require('cors')
require('dotenv').config()

mongoose.connect(process.env.DB_URI);

const userSchema = new mongoose.Schema({
  username: String
})

const User = mongoose.model('User', userSchema)

const ExerciseSchema = new mongoose.Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date
})

const Exercise = mongoose.model('Exercise', ExerciseSchema)

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  const userObj = new User({ username: req.body.username });

  try {
    const user = await userObj.save()
    res.json(user)
  } catch (err) {
    console.log(err)
  }

})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { duration, description, date } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) {
      res.send("can't find user.")
    } else {
      const exercise = new Exercise({
        user_id: id,
        description: description,
        duration: duration,
        date: date ? new Date(date) : new Date(),
      })
      const exerciseSaved = await exercise.save();
      res.json({
        username: user.username,
        description: exerciseSaved.description,
        duration: exerciseSaved.duration,
        date: new Date(exerciseSaved.date).toDateString(),
        _id: user._id,
      })
    }
  } catch (error) {
    console.log(error)
    res.send("error saving exercise")
  }

  app.get("/api/users", (req, res) => {
    User.find({})
      .then((user) => {
        if(user.length === 0) {
          res.json("No users found")
        }
      res.json(user)
    }).catch((err) => {
      console.log(err) 
    })
  })
})

app.get('/api/users/:_id/logs', async (req,res) => {
  const id = req.params._id;
  const {from, to, limit} = req.query;
  const user = await User.findById(id);
      if(!user) {
        res.json("No user found")
      } else {
         let dataObj = {}
              if(from) {
                dataObj["$gte"] = new Date(from)
              }
              if(to) {
                dataObj["$lte"] = new Date(to)
              }
              let filter = {
                user_id: id
              }
              if(from || to) {
                filter.date = dataObj;
              }
              const exercise = await Exercise.find(filter).limit(+limit ?? 100);
        const log = exercise.map(e => {
          return {
            description: e.description,
            duration: e.duration,
            date: e.date.toDateString()
          }
        })

        res.json({
          username: user.username,
          count: exercise.length,
          _id: id,
          log
        })
      }                                      
    })

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
