import { NextRequest, NextResponse } from 'next/server';
import register, { httpRequestsTotal } from '@/lib/prometheus';

export async function GET(request: NextRequest) {
  try {
    // Increment counter for this metrics request
    httpRequestsTotal.inc({ 
      method: 'GET', 
      route: '/api/metrics', 
      status_code: '200' 
    });
    
    // metrics() returns a promise that resolves to the metrics string
    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': register.contentType
      }
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    httpRequestsTotal.inc({ 
      method: 'GET', 
      route: '/api/metrics', 
      status_code: '500' 
    });
    return NextResponse.json(
      { error: 'Error generating metrics' },
      { status: 500 }
    );
  }
}

// Prevent caching for metrics
export const dynamic = 'force-dynamic';
