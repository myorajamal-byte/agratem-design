import type { Handler } from '@netlify/functions'
import { kv } from '@netlify/functions'

// Utility to add CORS headers
const withCors = (res: { statusCode: number; headers?: Record<string, string>; body?: string }) => ({
  ...res,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json; charset=utf-8',
    ...(res.headers || {})
  }
})

const safeParse = (value: unknown): any => {
  if (typeof value !== 'string') return value
  try { return JSON.parse(value) } catch { return value }
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return withCors({ statusCode: 200, body: '' })
  }

  const key = event.queryStringParameters?.key
  if (!key) {
    return withCors({ statusCode: 400, body: JSON.stringify({ error: 'Missing key' }) })
  }

  try {
    if (event.httpMethod === 'GET') {
      const value = await kv.get(key)
      if (value === null || value === undefined) {
        return withCors({ statusCode: 200, body: JSON.stringify({ value: null }) })
      }
      return withCors({ statusCode: 200, body: JSON.stringify({ value: safeParse(value as any) }) })
    }

    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      if (!event.body) {
        return withCors({ statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) })
      }
      const parsed = JSON.parse(event.body)
      const value = parsed?.value
      // Store as stringified JSON for consistency
      await kv.set(key, typeof value === 'string' ? value : JSON.stringify(value))
      return withCors({ statusCode: 200, body: JSON.stringify({ ok: true }) })
    }

    return withCors({ statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) })
  } catch (e: any) {
    return withCors({ statusCode: 500, body: JSON.stringify({ error: e?.message || 'Internal Error' }) })
  }
}

export { handler }
