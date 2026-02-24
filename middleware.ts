import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();
  const response = NextResponse.next();
  const duration = Date.now() - start;
  
  // We'll track metrics in the response handler
  // This is just to demonstrate timing
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
