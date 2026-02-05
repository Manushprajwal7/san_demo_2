'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export default function LicenseManager({ company }: { company: string }) {
  const [licenses, setLicenses] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const licenseTypes = ['PF License', 'ESIC License', 'PT License', 'TDS License', 'ESI License', 'DPTA License', 'Shop Act License', 'Building License']

  const [formData, setFormData] = useState({
    licenseType: '',
    expiryDate: '',
    status: 'Active',
  })

  useEffect(() => {
    loadData()
  }, [company])

  const loadData = async () => {
    try {
      setLoading(true)
      const [licenseRes, companyRes] = await Promise.all([fetch(`/api/licenses?company=${company}`), fetch(`/api/companies?code=${company}`)])

      if (licenseRes.ok) setLicenses(await licenseRes.json())
      if (companyRes.ok) {
        const companyData = await companyRes.json()
        setCompanyId(companyData.id)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLicense = () => {
    setFormData({ licenseType: '', expiryDate: '', status: 'Active' })
    setEditingId(null)
    setIsOpen(true)
  }

  const handleEditLicense = (license: any) => {
    setFormData({
      licenseType: license.license_type,
      expiryDate: license.expiry_date,
      status: license.status,
    })
    setEditingId(license.id)
    setIsOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.licenseType || !formData.expiryDate) {
      alert('Please fill all fields')
      return
    }

    try {
      const method = editingId ? 'PATCH' : 'POST'
      const payload = editingId
        ? { id: editingId, status: formData.status, expiryDate: formData.expiryDate }
        : { companyId, licenseType: formData.licenseType, expiryDate: formData.expiryDate, status: formData.status }

      const response = await fetch('/api/licenses', { method, body: JSON.stringify(payload) })

      if (response.ok) {
        await loadData()
        setIsOpen(false)
        alert(editingId ? 'License updated' : 'License added')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save license')
    }
  }

  const handleDeleteLicense = async (id: string) => {
    if (!confirm('Delete this license?')) return

    try {
      const response = await fetch(`/api/licenses?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        await loadData()
        alert('License deleted')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Expiring Soon':
        return 'bg-yellow-100 text-yellow-800'
      case 'Expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <Card className="p-8 text-center">Loading...</Card>

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white border-0 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-900">License Management</h2>
          <Button onClick={handleAddLicense} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="h-4 w-4" /> Add License
          </Button>
        </div>

        {licenses.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-blue-100">
                <TableRow>
                  <TableHead className="text-blue-900 font-semibold">License Type</TableHead>
                  <TableHead className="text-blue-900 font-semibold">Expiry Date</TableHead>
                  <TableHead className="text-blue-900 font-semibold">Status</TableHead>
                  <TableHead className="text-blue-900 font-semibold">Days Left</TableHead>
                  <TableHead className="text-blue-900 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license: any) => {
                  const daysLeft = license.expiry_date ? Math.floor((new Date(license.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
                  return (
                    <TableRow key={license.id} className="hover:bg-blue-50">
                      <TableCell className="font-medium">{license.license_type}</TableCell>
                      <TableCell>{new Date(license.expiry_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(license.status)}`}>{license.status}</span>
                      </TableCell>
                      <TableCell className="font-semibold">{daysLeft > 0 ? daysLeft : 'Expired'}</TableCell>
                      <TableCell className="space-x-2">
                        <Button onClick={() => handleEditLicense(license)} variant="outline" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDeleteLicense(license.id)} variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">No licenses configured</div>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-blue-900">{editingId ? 'Edit License' : 'Add New License'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-blue-900 font-semibold mb-2 block">License Type *</Label>
              <Select value={formData.licenseType} onValueChange={(v) => setFormData({ ...formData, licenseType: v })}>
                <SelectTrigger className="border-blue-200 bg-blue-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {licenseTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-blue-900 font-semibold mb-2 block">Expiry Date *</Label>
              <Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className="border-blue-200 bg-blue-50" />
            </div>

            <div>
              <Label className="text-blue-900 font-semibold mb-2 block">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="border-blue-200 bg-blue-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button onClick={() => setIsOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                {editingId ? 'Update' : 'Add'} License
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
