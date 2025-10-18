import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// POST endpoint to save score
app.post('/save-score', async (req, res) => {
  const { name, score, category } = req.body;

  try {
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbxlYdwBPkduNiX2CyMkejesFNAr_goMEzlyRl4vSv3_uc4FcgDmh6My9GlFvtgvtcr7pA/exec',
      {
        method: 'POST',
        body: JSON.stringify({ name, score, category }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      res.json({ status: 'success', data });
    } else {
      const text = await response.text(); // fallback: log HTML response
      console.error('Non-JSON response from Apps Script:', text);
      res.status(500).json({ status: 'error', message: 'Invalid response from Apps Script' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET endpoint to fetch scores
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
    const response = await fetch('https://script.google.com/macros/s/AKfycbxm5wPWW5PXZzwdnNLZizfLejxywlCpfD6qqKBBSMBusmmGI1BuUTdY4wHEW-cpm8U2Ww/exec'); // your sheet URL
    const sheetData = await response.json();
    
    res.json(sheetData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});






app.listen(PORT, () => console.log(`Server running on port ${PORT}`));