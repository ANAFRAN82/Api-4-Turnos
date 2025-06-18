require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const turnoRoutes = require('./routes/turnoRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const { ConnectDB } = require('./data/config');

const app = express();
const server = http.createServer(app);


ConnectDB();
// Configuración de WebSocket
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware de autenticación para WebSockets
io.use(authMiddleware.socketAuth);

// Eventos de conexión WebSocket
io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.user?.nombre}`);
  
  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.user?.nombre}`);
  });
});

// Middlewares
app.use(cors());
app.use(express.json());

// Inyectar io en las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
app.use('/api-4-turnos', turnoRoutes);

// Conexión a MongoDB
mongoose.connect(process.env.URL)
  .then(() => {
    console.log('Conectado a MongoDB');
    const PORT = process.env.PORT || 3010;
    server.listen(PORT, () => {
      console.log(`Servidor de turnos en http://192.168.103.85:${PORT}`);
    });
  })
  .catch(err => console.error('Error MongoDB:', err));