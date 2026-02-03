import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')

  if (!company) {
    return NextResponse.json({ error: 'Company parameter required' }, { status: 400 })
  }

  try {
    // Fetch company
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('code', company.toUpperCase())
      .single()

    if (companyError || !companies) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const companyId = companies.id

    // Fetch licenses
    const { data: licenses } = await supabase
      .from('license_status')
      .select('*')
      .eq('company_id', companyId)

    // Fetch branches
    const { data: branches } = await supabase
      .from('branches')
      .select('*')
      .eq('company_id', companyId)

    // Fetch employees
    const { data: employees } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)

    // Calculate statistics
    const maleCount = employees?.filter((e: any) => e.gender === 'Male').length || 0
    const femaleCount = employees?.filter((e: any) => e.gender === 'Female').length || 0
    const totalSalary = employees?.reduce((sum: number, e: any) => sum + (e.salary || 0), 0) || 0

    const licenseStatusCounts = {
      active: licenses?.filter((l: any) => l.status === 'Active').length || 0,
      expiring: licenses?.filter((l: any) => l.status === 'Expiring Soon').length || 0,
      expired: licenses?.filter((l: any) => l.status === 'Expired').length || 0,
    }

    return NextResponse.json({
      licenses: licenses || [],
      branches: branches || [],
      employees: employees?.length || 0,
      maleCount,
      femaleCount,
      totalSalary,
      licenseStatusCounts,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
