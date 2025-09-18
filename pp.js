const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Koneksi MongoD
mongoose.connect('mongodb://localhost:27017/fbpage', {
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

app.post("/faces", async (req, res) => {
  try {
    const { name, embedding } = req.body;

    if (!name || !embedding) {
      return res.status(400).json({ error: "name dan embedding wajib diisi" });
    }

    // Simpan ke Mongo
    const face = new Face({ name, embedding });
    await face.save();

    res.json({ message: "Sukses simpan embedding!", data: face });
  } catch (err) {
    res.status(500).json({ error: "Gagal simpan data" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
