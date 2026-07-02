import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2,
    })
    
    const results = await Promise.all(users.map(async u => ({
      email: u.email,
      hashLength: u.password.length,
      startsWithBcrypt: u.password.startsWith('$2'),
    })))

    return NextResponse.json(results)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
