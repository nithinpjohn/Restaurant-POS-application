export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

export function downloadFile(name: string, text: string, mime = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  Object.assign(document.createElement("a"), { href: url, download: name }).click()
  URL.revokeObjectURL(url)
}

/** Opens `body` (trusted, already-escaped HTML) in a small window and prints it. Returns false if the popup was blocked. */
export function printHtml(title: string, body: string) {
  const w = window.open("", "_blank", "width=420,height=720")
  if (!w) return false
  w.document.write(
    `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:13px/1.5 system-ui,sans-serif;margin:24px;max-width:360px}table{width:100%;border-collapse:collapse}td{padding:2px 0}td:last-child{text-align:right}h1{font-size:16px;text-align:center;margin:0}p.c{text-align:center;margin:0;color:#555}hr{border:0;border-top:1px dashed #999;margin:10px 0}.b td{font-weight:600}</style>${body}`,
  )
  w.document.close()
  w.focus()
  w.print()
  return true
}
