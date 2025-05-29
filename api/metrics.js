const client = require('prom-client');

// Crear un registro de métricas
const register = new client.Registry();

// Métricas por defecto del sistema
client.collectDefaultMetrics({ register });

// Contador de requests HTTP
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Histograma de duración de requests
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Gauge para tareas activas
const activeTasks = new client.Gauge({
  name: 'active_tasks_total',
  help: 'Total number of active tasks',
  labelNames: ['status'],
  registers: [register]
});

// Contador de operaciones de base de datos
const dbOperationsTotal = new client.Counter({
  name: 'db_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'collection'],
  registers: [register]
});

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  activeTasks,
  dbOperationsTotal,
};