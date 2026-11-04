// ponytail: demo sync endpoint. It keeps records in server memory (lost on restart) and has no authentication.
// Replace with a real database and session auth before production. Writes are idempotent on kind + id.
export const dynamic = "force-dynamic"

type Stored = { kind: string; payload: unknown; receivedAt: number }
const g = globalThis as unknown as { __syncStore?: Map<string, Stored> }
const store = (g.__syncStore ??= new Map<string, Stored>())

const KINDS = ["order", "sale"]
const MAX_BYTES = 100_000

/** Health check used by the client to confirm the server is actually reachable. */
export function GET() {
  return Response.json({ ok: true, stored: store.size })
}

export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) return Response.json({ error: "Payload too large" }, { status: 413 })

  let body: { kind?: unknown; id?: unknown; payload?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { kind, id, payload } = body ?? {}
  if (typeof kind !== "string" || !KINDS.includes(kind) || typeof id !== "string" || !id || id.length > 100 || typeof payload !== "object" || payload === null) {
    return Response.json({ error: "Invalid record" }, { status: 422 })
  }

  const key = `${kind}:${id}`
  const duplicate = store.has(key)
  if (!duplicate) store.set(key, { kind, payload, receivedAt: Date.now() })
  return Response.json({ ok: true, duplicate })
}
