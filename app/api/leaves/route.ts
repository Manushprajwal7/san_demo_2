import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')
  const type = searchParams.get('type') // 'types' or 'records'

  if (!company) {
    return NextResponse.json({ error: 'Company parameter required' }, { status: 400 })
  }

  try {
    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .eq('code', company.toUpperCase())
      .single()

    if (!companies) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    if (type === 'types') {
      const { data } = await supabase
        .from('leave_types')
        .select('*')
        .eq('company_id', companies.id)

      return NextResponse.json(data || [])
    }

    const { data } = await supabase
      .from('leave_records')
      .select('*')
      .eq('company_id', companies.id)
      .order('from_date', { ascending: false })

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Leaves API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
}

export async function PATCH(request: NextRequest) {
  try {
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
}
