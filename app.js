const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Koneksi MongoD
mongoose.connect(process.env.MONGODB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema bebas (strict: false)
const faceSchema = new mongoose.Schema({}, { strict: false });
const Face = mongoose.model('Face', faceSchema, 'faces');

// Middleware biar bisa baca JSON body
app.use(express.json());

// Endpoint get all data
app.get('/faces', async (req, res) => {
  try {
    const faces = await Face.find(); // ambil semua data
    res.json(faces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
