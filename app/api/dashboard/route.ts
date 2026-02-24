import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { dbCache } from '@/lib/database-cache'

const CACHE_TTL = 60 * 1000 // 1 minute

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')

  if (!company) {
    return NextResponse.json({ error: 'Company parameter required' }, { status: 400 })
  }

  // Check cache first
  const cacheKey = `dashboard:${company.toUpperCase()}`
  const cached = dbCache.get(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const supabase = createServerSupabaseClient()

    // Fetch company
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('code', company.toUpperCase())
      .single()

    if (companyError || !companyData) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const companyId = companyData.id

    // Parallelize all data fetches
    const [licensesResult, branchesResult, employeesResult] = await Promise.all([
      supabase
        .from('license_status')
        .select('id, status')
        .eq('company_id', companyId),
      supabase
        .from('branches')
        .select('id, name, location, approved_manpower, actual_manpower, total_salary')
        .eq('company_id', companyId),
      supabase
        .from('employees')
        .select('gender, salary')
        .eq('company_id', companyId),
    ])

    const licenses = licensesResult.data || []
    const branches = branchesResult.data || []
    const employees = employeesResult.data || []

    // Single-pass aggregation
    let maleCount = 0
    let femaleCount = 0
    let totalSalary = 0

    for (const e of employees) {
      if (e.gender === 'Male') maleCount++
      else if (e.gender === 'Female') femaleCount++
      totalSalary += e.salary || 0
    }

    let active = 0
    let expiring = 0
    let expired = 0

    for (const l of licenses) {
      if (l.status === 'Active') active++
      else if (l.status === 'Expiring Soon') expiring++
      else if (l.status === 'Expired') expired++
    }

    const result = {
      licenses,
      branches,
      employees: employees.length,
      maleCount,
      femaleCount,
      totalSalary,
      licenseStatusCounts: { active, expiring, expired },
    }

    // Cache the result
    dbCache.set(cacheKey, result, CACHE_TTL)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
