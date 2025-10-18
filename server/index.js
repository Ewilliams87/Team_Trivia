import express from 'express';
import https from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const server = https.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ------------------- REST Endpoints -------------------

app.post('/save-score', async (req, res) => {
  
  const { playerId, name, score, category } = req.body;
  try {
    // Send to Google Apps Script
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbxlYdwBPkduNiX2CyMkejesFNAr_goMEzlyRl4vSv3_uc4FcgDmh6My9GlFvtgvtcr7pA/exec',
      {
        method: 'POST',
        body: JSON.stringify({ playerId, name, score, category }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      res.json({ status: 'success', data });
    } else {
      const text = await response.text();
      console.error('Non-JSON response from Apps Script:', text);
      res.status(500).json({ status: 'error', message: 'Invalid response from Apps Script' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/scores', async (req, res) => {
  try {
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbxlYdwBPkduNiX2CyMkejesFNAr_goMEzlyRl4vSv3_uc4FcgDmh6My9GlFvtgvtcr7pA/exec'
    );
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      console.error('Non-JSON response from Apps Script:', text);
      res.status(500).json({ status: 'error', message: 'Invalid response from Apps Script' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/questions', async (req, res) => {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbxm5wPWW5PXZzwdnNLZizfLejxywlCpfD6qqKBBSMBusmmGI1BuUTdY4wHEW-cpm8U2Ww/exec');
    const sheetData = await response.json();
    res.json(sheetData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ------------------- Socket.IO -------------------

let currentQuestion = null;
let players = {}; // { socketId: { name, score, isMaster } }
let correctPlayers = []; // Track players who answered correctly for current question

io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);

  // --- Player joins ---
  socket.on('join-game', ({ name, isMaster, playerId }) => {
  players[socket.id] = { name, score: 0, isMaster, playerId }; // <-- add playerId here
  console.log(`🎮 Player joined: ${name} (Master: ${isMaster}) [${socket.id}], UUID: ${playerId}`);
  socket.emit('joined', { id: socket.id, name, isMaster, playerId });
  io.emit('players-update', Object.values(players));
});

  // --- Game Master sends question ---
  socket.on('sendingGame-question', ({ question, duration }) => {
    const player = players[socket.id];
    if (!player?.isMaster) return;

    // Normalize question
    currentQuestion = {
      question: question.Question,
      options: [question.Option1, question.Option2, question.Option3, question.Option4],
      answer: question.Answer
    };

    // Reset correct players for new question
    correctPlayers = [];

    console.log(`📤 Question sent by Master ${player.name}:`, question);
    io.emit('new-question', { question: currentQuestion, duration });
  });

  // --- Player submits answer ---
socket.on('submit-answer', async ({answer,playerId}) => {
  const player = players[socket.id];
  if (!player || !currentQuestion) return;

  const correct = answer === currentQuestion.answer;

  if (correct) {
    // Increment score
    players[socket.id].score += 1;

    // Add to correct players list
    if (!correctPlayers.includes(player.name)) correctPlayers.push(player.name);

    // --- Update Google Sheet via your Apps Script ---
    try {
      console.log(`📌 Updating sheet for PlayerID: ${playerId}, Name: ${player.name}`);
      const res = await fetch(
        'https://script.google.com/macros/s/AKfycbxlYdwBPkduNiX2CyMkejesFNAr_goMEzlyRl4vSv3_uc4FcgDmh6My9GlFvtgvtcr7pA/exec',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId,
            name: player.name,
            score: 1, // increment by 1 for this correct answer
            category: currentQuestion.category || 'General'
          })
        }
      );

      const data = await res.json();
      console.log(`✅ Score updated on sheet for ${player.name} (ID: ${playerId}):`, data);
    } catch (err) {
      console.error(`❌ Failed to update Google Sheet for ${player.name}:`, err);
    }
  }

  console.log(`✉️ Answer received from ${player.name}: "${answer}" (Correct: ${correct}) | Score: ${players[socket.id].score}`);
  
  // Send result back to player
  socket.emit('answer-result', { correct, score: players[socket.id].score });
});


  // --- Notify Game Master when timer ends ---
  socket.on('question-ended', () => {
    // Find the master socket
    const masterSocketId = Object.keys(players).find(id => players[id].isMaster);
    if (masterSocketId) {
      io.to(masterSocketId).emit('players-correct', correctPlayers);
      console.log('📢 Players who answered correctly:', correctPlayers);
    }
  });

  // --- Player disconnects ---
  socket.on('disconnect', () => {
    const player = players[socket.id];
    if (player) console.log(`❌ Player disconnected: ${player.name} [${socket.id}]`);
    delete players[socket.id];
    io.emit('players-update', Object.values(players));
  });
});



// Use server.listen instead of app.listen for Socket.IO
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
