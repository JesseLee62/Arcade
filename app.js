const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const port = 3000;
const methodOverride = require('method-override');
const bodyParser = require('body-parser');

// MongoDB setup
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
let db;

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db('Arcade');
  } catch (e) {
    console.error(e);
  }
}
connectDB();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));

// Redirect
app.get('/', (req, res) => {
    res.redirect('/games');
});

// Route for listing games
app.get('/games', async (req, res) => {
    let query = {};
    if (req.query.title) {
      query.name = { $regex: new RegExp(req.query.title, 'i') }; // Case-insensitive partial search
    }
    if (req.query.type && req.query.type !== 'No filter') {
      query.type = req.query.type;
    }
  
    try {
      const games = await db.collection('ArcadeGames').find(query).toArray();
      const types = await db.collection('ArcadeGames').distinct('type'); // Get all distinct types for the dropdown
      res.render('games', { games, types });
    } catch (e) {
      res.status(500).send("Error fetching games: " + e.message);
    }
  });

// Add new games
app.get('/games/new', (req, res) => {
    res.render('newGame'); // This should point to a 'newGame.ejs' form without needing an ID
});

// Route for add new games
app.post('/games', async (req, res) => {
    try {
      await db.collection('ArcadeGames').insertOne({
        name: req.body.title,
        description: req.body.description,
        type: req.body.type,
        minimumAge: req.body.minimumAge,
        pricing: {
          hourly: req.body.pricingHourly,
          perGame: req.body.pricingPerGame
        },
        image: {
          path: req.body.imagePath,
          description: req.body.imageAlt
        }
      });
      res.redirect('/games');
    } catch (e) {
      res.status(500).send("Error creating new game: " + e.message);
    }
});

// Route for game detail
app.get('/games/:id', async (req, res) => {
    try {
      const gameId = new ObjectId(req.params.id); 
      const game = await db.collection('ArcadeGames').findOne({ _id: gameId });

      if (!game) {
        return res.status(404).send("Game not found");
      }
  
      res.render('gameDetails', { game });
    } catch (e) {
      res.status(500).send("Error fetching game details: " + e.message);
    }
});

// Route to show the edit form
app.get('/games/:id/edit', async (req, res) => {
    try {
      const game = await db.collection('ArcadeGames').findOne({ _id: new ObjectId(req.params.id) });
      if (!game) {
        return res.status(404).send("Game not found");
      }
      res.render('editGame', { game });
    } catch (e) {
      res.status(500).send("Error showing edit form: " + e.message);
    }
});

// Route to update the game details
app.put('/games/:id', async (req, res) => {
    try {
      const gameId = new ObjectId(req.params.id);
      await db.collection('ArcadeGames').updateOne(
        { _id: gameId },
        { $set: {
          name: req.body.title,
          description: req.body.description,
          type: req.body.type,
          minimumAge: req.body.minimumAge,
          pricing: {
            hourly: req.body.pricingHourly,
            perGame: req.body.pricingPerGame
          },
          image: {
            path: req.body.imagePath,
            description: req.body.imageAlt
          }
        }}
      );
      res.redirect('/games/' + req.params.id); // Redirect to the updated game details page
    } catch (e) {
      res.status(500).send("Error updating game: " + e.message);
    }
});

// Route to handle the DELETE request
app.delete('/games/:id', async (req, res) => {
    try {
      await db.collection('ArcadeGames').deleteOne({ _id: new ObjectId(req.params.id) });
      res.redirect('/games');
    } catch (e) {
      res.status(500).send("Error deleting game: " + e.message);
    }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
