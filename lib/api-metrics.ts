import { NextRequest, NextResponse } from 'next/server';
import { httpRequestDuration, httpRequestsTotal } from './prometheus';

type RouteHandler = (request: NextRequest, context?: any) => Promise<NextResponse | Response>;

/**
 * Wraps an API route handler with Prometheus instrumentation.
 * Automatically records http_request_duration_seconds and http_requests_total.
 */
export function withMetrics(route: string, handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    const method = request.method;
    const end = httpRequestDuration.startTimer({ method, route });

    try {
      const response = await handler(request, context);
      const status_code = String(response.status);
      end({ status_code });
      httpRequestsTotal.inc({ method, route, status_code });
      return response;
    } catch (error) {
      end({ status_code: '500' });
      httpRequestsTotal.inc({ method, route, status_code: '500' });
      throw error;
    }
  };
}
