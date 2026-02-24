import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Use DIFFERENT names for custom metrics
const customErrorRate = new Rate('custom_errors');
const customRequestDuration = new Trend('custom_http_req_duration');
const totalRequests = new Counter('total_requests');

// Test configuration - REALISTIC for local testing
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Start with 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 25 },   // Ramp-up to 25 users
    { duration: '2m', target: 25 },    // Stay at 25 users
    { duration: '30s', target: 0 },    // Ramp-down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // Built-in metric
    http_req_failed: ['rate<0.01'],                  // Built-in metric
  },
};

// Base URL for your app
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Group 1: Test homepage
  group('Homepage', () => {
    const homeRes = http.get(BASE_URL);
    totalRequests.add(1);
    
    check(homeRes, {
      'homepage status 200': (r) => r.status === 200,
      'homepage response time < 1s': (r) => r.timings.duration < 1000,
    });
    
    customErrorRate.add(!(homeRes.status === 200));
    customRequestDuration.add(homeRes.timings.duration);
  });
  
  // Group 2: Test metrics endpoint
  group('Metrics API', () => {
    const metricsRes = http.get(`${BASE_URL}/api/metrics`);
    totalRequests.add(1);
    
    check(metricsRes, {
      'metrics endpoint status 200': (r) => r.status === 200,
      'metrics response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    customErrorRate.add(!(metricsRes.status === 200));
    customRequestDuration.add(metricsRes.timings.duration);
  });
  
  // Simulate think time
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}