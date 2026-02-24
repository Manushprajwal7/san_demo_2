import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { dbCache, getCachedCompanyId } from '@/lib/database-cache'
import { withMetrics } from '@/lib/api-metrics'

const CACHE_TTL = 60 * 1000 // 1 minute

export const GET = withMetrics('/api/leaves', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')
  const type = searchParams.get('type')

  if (!company) {
    return NextResponse.json({ error: 'Company parameter required' }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()
    const companyData = await getCachedCompanyId(supabase, company)

    if (!companyData) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const cacheKey = `leaves:${companyData.id}:${type || 'records'}`
    const cached = dbCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    if (type === 'types') {
      const { data } = await supabase
        .from('leave_types')
        .select('id, name, days_allowed')
        .eq('company_id', companyData.id)

      const result = data || []
      dbCache.set(cacheKey, result, CACHE_TTL)
      return NextResponse.json(result)
    }

    const { data } = await supabase
      .from('leave_records')
      .select('id, employee_id, leave_type_id, from_date, to_date, reason, status')
      .eq('company_id', companyData.id)
      .order('from_date', { ascending: false })

    const result = data || []
    dbCache.set(cacheKey, result, CACHE_TTL)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Leaves API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = withMetrics('/api/leaves', async (request: NextRequest) => {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { employeeId, leaveTypeId, fromDate, toDate, reason } = body

    const { data, error } = await supabase
      .from('leave_records')
      .insert({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        from_date: fromDate,
        to_date: toDate,
        reason,
        status: 'pending',
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Leaves POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const PATCH = withMetrics('/api/leaves', async (request: NextRequest) => {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { id, status } = body

    const { data, error } = await supabase
      .from('leave_records')
      .update({ status })
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Leaves PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
