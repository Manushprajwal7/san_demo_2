import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const customErrorRate = new Rate('custom_errors');
const customRequestDuration = new Trend('custom_http_req_duration');
const totalRequests = new Counter('total_requests');

// Per-endpoint duration trends
const dashboardDuration = new Trend('dashboard_duration');
const dashboardOverviewDuration = new Trend('dashboard_overview_duration');
const enhancedDashboardDuration = new Trend('enhanced_dashboard_duration');
const employeesDuration = new Trend('employees_duration');
const employeesDataDuration = new Trend('employees_data_duration');
const branchesDuration = new Trend('branches_duration');
const companiesDuration = new Trend('companies_duration');
const leavesDuration = new Trend('leaves_duration');
const licensesDuration = new Trend('licenses_duration');
const calendarDuration = new Trend('calendar_duration');
const complianceDuration = new Trend('compliance_duration');
const complianceDashboardDuration = new Trend('compliance_dashboard_duration');
const metricsDuration = new Trend('metrics_duration');
const templatesDuration = new Trend('templates_duration');

// Test configuration - realistic load profile
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp-up to 10 users
    { duration: '1m', target: 10 },    // Sustain 10 users
    { duration: '30s', target: 25 },   // Ramp-up to 25 users
    { duration: '2m', target: 25 },    // Sustain 25 users
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    // Global thresholds - p95 < 400ms
    http_req_duration: ['p(95)<400', 'p(99)<800'],
    http_req_failed: ['rate<0.01'],

    // Per-endpoint p95 thresholds
    dashboard_duration: ['p(95)<400'],
    dashboard_overview_duration: ['p(95)<400'],
    enhanced_dashboard_duration: ['p(95)<400'],
    employees_duration: ['p(95)<400'],
    employees_data_duration: ['p(95)<400'],
    branches_duration: ['p(95)<400'],
    companies_duration: ['p(95)<400'],
    leaves_duration: ['p(95)<400'],
    licenses_duration: ['p(95)<400'],
    calendar_duration: ['p(95)<400'],
    compliance_duration: ['p(95)<400'],
    compliance_dashboard_duration: ['p(95)<400'],
    metrics_duration: ['p(95)<400'],
    templates_duration: ['p(95)<400'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const COMPANY_CODE = __ENV.COMPANY_CODE || 'SAN';

// Helper to track request metrics
function trackRequest(res, trendMetric) {
  totalRequests.add(1);
  customErrorRate.add(res.status !== 200);
  customRequestDuration.add(res.timings.duration);
  if (trendMetric) {
    trendMetric.add(res.timings.duration);
  }
}

export default function () {
  // Randomly pick a scenario to simulate real user behavior
  const scenario = Math.random();

  if (scenario < 0.15) {
    // 15% - Dashboard overview (most common page)
    testDashboardOverview();
  } else if (scenario < 0.25) {
    // 10% - Enhanced dashboard
    testEnhancedDashboard();
  } else if (scenario < 0.35) {
    // 10% - Dashboard with company
    testDashboard();
  } else if (scenario < 0.45) {
    // 10% - Employees list
    testEmployees();
  } else if (scenario < 0.55) {
    // 10% - Employees data
    testEmployeesData();
  } else if (scenario < 0.62) {
    // 7% - Branches
    testBranches();
  } else if (scenario < 0.69) {
    // 7% - Companies
    testCompanies();
  } else if (scenario < 0.76) {
    // 7% - Leaves
    testLeaves();
  } else if (scenario < 0.83) {
    // 7% - Licenses
    testLicenses();
  } else if (scenario < 0.88) {
    // 5% - Calendar
    testCalendar();
  } else if (scenario < 0.93) {
    // 5% - Compliance
    testCompliance();
  } else if (scenario < 0.96) {
    // 3% - Compliance dashboard
    testComplianceDashboard();
  } else if (scenario < 0.98) {
    // 2% - Templates
    testTemplates();
  } else {
    // 2% - Metrics
    testMetrics();
  }

  // Simulate think time between requests
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds
}

// ============ Test Functions ============

function testDashboardOverview() {
  group('Dashboard Overview', () => {
    // Test without filters
    const res1 = http.get(`${BASE_URL}/api/dashboard-overview?state=all&branch=all`);
    trackRequest(res1, dashboardOverviewDuration);

    check(res1, {
      'dashboard-overview status 200': (r) => r.status === 200,
      'dashboard-overview has data': (r) => {
        try { return JSON.parse(r.body).total_branches !== undefined; } catch { return false; }
      },
      'dashboard-overview p95 < 400ms': (r) => r.timings.duration < 400,
    });

    sleep(0.3);

    // Test with state filter
    const res2 = http.get(`${BASE_URL}/api/dashboard-overview?state=karnataka&branch=all`);
    trackRequest(res2, dashboardOverviewDuration);

    check(res2, {
      'dashboard-overview filtered status 200': (r) => r.status === 200,
    });
  });
}

function testEnhancedDashboard() {
  group('Enhanced Dashboard', () => {
    const res = http.get(`${BASE_URL}/api/enhanced-dashboard`);
    trackRequest(res, enhancedDashboardDuration);

    check(res, {
      'enhanced-dashboard status 200': (r) => r.status === 200,
      'enhanced-dashboard has system_tables': (r) => {
        try { return JSON.parse(r.body).system_tables !== undefined; } catch { return false; }
      },
      'enhanced-dashboard p95 < 400ms': (r) => r.timings.duration < 400,
    });
  });
}

function testDashboard() {
  group('Dashboard', () => {
    const res = http.get(`${BASE_URL}/api/dashboard?company=${COMPANY_CODE}`);
    trackRequest(res, dashboardDuration);

    check(res, {
      'dashboard status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'dashboard p95 < 400ms': (r) => r.timings.duration < 400,
    });
  });
}

function testEmployees() {
  group('Employees', () => {
    // Test table listing
    const res1 = http.get(`${BASE_URL}/api/employees`);
    trackRequest(res1, employeesDuration);

    check(res1, {
      'employees list status 200': (r) => r.status === 200,
      'employees list p95 < 400ms': (r) => r.timings.duration < 400,
    });

    sleep(0.2);

    // Test with pagination
    const res2 = http.get(`${BASE_URL}/api/employees?table=man_power&chunk=1&chunkSize=50`);
    trackRequest(res2, employeesDuration);

    check(res2, {
      'employees paginated status 200': (r) => r.status === 200,
    });
  });
}

function testEmployeesData() {
  group('Employees Data', () => {
    // Test with default pagination
    const res1 = http.get(`${BASE_URL}/api/employees/data?page=1&limit=100`);
    trackRequest(res1, employeesDataDuration);

    check(res1, {
      'employees-data status 200': (r) => r.status === 200,
      'employees-data has pagination': (r) => {
        try { return JSON.parse(r.body).pagination !== undefined; } catch { return false; }
      },
      'employees-data p95 < 400ms': (r) => r.timings.duration < 400,
    });

    sleep(0.2);

    // Test page 2
    const res2 = http.get(`${BASE_URL}/api/employees/data?page=2&limit=100`);
    trackRequest(res2, employeesDataDuration);

    check(res2, {
      'employees-data page 2 status 200': (r) => r.status === 200,
    });
  });
}

function testBranches() {
  group('Branches', () => {
    const res = http.get(`${BASE_URL}/api/branches?company=${COMPANY_CODE}`);
    trackRequest(res, branchesDuration);

    check(res, {
      'branches status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'branches p95 < 400ms': (r) => r.timings.duration < 400,
    });
  });
}

function testCompanies() {
  group('Companies', () => {
    // List all companies
    const res1 = http.get(`${BASE_URL}/api/companies`);
    trackRequest(res1, companiesDuration);

    check(res1, {
      'companies list status 200': (r) => r.status === 200,
      'companies list p95 < 400ms': (r) => r.timings.duration < 400,
    });

    sleep(0.2);

    // Get specific company
    const res2 = http.get(`${BASE_URL}/api/companies?code=${COMPANY_CODE}`);
    trackRequest(res2, companiesDuration);

    check(res2, {
      'company by code status 200 or 400': (r) => r.status === 200 || r.status === 400,
    });
  });
}

function testLeaves() {
  group('Leaves', () => {
    const res = http.get(`${BASE_URL}/api/leaves?company=${COMPANY_CODE}`);
    trackRequest(res, leavesDuration);

    check(res, {
      'leaves status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'leaves p95 < 400ms': (r) => r.timings.duration < 400,
    });
  });
}

function testLicenses() {
  group('Licenses', () => {
    const res = http.get(`${BASE_URL}/api/licenses?company=${COMPANY_CODE}`);
    trackRequest(res, licensesDuration);

    check(res, {
      'licenses status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'licenses p95 < 400ms': (r) => r.timings.duration < 400,
    });
  });
}

function testCalendar() {
  group('Calendar', () => {
    const res = http.get(`${BASE_URL}/api/calendar?company=${COMPANY_CODE}`);
    trackRequest(res, calendarDuration);

    check(res, {
      'calendar status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'calendar p95 < 400ms': (r) => r.timings.duration < 400,
    });
  });
}

function testCompliance() {
  group('Compliance', () => {
    const res = http.get(`${BASE_URL}/api/compliance?company=${COMPANY_CODE}`);
    trackRequest(res, complianceDuration);

    check(res, {
      'compliance status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'compliance p95 < 400ms': (r) => r.timings.duration < 400,
    });
  });
}

function testComplianceDashboard() {
  group('Compliance Dashboard', () => {
    const res = http.get(`${BASE_URL}/api/compliance/dashboard`);
    trackRequest(res, complianceDashboardDuration);

    check(res, {
      'compliance-dashboard status 200': (r) => r.status === 200,
      'compliance-dashboard has data': (r) => {
        try { return JSON.parse(r.body).totalSubmissions !== undefined; } catch { return false; }
      },
      'compliance-dashboard p95 < 400ms': (r) => r.timings.duration < 400,
    });
  });
}

function testTemplates() {
  group('Templates', () => {
    const res = http.get(`${BASE_URL}/api/templates`);
    trackRequest(res, templatesDuration);

    check(res, {
      'templates status 200': (r) => r.status === 200,
      'templates p95 < 400ms': (r) => r.timings.duration < 400,
    });
  });
}

function testMetrics() {
  group('Metrics', () => {
    const res = http.get(`${BASE_URL}/api/metrics`);
    trackRequest(res, metricsDuration);

    check(res, {
      'metrics status 200': (r) => r.status === 200,
      'metrics p95 < 400ms': (r) => r.timings.duration < 400,
    });
  });
}
