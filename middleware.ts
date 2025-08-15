import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/api/health' ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    const key = request.nextUrl.searchParams.get('key')
    const authHeader = request.headers.get('authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return NextResponse.next()
    }
    
    if (!key || key !== process.env.SECRET_URL_KEY) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
  }

  if (pathname === '/') {
    const key = request.nextUrl.searchParams.get('key')
    
    if (!key || key !== process.env.SECRET_URL_KEY) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Access Required</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: system-ui, sans-serif; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                min-height: 100vh; 
                margin: 0; 
                background: #f3f4f6;
              }
              .container { 
                text-align: center; 
                padding: 2rem; 
                background: white; 
                border-radius: 0.5rem; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                max-width: 400px;
              }
              h1 { color: #1f2937; margin-bottom: 1rem; }
              p { color: #6b7280; margin-bottom: 1.5rem; }
              input { 
                width: 100%; 
                padding: 0.75rem; 
                border: 1px solid #d1d5db; 
                border-radius: 0.375rem; 
                margin-bottom: 1rem;
                box-sizing: border-box;
              }
              button { 
                width: 100%; 
                padding: 0.75rem; 
                background: #3b82f6; 
                color: white; 
                border: none; 
                border-radius: 0.375rem; 
                cursor: pointer;
              }
              button:hover { background: #2563eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🔒 Access Required</h1>
              <p>Please enter the access key to view the Call Board</p>
              <form onsubmit="event.preventDefault(); window.location.href = '/?key=' + encodeURIComponent(document.getElementById('key').value);">
                <input type="password" id="key" placeholder="Enter access key" required>
                <button type="submit">Access Board</button>
              </form>
            </div>
          </body>
        </html>
        `,
        { 
          status: 401,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      )
    }
  }

  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}