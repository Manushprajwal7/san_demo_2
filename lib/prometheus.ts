import client from 'prom-client';

// Define a custom type for the global object to include our prometheus instance
const globalForPrometheus = global as unknown as {
  prometheusGlobal?: {
    register: client.Registry;
    httpRequestDuration: client.Histogram;
    httpRequestsTotal: client.Counter;
    attendanceWriteTotal: client.Counter;
  };
};

let register: client.Registry;
let httpRequestDuration: client.Histogram;
let httpRequestsTotal: client.Counter;
let attendanceWriteTotal: client.Counter;

if (globalForPrometheus.prometheusGlobal) {
  // Use existing instance if available
  register = globalForPrometheus.prometheusGlobal.register;
  httpRequestDuration = globalForPrometheus.prometheusGlobal.httpRequestDuration;
  httpRequestsTotal = globalForPrometheus.prometheusGlobal.httpRequestsTotal;
  attendanceWriteTotal = globalForPrometheus.prometheusGlobal.attendanceWriteTotal;
} else {
  // Create a new Registry which registers the metrics
  register = new client.Registry();

  // Add a default label which is added to all metrics
  register.setDefaultLabels({
    app: 'sangeetha_demo_app'
  });

  // Enable the collection of default metrics
  client.collectDefaultMetrics({ register });

  // Define custom metrics
  httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5]
  });

  httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  });

  attendanceWriteTotal = new client.Counter({
    name: 'attendance_write_total',
    help: 'Total number of attendance write operations',
    labelNames: ['type', 'status'] // type: 'single', 'bulk', 'update'
  });

  // Register custom metrics
  register.registerMetric(httpRequestDuration);
  register.registerMetric(httpRequestsTotal);
  register.registerMetric(attendanceWriteTotal);

  // Store in global object
  globalForPrometheus.prometheusGlobal = {
    register,
    httpRequestDuration,
    httpRequestsTotal,
    attendanceWriteTotal
  };
}

export { httpRequestDuration, httpRequestsTotal, attendanceWriteTotal };

// Alias for backward compatibility if needed
export const attendanceWrites = attendanceWriteTotal;

export default register;
