import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { db } from './firebaseConfig.js';
import { FieldValue } from 'firebase-admin/firestore';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = 3001;

app.use(cors());
app.use(express.json());




app.post('/admin/login', (req, res) => {
  const { password } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  res.json({ success: true });
});




// ------------------- REST Endpoints -------------------

// Save or update player score
app.post('/save-score', async (req, res) => {
  try {
    const { playerId, name, score, category } = req.body;
    if (!playerId || !name || typeof score !== 'number') {
      return res.status(400).json({ status: 'error', message: 'Invalid data' });
    }

    const scoreRef = db.collection('Scores').doc(playerId);
    const doc = await scoreRef.get();

    if (doc.exists) {
      await scoreRef.update({
        name,
        score: FieldValue.increment(score),
        category,
        lastUpdated: new Date(),
      });
    } else {
      await scoreRef.set({
        name,
        score,
        category,
        lastUpdated: new Date(),
      });
    }

    res.json({ status: 'success' });
  } catch (err) {
    console.error('❌ Error saving score:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Get all scores
app.get('/scores', async (req, res) => {
  try {
    const snapshot = await db.collection('Scores').get();
    const scores = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(scores);
  } catch (err) {
    console.error('❌ Error fetching scores:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Get questions by category
app.get('/questions', async (req, res) => {
  try {
    const category = req.query.category;
    let snapshot;

    if (category && category !== 'All') {
      snapshot = await db.collection('questions').where('Category', '==', category).get();
    } else {
      snapshot = await db.collection('questions').get();
    }

    const questions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(questions);
  } catch (err) {
    console.error('❌ Error fetching questions:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Backend: Save or update player
app.post('/save-player', async (req, res) => {
  try {
    const { playerId, name } = req.body;
    if (!playerId || !name) {
      return res.status(400).json({ status: 'error', message: 'Invalid data' });
    }

    const playerRef = db.collection('Scores').doc(playerId);
    const doc = await playerRef.get();

    if (doc.exists) {
      // Update name if needed
      await playerRef.update({
        name,
        lastUpdated: new Date(),
      });
    } else {
      // Create new player with initial score 0
      await playerRef.set({
        name,
        score: 0,
        category: 'General',
        lastUpdated: new Date(),
      });
    }

    res.json({ status: 'success' });
  } catch (err) {
    console.error('❌ Error saving player:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});


// ------------------- Socket.IO -------------------

// Global player tracking
let players = {};        // { socketId: { name, score, isMaster, playerId } }
let playerSockets = {};  // { playerId: socketId }
let correctPlayers = [];
let currentQuestion = null;

io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);

  // Player joins
  socket.on('join-game', ({ name, isMaster, playerId }) => {
    // Handle reconnects: remove old socket if exists
    const oldSocketId = playerSockets[playerId];
    if (oldSocketId && players[oldSocketId]) {
      delete players[oldSocketId];
    }

    // Add/update player
    players[socket.id] = { name, score: 0, isMaster, playerId };
    playerSockets[playerId] = socket.id;

    console.log(`🎮 Player joined: ${name} (Master: ${isMaster}) [${socket.id}], UUID: ${playerId}`);

    socket.emit('joined', { id: socket.id, name, isMaster, playerId });
    io.emit('players-update', Object.values(players));
  });

  // Game Master sends question
  socket.on('sendingGame-question', ({ question, duration }) => {
    const player = players[socket.id];
    if (!player?.isMaster) return;

    currentQuestion = {
      question: question.Question,
      options: [question.Option1, question.Option2, question.Option3, question.Option4],
      answer: question.Answer,
      category: question.Category || 'General',
    };

    correctPlayers = [];
    console.log(`📤 Question sent by Master ${player.name}:`, question);
    io.emit('new-question', { question: currentQuestion, duration });
  });

  // Player submits answer
  socket.on('submit-answer', async ({ answer, playerId }) => {
    const player = players[socket.id];
    if (!player || !currentQuestion) return;

    const correct = answer === currentQuestion.answer;
    if (correct) {
      players[socket.id].score += 1;
      if (!correctPlayers.includes(player.name)) correctPlayers.push(player.name);

      try {
        const scoreRef = db.collection('Scores').doc(playerId);
        await db.runTransaction(async (transaction) => {
          const doc = await transaction.get(scoreRef);
          if (doc.exists) {
            transaction.update(scoreRef, {
              name: player.name,
              score: doc.data().score + 1,
              category: currentQuestion.category,
              lastUpdated: new Date(),
            });
          } else {
            transaction.set(scoreRef, {
              name: player.name,
              score: 1,
              category: currentQuestion.category,
              lastUpdated: new Date(),
            });
          }
        });
      } catch (err) {
        console.error(`❌ Failed to update score for ${player.name}:`, err);
      }

      const masterSocketId = Object.keys(players).find((id) => players[id].isMaster);
      if (masterSocketId) io.to(masterSocketId).emit('players-correct', correctPlayers);
    }

    socket.emit('answer-result', { correct, score: players[socket.id].score });
  });

  // Game master ends question manually
  socket.on('question-ended', () => {
    const masterSocketId = Object.keys(players).find((id) => players[id].isMaster);
    if (masterSocketId) io.to(masterSocketId).emit('players-correct', correctPlayers);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const player = players[socket.id];
    if (player) console.log(`❌ Player disconnected: ${player.name} [${socket.id}]`);
    delete players[socket.id];

    // Remove from playerSockets mapping
    if (player && player.playerId && playerSockets[player.playerId] === socket.id) {
      delete playerSockets[player.playerId];
    }

    io.emit('players-update', Object.values(players));
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
