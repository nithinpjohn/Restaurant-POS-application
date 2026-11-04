// All money in the checkout flow is integer cents to avoid float drift when splitting bills.
export const fmt = (cents: number) => `${cents < 0 ? "-" : ""}$${(Math.abs(cents) / 100).toFixed(2)}`
export const parseMoney = (s: string) => Math.round(parseFloat((s || "").replace(/[^0-9.]/g, "") || "0") * 100)

// ponytail: two flat tax lines for the demo. Replace with the real jurisdiction's rates (GST/VAT) and rounding rules.
export const TAX_RATES = [
  { label: "State tax", rate: 0.05 },
  { label: "Service tax", rate: 0.03 },
]

/** Split `total` cents proportionally to `weights`; the last share absorbs rounding so parts always sum to total. */
export function allocate(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (!sum) return weights.map(() => 0)
  const parts = weights.map((w) => Math.floor((total * w) / sum))
  parts[parts.length - 1] += total - parts.reduce((a, b) => a + b, 0)
  return parts
}

export function luhn(digits: string) {
  if (!/^\d{12,19}$/.test(digits)) return false
  let sum = 0
  digits.split("").reverse().forEach((d, i) => {
    let n = +d
    if (i % 2) { n *= 2; if (n > 9) n -= 9 }
    sum += n
  })
  return sum % 10 === 0
}

export function validExpiry(v: string) {
  const m = v.match(/^(\d{2})\/(\d{2})$/)
  if (!m) return false
  const [mm, yy] = [+m[1], 2000 + +m[2]]
  const now = new Date()
  return mm >= 1 && mm <= 12 && (yy > now.getFullYear() || (yy === now.getFullYear() && mm >= now.getMonth() + 1))
}
