import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')
  const tableId = searchParams.get('tableId')

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

    if (tableId) {
      const { data: tableData } = await supabase
        .from('dynamic_table_data')
        .select('*')
        .eq('table_metadata_id', tableId)
        .order('created_at', { ascending: false })

      return NextResponse.json(tableData || [])
    }

    const { data: tables } = await supabase
      .from('dynamic_tables_metadata')
      .select('*')
      .eq('company_id', companies.id)

    return NextResponse.json(tables || [])
  } catch (error) {
    console.error('Dynamic tables API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (type === 'table') {
      const { companyId, tableName, displayName, fields } = data

      const { data: newTable, error } = await supabase
        .from('dynamic_tables_metadata')
        .insert({
          company_id: companyId,
          table_name: tableName.toLowerCase().replace(/\s+/g, '_'),
          display_name: displayName,
          fields,
        })
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(newTable)
    }

    if (type === 'data') {
      const { tableMetadataId, rowData } = data

      const { data: newData, error } = await supabase
        .from('dynamic_table_data')
        .insert({
          table_metadata_id: tableMetadataId,
          data: rowData,
        })
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(newData)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Dynamic tables POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, data } = body

    const { data: updated, error } = await supabase
      .from('dynamic_table_data')
      .update({ data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Dynamic tables PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID parameter required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('dynamic_table_data')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dynamic tables DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
