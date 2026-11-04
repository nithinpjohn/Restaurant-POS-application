// ponytail: demo codes. Move to the backend (validation, expiry, usage limits) before going live.
export type Coupon = { code: string; type: "percent" | "amount"; value: number; min: number; label: string }

export const COUPONS: Record<string, Omit<Coupon, "code">> = {
  WELCOME10: { type: "percent", value: 10, min: 0, label: "10% off" },
  LUNCH15: { type: "percent", value: 15, min: 15, label: "15% off orders over $15" },
  FLAT5: { type: "amount", value: 5, min: 20, label: "$5 off orders over $20" },
}

export const discountFor = (c: Coupon | null, subtotal: number) =>
  !c || subtotal < c.min ? 0 : Math.min(subtotal, c.type === "percent" ? (subtotal * c.value) / 100 : c.value)
