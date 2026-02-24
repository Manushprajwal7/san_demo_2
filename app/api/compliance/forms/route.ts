import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { complianceId, formData, act } = body;

    if (!complianceId || !formData || !act) {
      return NextResponse.json(
        { error: 'Missing required fields: complianceId, formData, act' },
        { status: 400 }
      );
    }

    const formDataEntry = {
      compliance_id: complianceId,
      act: act,
      form_data: formData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('compliance_form_data')
      .upsert(formDataEntry, {
        onConflict: 'compliance_id'
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: true,
        message: 'Form data saved successfully',
        data: formDataEntry
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Form data saved successfully',
      data: data?.[0] || formDataEntry
    });
  } catch (error) {
    console.error('Form save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const complianceId = searchParams.get('complianceId');

    if (!complianceId) {
      return NextResponse.json(
        { error: 'complianceId parameter required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('compliance_form_data')
      .select('*')
      .eq('compliance_id', complianceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || null
    });
  } catch (error) {
    console.error('Form fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
