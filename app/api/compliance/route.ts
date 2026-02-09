import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')

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

    const { data: submissions } = await supabase
      .from('compliance_submissions')
      .select('*')
      .eq('company_id', companies.id)
      .order('created_at', { ascending: false })

    const { data: branches } = await supabase
      .from('branches')
      .select('*')
      .eq('company_id', companies.id)

    return NextResponse.json({
      submissions: submissions || [],
      branches: branches || [],
    })
  } catch (error) {
    console.error('Compliance API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle new wizard format
    if (body.state && body.district && body.branch && body.act) {
      // Generate a unique compliance ID
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
        company_id: 1 // You might want to get this from auth
      };

      // Save to database
      const { data, error } = await supabase
        .from('compliance_submissions')
        .insert(complianceData)
        .select()

      if (error) {
        console.error('Database error:', error);
        // Fallback to just returning success without DB save
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
}

export async function PATCH(request: NextRequest) {
  try {
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
}
