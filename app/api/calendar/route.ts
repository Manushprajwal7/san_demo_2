import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { dbCache, getCachedCompanyId } from '@/lib/database-cache'

const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')

  if (!company) {
    return NextResponse.json({ error: 'Company parameter required' }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()
    const companyData = await getCachedCompanyId(supabase, company)

    if (!companyData) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const cacheKey = `calendar:${companyData.id}`
    const cached = dbCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Parallelize events and branches fetch
    const [eventsResult, branchesResult] = await Promise.all([
      supabase
        .from('calendar_events')
        .select('id, title, description, event_date, event_type, branch_id')
        .eq('company_id', companyData.id),
      supabase
        .from('branches')
        .select('id, name')
        .eq('company_id', companyData.id),
    ])

    const result = {
      events: eventsResult.data || [],
      branches: branchesResult.data || [],
    }

    dbCache.set(cacheKey, result, CACHE_TTL)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { companyId, title, description, eventDate, eventType, branchId } = body

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        company_id: companyId,
        branch_id: branchId,
        title,
        description,
        event_date: eventDate,
        event_type: eventType,
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Invalidate cache
    dbCache.delete(`calendar:${companyId}`)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Calendar POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
