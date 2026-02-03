'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, FileText } from 'lucide-react'

export default function ComplianceSubmission({ company }: { company: string }) {
  const [branches, setBranches] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [complianceType, setComplianceType] = useState('pf')
  const [submissionMonth, setSubmissionMonth] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)

  const complianceTypes = [
    { value: 'pf', label: 'PF (Provident Fund)' },
    { value: 'esic', label: 'ESIC (Employee State Insurance)' },
    { value: 'pt', label: 'PT (Professional Tax)' },
    { value: 'tds', label: 'TDS (Tax Deducted at Source)' },
    { value: 'esi', label: 'ESI (Employee Security Insurance)' },
    { value: 'gratuity', label: 'Gratuity' },
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: companies } = await supabase.from('companies').select('*').eq('code', company.toUpperCase())
        if (!companies?.length) return

        const id = companies[0].id
        setCompanyId(id)

        const { data: branchData } = await supabase.from('branches').select('*').eq('company_id', id)
        const { data: submissionData } = await supabase.from('compliance_submissions').select('*').eq('company_id', id)

        setBranches(branchData || [])
        setSubmissions(submissionData || [])
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [company])

  const handleBranchToggle = (branchId: string) => {
    setSelectedBranches((prev) => (prev.includes(branchId) ? prev.filter((b) => b !== branchId) : [...prev, branchId]))
  }

  const handleSubmit = async () => {
    if (!submissionMonth || selectedBranches.length === 0) {
      alert('Please select month and at least one branch')
      return
    }

    setIsSubmitting(true)
    try {
      const submissionData = selectedBranches.map((branchId) => ({
        company_id: companyId,
        branch_id: branchId,
        compliance_type: complianceType,
        submission_month: new Date(submissionMonth).toISOString().split('T')[0],
        status: 'pending',
      }))

      const { data } = await supabase.from('compliance_submissions').insert(submissionData).select()

      if (data) {
        setSubmissions([...submissions, ...data])
        setSelectedBranches([])
        setSubmissionMonth('')
        setComplianceType('pf')
        alert('Compliance submission created successfully!')
      }
    } catch (error) {
      console.error('Error submitting:', error)
      alert('Failed to submit compliance')
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateReport = (submission: any) => {
    const branch = branches.find((b) => b.id === submission.branch_id)
    const complianceData = {
      complianceType: complianceTypes.find((c) => c.value === submission.compliance_type)?.label,
      branch: branch?.name,
      location: branch?.location,
      submissionMonth: new Date(submission.submission_month).toLocaleDateString(),
      manpower: branch?.actual_manpower,
      salary: branch?.total_salary,
      status: submission.status,
      submittedAt: new Date(submission.created_at).toLocaleDateString(),
    }

    const reportHTML = `
      <html>
        <head>
          <title>${complianceData.complianceType} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 100%); }
            .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { border-bottom: 3px solid #0ea5e9; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { color: #0c4a6e; margin: 0; }
            .section { margin-bottom: 20px; }
            .section-title { background: #bfdbfe; padding: 10px; border-left: 4px solid #0ea5e9; font-weight: bold; margin-bottom: 10px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0f2fe; }
            .label { font-weight: bold; color: #0c4a6e; width: 40%; }
            .value { color: #1e40af; }
            .status { padding: 5px 10px; border-radius: 5px; font-weight: bold; }
            .status.pending { background: #fef3c7; color: #92400e; }
            .status.approved { background: #d1fae5; color: #065f46; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${complianceData.complianceType} Compliance Report</h1>
            </div>
            <div class="section">
              <div class="section-title">Submission Details</div>
              <div class="row">
                <div class="label">Compliance Type:</div>
                <div class="value">${complianceData.complianceType}</div>
              </div>
              <div class="row">
                <div class="label">Branch:</div>
                <div class="value">${complianceData.branch}</div>
              </div>
              <div class="row">
                <div class="label">Location:</div>
                <div class="value">${complianceData.location}</div>
              </div>
              <div class="row">
                <div class="label">Submission Month:</div>
                <div class="value">${complianceData.submissionMonth}</div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Employee & Salary Details</div>
              <div class="row">
                <div class="label">Total Manpower:</div>
                <div class="value">${complianceData.manpower} Employees</div>
              </div>
              <div class="row">
                <div class="label">Total Salary:</div>
                <div class="value">₹${Number(complianceData.salary).toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Status</div>
              <div class="row">
                <div class="label">Submission Status:</div>
                <div class="value"><span class="status ${complianceData.status.toLowerCase()}">${complianceData.status.toUpperCase()}</span></div>
              </div>
              <div class="row">
                <div class="label">Submitted On:</div>
                <div class="value">${complianceData.submittedAt}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const exportToExcel = () => {
    let csv = 'Compliance Type,Branch,Location,Submission Month,Manpower,Total Salary,Status,Submitted Date\n'

    submissions.forEach((submission) => {
      const branch = branches.find((b) => b.id === submission.branch_id)
      const compType = complianceTypes.find((c) => c.value === submission.compliance_type)?.label
      csv += `"${compType}","${branch?.name}","${branch?.location}","${new Date(submission.submission_month).toLocaleDateString()}","${branch?.actual_manpower}","${branch?.total_salary}","${submission.status}","${new Date(submission.created_at).toLocaleDateString()}"\n`
    })

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', 'compliance_submissions.csv')
    element.click()
  }

  return (
    <div className="space-y-6">
      {/* Submission Form */}
      <Card className="p-6 bg-white border-0 shadow-md">
        <h2 className="text-2xl font-bold text-blue-900 mb-6">Submit Compliance</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-blue-900 font-semibold mb-2 block">Compliance Type</Label>
              <Select value={complianceType} onValueChange={setComplianceType}>
                <SelectTrigger className="border-blue-200 bg-blue-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {complianceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-blue-900 font-semibold mb-2 block">Submission Month</Label>
              <Input
                type="month"
                value={submissionMonth}
                onChange={(e) => setSubmissionMonth(e.target.value)}
                className="border-blue-200 bg-blue-50"
              />
            </div>
          </div>

          <div>
            <Label className="text-blue-900 font-semibold mb-4 block">Select Branches</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.map((branch) => (
                <div key={branch.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Checkbox
                    checked={selectedBranches.includes(branch.id)}
                    onCheckedChange={() => handleBranchToggle(branch.id)}
                    id={`branch-${branch.id}`}
                  />
                  <label htmlFor={`branch-${branch.id}`} className="text-gray-700 cursor-pointer flex-1">
                    <p className="font-semibold">{branch.name}</p>
                    <p className="text-sm text-gray-600">{branch.location}</p>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 py-2 h-10">
            {isSubmitting ? 'Submitting...' : 'Submit Compliance'}
          </Button>
        </div>
      </Card>

      {/* Submissions List */}
      <Card className="p-6 bg-white border-0 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-900">Compliance Submissions</h2>
          {submissions.length > 0 && (
            <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 gap-2">
              <Download className="h-4 w-4" /> Export Excel
            </Button>
          )}
        </div>

        {submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-blue-100">
                <TableRow>
                  <TableHead className="text-blue-900 font-semibold">Compliance Type</TableHead>
                  <TableHead className="text-blue-900 font-semibold">Branch</TableHead>
                  <TableHead className="text-blue-900 font-semibold">Month</TableHead>
                  <TableHead className="text-blue-900 font-semibold">Status</TableHead>
                  <TableHead className="text-blue-900 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => {
                  const branch = branches.find((b) => b.id === submission.branch_id)
                  const compType = complianceTypes.find((c) => c.value === submission.compliance_type)
                  return (
                    <TableRow key={submission.id} className="hover:bg-blue-50">
                      <TableCell className="font-medium">{compType?.label}</TableCell>
                      <TableCell>{branch?.name}</TableCell>
                      <TableCell>{new Date(submission.submission_month).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {submission.status.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          onClick={() => {
                            setSelectedSubmission(submission)
                            setIsOpen(true)
                          }}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <FileText className="h-4 w-4" /> View Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">No compliance submissions yet</div>
        )}
      </Card>

      {/* Report Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Compliance Report</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Compliance Type</p>
                  <p className="font-semibold">{complianceTypes.find((c) => c.value === selectedSubmission.compliance_type)?.label}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Branch</p>
                  <p className="font-semibold">{branches.find((b) => b.id === selectedSubmission.branch_id)?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submission Month</p>
                  <p className="font-semibold">{new Date(selectedSubmission.submission_month).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold capitalize">{selectedSubmission.status}</p>
                </div>
              </div>
              <Button onClick={() => generateReport(selectedSubmission)} className="w-full bg-blue-600 hover:bg-blue-700">
                Generate & Print PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
