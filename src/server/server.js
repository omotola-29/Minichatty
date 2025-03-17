const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);  
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Import models
const Message = require('./models/Message');

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatapp')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// API Routes
app.use('/api/messages', require('./routes/messages'));

// Socket.io
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Send connection confirmation
  socket.emit('message', {
    username: 'Admin',
    text: 'Welcome to Chat App!',
    time: new Date()
  });
  
  socket.on('joinRoom', (username) => {
    if (username) {
      socket.username = username;
      socket.broadcast.emit('message', {
        username: 'Admin',
        text: `${username} has joined the chat`,
        time: new Date()
      });
    }
  });

  socket.on('chatMessage', async (msg) => {
    try {
      if (!socket.username) {
        return;
      }
      
      const message = new Message({
        username: socket.username,
        text: msg,
        time: new Date()
      });
      
      const savedMessage = await message.save();
      
      io.emit('message', {
        username: savedMessage.username,
        text: savedMessage.text,
        time: savedMessage.time
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Handle typing events
  socket.on('typing', () => {
    if (socket.username) {
      socket.broadcast.emit('typing', {
        username: socket.username
      });
    }
  });

  socket.on('stop typing', () => {
    if (socket.username) {
      socket.broadcast.emit('stop typing', {
        username: socket.username
      });
    }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('message', {
        username: 'Admin',
        text: `${socket.username} has left the chat`,
        time: new Date()
      });
    }
    console.log('Client disconnected');
  });
});

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
