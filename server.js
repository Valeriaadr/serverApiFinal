const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cron = require('node-cron');
const cors = require('cors'); // Importa el paquete cors

const adminRoutes = require('./routes/adminRoutes');
const zooRoutes = require('./routes/ZooRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const animalRoutes = require('./routes/animalRoutes');
const testRoutes = require('./routes/testRoutes'); // pruebas APIII

const app = express();
const port = 3001;

// Middleware para parsear JSON
app.use(express.json());

// Configurar CORS para permitir solicitudes desde cualquier origen
app.use(cors({
  origin: 'http://localhost:8081', // Permite solicitudes desde cualquier origen
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Configura las sesiones
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Conecta a la base de datos MongoDB
mongoose.connect('mongodb+srv://Valeriaadr:vale123@cluster0.mt5djqw.mongodb.net/ZooSmart', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: false
});

mongoose.connection.on('open', () => {
  console.log('Conectado a la base de datos MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('Error al conectar a la base de datos MongoDB:', err);
});

// Rutas
app.use('/api/admin', adminRoutes);
app.use('/api/zoo', zooRoutes);
app.use('/api/empleado', empleadoRoutes);
app.use('/api/animal', animalRoutes);
app.use('/api/test', testRoutes);

// Ruta PRUEBA API
app.get('/api/test', (req, res) => {
  res.send('La API está funcionando correctamente!');
});

// Ruta para obtener los datos del usuario
app.get('/api/user', (req, res) => {
  if (!req.session.user) {
    res.status(401).send('No autorizado');
  } else {
    res.json(req.session.user);
  }
});

// Actualizar edad de los animales diariamente
cron.schedule('0 0 * * *', async () => {
  try {
    const animals = await Animal.find({});
    const today = new Date();

    for (const animal of animals) {
      const birthdate = new Date(animal.fecha_nacimiento);
      const age = today.getFullYear() - birthdate.getFullYear();
      const monthDifference = today.getMonth() - birthdate.getMonth();
      const dayDifference = today.getDate() - birthdate.getDate();
      const years = age - (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0) ? 1 : 0);
      const months = (monthDifference + 12) % 12;
      const days = Math.max(dayDifference, 0);

      animal.edad = { años: years, meses: months, dias: days };
      await animal.save();
    }

    console.log('Edades actualizadas correctamente');
  } catch (error) {
    console.error('Error actualizando edades:', error);
  }
});

app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
