const express = require('express');
const cors = require('cors');
require('dotenv').config();
const routes = require('./routes');
const mongoose = require('mongoose');
const Task = require('./modules/Task'); 

const { register, httpRequestsTotal, httpRequestDuration, activeTasks } = require('./metrics');

const app = express();

// --- TAREA EN SEGUNDO PLANO PARA MÉTRICAS ---
setInterval(async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URL);
    }
    
    const pending = await Task.countDocuments({ status: 'Pending' });
    const completed = await Task.countDocuments({ status: 'Completed' });
    const inProgress = await Task.countDocuments({ status: 'In Progress' });

    activeTasks.set({ status: 'pending' }, pending);
    activeTasks.set({ status: 'completed' }, completed);
    activeTasks.set({ status: 'in_progress' }, inProgress);
    
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


app.use(routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`Health check at http://localhost:${PORT}/health`);
});