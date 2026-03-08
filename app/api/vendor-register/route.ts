/**
 * Vendor Registration Proxy
 *
 * Proxies vendor registration to POST /api/admin/vendors using a
 * server-side admin service token. This keeps the admin token
 * out of the browser bundle.
 */

import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://vendora-api.abedubas.dev/api'
const ADMIN_SERVICE_TOKEN = process.env.ADMIN_SERVICE_TOKEN ?? ''

export async function POST(req: NextRequest) {
  if (!ADMIN_SERVICE_TOKEN) {
    return NextResponse.json(
      { message: 'Vendor registration is not configured. Please contact support.' },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()

    const response = await fetch(`${API_BASE}/admin/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${ADMIN_SERVICE_TOKEN}`,
      },
      body: JSON.stringify({
        name: body.name ?? body.business_name,
        email: body.email,
        password: body.password,
        password_confirmation: body.password_confirmation,
        business_name: body.business_name,
        subscription_plan: body.subscription_plan ?? 'free',
      }),
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json(
      { message: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
