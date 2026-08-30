/**
 * Generated avatar for real accounts: initials on a palette gradient, seeded by id so it is
 * stable. Seed musicians keep their static SVGs in /public/mock/avatars.
 */
import { db } from '@/server/db'

const PAIRS = [
  ['#8a79ab', '#c9bde0'],
  ['#e6a5b8', '#f7d4de'],
  ['#77b8a1', '#bfe3d5'],
  ['#f0c88d', '#fbe6c8'],
  ['#a0bbe3', '#d2e0f4'],
  ['#b28fae', '#e3cadf'],
] as const

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const row = db().prepare(`SELECT name FROM musicians WHERE id = ?`).get(id) as
    { name: string } | undefined
  const name = row?.name ?? '?'
  const initials = name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997
  const [a, b] = PAIRS[h % PAIRS.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="${initials}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/>
  </linearGradient></defs>
  <rect width="96" height="96" fill="url(#g)"/>
  <text x="48" y="49" font-family="Lora, Georgia, serif" font-size="34" font-weight="700"
        fill="#ffffff" fill-opacity="0.92" text-anchor="middle" dominant-baseline="central">${initials}</text>
</svg>`
  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml',
      'cache-control': 'public, max-age=86400',
    },
  })
}
