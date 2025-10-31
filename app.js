const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const {ID_NEAT,TRIGGER_IG,NEAT,SEND_WA,WA,GOOGLE,CX,AI,GEMMA} = process.env

const app = express();
const genAI = new GoogleGenerativeAI(GEMMA);
mongoose.connect(process.env.MONGODB);

// Schema bebas (strict: false)
const faceSchema = new mongoose.Schema({}, { strict: false });
const Face = mongoose.model('Face', faceSchema, 'faces');
const urlSchema = new mongoose.Schema({},{ strict: false });
const Url = mongoose.model('Url',urlSchema,'url');

app.use(express.json());

app.get('/faces', async (req, res) => {
  try {
    const faces = await Face.find(); // ambil semua data
    res.json(faces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/chatbot", (req, res) => {
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === "test123") {
      console.log("Webhook verified");
      res.status(200).send(challenge);
  } else {
      res.sendStatus(403);
  }
});

app.post('/chatbot', async (req, res) => {
  try{
    let entry = req.body.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const senderId = messaging?.sender?.id; 

    const isEcho = messaging?.message?.is_echo;
    const deleted = messaging?.message?.is_deleted;

    if (isEcho) {
      return res.sendStatus(200);
    }else if(deleted){
      sendMessage(senderId,"anda menghapus pesan")
      return res.sendStatus(200);
    }

    if(messaging.message){
      const textMsg = messaging?.message?.text;
      const attachment = messaging.message.attachments?.[0];
      const type = attachment?.type;
      const url = attachment?.payload?.url;
      console.log(textMsg)
      if(type === "image" && url){
        await sendMessage(senderId,"image")
        await postData(senderId,url);
      }else if(textMsg.toLowerCase() === 'halo'){
        await getInfo(senderId)
      }else if(textMsg){
        await sendTemplate(senderId)
      }else if(type === "share" && url){
        await sendMessage(senderId,"posting ig")
      }
    }
    res.sendStatus(200)
  }catch(error){
    res.sendStatus(500)
  }
});

app.get("/whatsapp", (req, res) => {
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === "wabatest") {
      console.log("Webhook verified");
      res.status(200).send(challenge);
  } else {
      res.sendStatus(403);
  }
});

app.post('/whatsapp',async (req,res)=>{
  let entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const phone = changes?.value?.messages?.[0]?.from;
  const text = changes?.value?.messages?.[0]?.text?.body;
  const name = changes?.value?.contacts?.[0]?.profile.name;
  //console.log(text)
  //console.log('Received webhook:', JSON.stringify(req.body, null, 2));

  if(phone && text){
    if(text==="jam"){
      await sendWa(phone, getCurrentDateTimeWIB());
    }else{
      // const result = await searchGoogle(text)
      // await sendWa(phone, result)
      //await sendToAi(phone,text)
      await gemma(phone,text)
    }
  }
  res.sendStatus(200);
})

async function sendMessage(recipientId, messageText) {
  try {
    const responses = await fetch(`${TRIGGER_IG}${ID_NEAT}`, {
      method: "POST", 
      headers: {
        'Authorization': `Bearer ${NEAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: messageText },
      })
    });
  } catch (error) {
    return error;
  }
}

async function getInfo(id){
  const res = await fetch(`${TRIGGER_IG}${id}`, {
    method: "GET", 
    headers: {
      'Authorization': `Bearer ${NEAT}`,
      'Content-Type': 'application/json',
    }
  });
  const data = await res.json();
  const user = data.username;
  await sendMessage(id,`Halo ${user}`);
}

async function postData(id,url) {
  try {
    const res = await fetch("https://kiboy.loca.lt/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query_url: url })
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const firstName = data.results[0].name;
    await sendMessage(id,firstName);
  } catch (err) {
    await sendMessage(id,"Service not available");
  }
}

app.get("/i/dont/care/anymore", async (req, res) => {
  try {
    const url = await Url.findOne(); 
    res.json({ message: url?.url, data: url?.facebook_access_token ,part:url?.part, fields:url?.fields});
  } catch (err) {
    res.status(500).json({ error: "Gagal ambil data" });
  }
});

async function sendTemplate(senderId){
  const responses = await fetch(`${TRIGGER_IG}${ID_NEAT}`, {
    method: "POST", 
    headers: {
      'Authorization': `Bearer ${NEAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient:{
        id:senderId
      },
      message:{
        attachment:{
          type:"template",
          payload:{
            template_type:"button",
            text:"What do you want to do next?",
            buttons:[
              {
                type:"web_url",
                url:"https://colab.research.google.com/drive/11NP5ybWri_J1JgPZ5jkzk1CMpVPEcOnu",
                title:"Visit url"
              }
            ]
          }
        }
      }
    })
  });
}

async function sendWa(phone, text) {
  try {
    const response = await fetch(`${SEND_WA}`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${WA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: text }
      })
    });

  } catch (error) {
    console.error('Error sendWa:', error);
    return error;
  }
}

function getCurrentDateTimeWIB() {
  const now = new Date();

  const tanggal = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(now);

  const waktu = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }).format(now);

  return `Sekarang ${tanggal}, jam ${waktu} WIB`;
}

async function searchGoogle(query) {
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${GOOGLE}&cx=${CX}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items) return "❌ Tidak ada hasil ditemukan.";

    return data.items
      .slice(0, 10) // ambil 3 hasil pertama
      .map((item, i) => {
        return `${i + 1}. ${item.title}\n${item.link}`;
      })
      .join("\n\n");
  } catch (err) {
    return "⚠️ Terjadi kesalahan saat mencari data.";
  }
}

async function sendToAi(phone,text){
  try{
    const res = await axios.post(`${AI}`,
    {
      model: "meta-llama/llama-4-maverick:free",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: text
            }
          ]
        },
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "Kamu adalah asisten singkat. Jawab dengan tepat 10–20 kata. Jika jawaban lebih panjang, potonglah tanpa penjelasan tambahan."
            }
          ]
        }
      ]
    },
  {
      headers:
      {
          'Authorization': `Bearer ${process.env.MI}`,
          'Content-Type': 'application/json',
      }
  })
  await sendWa(phone, `${res.data.choices[0].message.content}`)

  }catch(error){
    await sendWa(phone, "Ada error")
  }
}

async function gemma(phone,text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

    const result = await model.generateContent(`Jawab percakapan user dalam 10 kata User: ${text}`);
    console.log(result.response.text());
    await sendWa(phone,result.response.text())
  } catch (err) {
    await sendWa(phone, "Ada error")
  }
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
