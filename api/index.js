const express = require('express');
const cors = require('cors');
require('dotenv').config();
const routes = require('./routes');
const mongoose = require('mongoose');
const Task = require('./modules/Task'); // Importamos el modelo

const { register, httpRequestsTotal, httpRequestDuration, activeTasks } = require('./metrics');

const app = express();

// --- TAREA EN SEGUNDO PLANO PARA MÉTRICAS ---
// Actualiza el conteo de tareas cada 15 segundos
setInterval(async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URL);
    }
    
    // Contar tareas por estado
    const pending = await Task.countDocuments({ status: 'pending' });
    const completed = await Task.countDocuments({ status: 'completed' });
    const inProgress = await Task.countDocuments({ status: 'in-progress' });

    // Actualizar métricas de Prometheus
    activeTasks.set({ status: 'pending' }, pending);
    activeTasks.set({ status: 'completed' }, completed);
    activeTasks.set({ status: 'in-progress' }, inProgress);
    
  } catch (error) {
    console.error('Error updating task metrics:', error.message);
  }
}, 15000); 

// Middleware para métricas
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
  });
  
  next();
});

app.use(cors());
app.use(express.json());

// ✅ ENDPOINTS CRÍTICOS DIRECTAMENTE EN INDEX.JS
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    console.error('Error generating metrics:', ex);
    res.status(500).end(ex.toString());
  }
});

// Rutas de la aplicación
app.use(routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`Health check at http://localhost:${PORT}/health`);
});