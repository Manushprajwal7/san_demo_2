
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';


export async function GET() {
  console.log('Debug Districts API called');
  try {
    const supabase = createServerSupabaseClient();
    console.log('Supabase client created');
    
    // Fetch all distinct districts from ka_branches
    const { data, error } = await supabase
      .from('ka_branches')
      .select('district')
      .order('district');

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('Data fetched:', data?.length);

    // Get unique values
    const distinctDistricts = [...new Set(data?.map(item => item.district).filter(Boolean))];

    return NextResponse.json({ 
      count: distinctDistricts.length,
      districts: distinctDistricts 
    });
  } catch (error: any) {
    console.error('Catch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
