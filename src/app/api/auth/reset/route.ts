import { NextResponse } from 'next/server'
import { resetPasswordWithToken } from '@/server/auth'

export async function POST(req: Request) {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'JSON only' }, { status: 415 })
  }
  const { token, password } = await req.json().catch(() => ({}))
  if (typeof token !== 'string' || !token) {
    return NextResponse.json({ error: 'Missing reset code' }, { status: 400 })
  }
  try {
    const ok = resetPasswordWithToken(token, password)
    if (!ok) {
      return NextResponse.json({ error: 'That reset code is invalid or expired' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
