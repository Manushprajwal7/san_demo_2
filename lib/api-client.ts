export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetch(url, { ...options, headers })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `API Error: ${response.status}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()

// Dashboard endpoints
export const dashboardAPI = {
  getDashboard: (company: string) => apiClient.get(`/dashboard?company=${company}`),
}

// Employees endpoints
export const employeesAPI = {
  getEmployees: (company: string, branchId?: string) =>
    apiClient.get(`/employees?company=${company}${branchId ? `&branchId=${branchId}` : ''}`),
  createEmployee: (data: any) => apiClient.post('/employees', data),
  updateEmployee: (id: string, data: any) => apiClient.patch(`/employees?id=${id}`, { id, ...data }),
  deleteEmployee: (id: string) => apiClient.delete(`/employees?id=${id}`),
}

// Branches endpoints
export const branchesAPI = {
  getBranches: (company: string) => apiClient.get(`/branches?company=${company}`),
  createBranch: (data: any) => apiClient.post('/branches', data),
  updateBranch: (id: string, data: any) => apiClient.patch(`/branches?id=${id}`, { id, ...data }),
}

// Calendar endpoints
export const calendarAPI = {
  getEvents: (company: string) => apiClient.get(`/calendar?company=${company}`),
  createEvent: (data: any) => apiClient.post('/calendar', data),
}

// Compliance endpoints
export const complianceAPI = {
  getSubmissions: (company: string) => apiClient.get(`/compliance?company=${company}`),
  createSubmissions: (data: any) => apiClient.post('/compliance', data),
  updateSubmission: (id: string, status: string) => apiClient.patch('/compliance', { id, status }),
}

// Dynamic tables endpoints
export const dynamicTablesAPI = {
  getTables: (company: string, tableId?: string) =>
    apiClient.get(`/dynamic-tables?company=${company}${tableId ? `&tableId=${tableId}` : ''}`),
  createTable: (data: any) => apiClient.post('/dynamic-tables', { type: 'table', data }),
  createData: (data: any) => apiClient.post('/dynamic-tables', { type: 'data', data }),
  updateData: (id: string, data: any) => apiClient.patch('/dynamic-tables', { id, data }),
  deleteData: (id: string) => apiClient.delete(`/dynamic-tables?id=${id}`),
}

// Leaves endpoints
export const leavesAPI = {
  getLeaveTypes: (company: string) => apiClient.get(`/leaves?company=${company}&type=types`),
  getLeaveRecords: (company: string) => apiClient.get(`/leaves?company=${company}`),
  createLeave: (data: any) => apiClient.post('/leaves', data),
  updateLeave: (id: string, status: string) => apiClient.patch('/leaves', { id, status }),
}

// Licenses endpoints
export const licensesAPI = {
  getLicenses: (company: string) => apiClient.get(`/licenses?company=${company}`),
  createLicense: (data: any) => apiClient.post('/licenses', data),
  updateLicense: (id: string, data: any) => apiClient.patch('/licenses', { id, ...data }),
}

// Companies endpoints
export const companiesAPI = {
  getAll: () => apiClient.get('/companies'),
  getByCode: (code: string) => apiClient.get(`/companies?code=${code}`),
  create: (data: any) => apiClient.post('/companies', data),
}
