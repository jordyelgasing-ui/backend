const express = require('express')
const mongoose = require('mongoose')
const app = express()
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const Item = require('./model/item');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Koneksi MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/my_new_database', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err));


app.get('/',(req,res)=>{
    res.render('index',{title:'test'});
})

app.get('/add',(req,res)=>{
    res.render('add',{title:'test'})
})
app.post('/add',async (req,res)=>{
    const {name,email} =req.body
    await Item.create({name,email})
    res.redirect('/')
})
app.get('/read',async (req,res)=>{
    const items = await Item.find();
    res.render('read',{items})
})
app.get('/edit/:id',async(req,res)=>{
    const items = await Item.findById(req.params.id)
    res.render('edit',{items})
})
app.put('/edit/:id',async(req,res)=>{
    const { name, email} = req.body;
    await Item.findByIdAndUpdate(req.params.id, { name, email});
    res.redirect('/')
})

app.delete('/delete/:id',async(req,res)=>{
    await Item.findByIdAndDelete(req.params.id)
    res.redirect('/')
})
const PORT = 3000
app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}`)
})