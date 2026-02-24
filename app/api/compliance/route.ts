import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { dbCache, getCachedCompanyId } from '@/lib/database-cache'
import { withMetrics } from '@/lib/api-metrics'

const CACHE_TTL = 60 * 1000 // 1 minute

export const GET = withMetrics('/api/compliance', async (request: NextRequest) => {
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

    const cacheKey = `compliance:${companyData.id}`
    const cached = dbCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Parallelize submissions and branches fetch
    const [submissionsResult, branchesResult] = await Promise.all([
      supabase
        .from('compliance_submissions')
        .select('id, state, district, branch, act, forms, status, submitted_at, created_at')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('branches')
        .select('id, name')
        .eq('company_id', companyData.id),
    ])

    const result = {
      submissions: submissionsResult.data || [],
      branches: branchesResult.data || [],
    }

    dbCache.set(cacheKey, result, CACHE_TTL)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Compliance API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = withMetrics('/api/compliance', async (request: NextRequest) => {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    // Handle new wizard format
    if (body.state && body.district && body.branch && body.act) {
      const complianceId = `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const complianceData = {
        id: complianceId,
        state: body.state,
        district: body.district,
        branch: body.branch,
        act: body.act,
        forms: body.forms || [],
        submitted_at: new Date().toISOString(),
        status: 'generated',
        company_id: 1
      };

      const { data, error } = await supabase
        .from('compliance_submissions')
        .insert(complianceData)
        .select()

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({
          success: true,
          id: complianceId,
          message: 'Compliance forms generated successfully',
          data: complianceData
        });
      }

      return NextResponse.json({
        success: true,
        id: complianceId,
        message: 'Compliance forms generated successfully',
        data: data?.[0] || complianceData
      });
    }

    // Handle existing format
    const { submissions } = body

    const { data, error } = await supabase
      .from('compliance_submissions')
      .insert(submissions)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Compliance POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const PATCH = withMetrics('/api/compliance', async (request: NextRequest) => {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { id, status } = body

    const { data, error } = await supabase
      .from('compliance_submissions')
      .update({ status })
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Compliance PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
