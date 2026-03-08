import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ACCESS_TOKEN_KEY = 'vendora_access_token'
const USER_TYPE_KEY = 'vendora_user_type'

// Auth routes (login, register, etc.) - redirect to dashboard if already logged in
const authRoutes = ['/pos/auth', '/admin/auth']

// Public routes that don't require authentication (add any public pages here)
const publicRoutes = ['/pos/auth', '/admin/auth', '/']

// User level access control
// admin: full access to all routes
// vendora: limited access based on configuration
const hasAccess = (userType: string | undefined, pathname: string): boolean => {
    // If no user type, no access to protected routes
    if (!userType) return false

    // Admin has access to everything
    if (userType === 'admin') return true

    // Vendora has access to POS routes
    if (userType === 'vendor') {
        // Check if trying to access admin-only routes
        if (pathname.startsWith('/admin/')) return false

        // Vendora can access POS routes
        return true
    }

    return false
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Get token and user type from cookies
    const token = request.cookies.get(ACCESS_TOKEN_KEY)?.value
    const userType = request.cookies.get(USER_TYPE_KEY)?.value
    const hasToken = !!token

    // Check if current path is an auth route
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

    // Check if current path is a public route
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // If trying to access auth routes with token, redirect to appropriate dashboard
    if (isAuthRoute && hasToken) {
        const dashboardUrl = userType === 'admin'
            ? new URL('/admin/dashboard', request.url)
            : new URL('/pos/dashboard', request.url)
        return NextResponse.redirect(dashboardUrl)
    }

    // If trying to access any non-public route without token, redirect to login
    if (!isPublicRoute && !hasToken) {
        const loginUrl = userType === 'admin'
            ? new URL('/admin/auth/login', request.url)
            : new URL('/pos/auth/login', request.url)
        // Store the original URL to redirect back after login
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Role-based access control for protected routes
    if (hasToken && !isPublicRoute && !isAuthRoute) {
        if (!hasAccess(userType, pathname)) {
            // User doesn't have access to this route
            // Redirect to unauthorized page or their dashboard
            const response = NextResponse.redirect(
                new URL('/pos/unauthorized', request.url)
            )

            // Set a header to indicate access denied (can be read by the page)
            response.headers.set('x-access-denied', 'true')
            response.headers.set('x-user-type', userType || 'unknown')

            return response
        }
    }


    // Add cache prevention headers for all protected routes
    const response = NextResponse.next()

    // Prevent caching of protected pages
    if (!isPublicRoute) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
    }

    return response
}

export const config = {
    // Match all routes except static files and API routes
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ]
}
