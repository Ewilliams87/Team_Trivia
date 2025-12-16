import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { db } from './firebaseConfig.js';
import { FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

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
// 🚨 Server-authoritative /save-score
app.post('/save-score', async (req, res) => {
  try {
    // Reject any client attempt to manually set scores
    return res.status(403).json({
      status: 'error',
      message: 'Score submission is server-controlled. Clients cannot write scores directly.',
    });
  } catch (err) {
    console.error('❌ Error in /save-score:', err);
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
let questionTimer = null; // global for current question
let timeLeft = 0;
let countdownInterval;


io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);

  // Player joins
 // When player joins
socket.on('join-game', ({ name, isMaster, playerId }) => {
  // Check if this player already exists
  const existingSocketId = playerSockets[playerId];

  if (existingSocketId && players[existingSocketId]) {
    // Player is reconnecting: remove old socket entry
    delete players[existingSocketId];
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
  // Assign to global, not local
  timeLeft = duration || 8;

  // 🔑 Reset answered flags
  Object.values(players).forEach((p) => (p.answered = false));

  io.emit('new-question', { question: currentQuestion, duration: timeLeft });

  // Clear previous interval
  if (questionTimer) clearInterval(questionTimer);

  // Start countdown
  questionTimer = setInterval(() => {
    timeLeft -= 1;
    io.emit('timer-update', { timeLeft });

    if (timeLeft <= 0) {
      clearInterval(questionTimer);
      questionTimer = null;

      // Build finalScores map
  const finalScores = {};
  Object.values(players).forEach(p => {
    finalScores[p.playerId] = p.score;
  });

      // End question
      io.emit('question-ended', { correctPlayers });

      // Reset question after short delay
      setTimeout(() => { 
        currentQuestion = null; 
        io.emit('new-question', { question: null }); 
      }, 500);
    }
  }, 1000);
});




  // Player submits answer
 socket.on('submit-answer', async ({ answer, playerId }) => {
  const player = players[socket.id];
  if (!player || !currentQuestion) return;

  // Prevent double answering
  if (player.answered) return;
  player.answered = true;

  const correct = answer === currentQuestion.answer;

  if (correct) {
    try {
      const scoreRef = db.collection('Scores').doc(playerId);

      // Increment score in Firestore
      await scoreRef.set(
        {
          name: player.name,
          score: FieldValue.increment(1),
          category: currentQuestion.category,
          lastUpdated: new Date(),
        },
        { merge: true }
      );

      // Fetch the latest score from Firestore to keep client in sync
      const updatedDoc = await scoreRef.get();
      const latestScore = updatedDoc.data()?.score || 0;

      player.score = latestScore;

      // Notify player
      socket.emit('answer-result', { correct, score: latestScore });

    } catch (err) {
      console.error(`❌ Failed to update score for ${player.name}:`, err);
      // fallback to in-memory score
      player.score += 1;
      socket.emit('answer-result', { correct, score: player.score });
    }
  } else {
    // Wrong answer, just emit current score
    socket.emit('answer-result', { correct, score: player.score });
  }

  // Notify master if correct
  if (correct) {
    correctPlayers.push(player.name);
    const masterSocketId = Object.keys(players).find((id) => players[id].isMaster);
    if (masterSocketId) {
      io.to(masterSocketId).emit('players-correct', correctPlayers);
    }
  }
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


app.post('/register-player', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Invalid name' });

    const normalizedName = name.trim().toLowerCase();

    // Check if any existing player has the same name (case-insensitive)
    const existingPlayers = await db.collection('Scores')
      .get();

   const duplicate = existingPlayers.docs.find(doc =>
  doc.data().name.trim().toLowerCase() === normalizedName
);

if (duplicate) {
  return res.json({ playerId: duplicate.data().playerId, score: duplicate.data().score || 0 });
}


    const playerId = uuidv4();
    await db.collection('Scores').doc(playerId).set({
      name: name.trim(),
      playerId,
      score: 0,
      lastUpdated: new Date(),
    });

    res.json({ playerId, score: 0 });
  } catch (err) {
    console.error('❌ Error registering player:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



app.get('/player-data', async (req, res) => {
  const { playerId } = req.query;
  const playerDocs = await db.collection('Scores').where('playerId', '==', playerId).get();

  if (playerDocs.empty) return res.json({});

  const playerData = playerDocs.docs[0].data();

  res.json({
    name: playerData.name,
    score: playerData.score || 0,
    currentQuestion: currentQuestion
      ? { question: currentQuestion, timeLeft }
      : null,
  });
});









server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
