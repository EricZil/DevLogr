import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  return forwardToBackend(request);
}

export async function POST(request: NextRequest) {
  return forwardToBackend(request);
}

export async function PUT(request: NextRequest) {
  return forwardToBackend(request);
}

export async function DELETE(request: NextRequest) {
  return forwardToBackend(request);
}

async function forwardToBackend(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const backendUrl = `${BACKEND_URL}/api/feedback${url.search}`;
    
    // Forward headers
    const headers = new Headers(request.headers);
    headers.delete('host'); // Remove host header to avoid conflicts
    
    // Get body if present
    let body: string | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text();
    }
    
    // Forward request to backend
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
    });
    
    // Forward response
    const responseData = await response.text();
    
    return new NextResponse(responseData, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 