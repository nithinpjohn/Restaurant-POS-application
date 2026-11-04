export type Role = "manager" | "cashier" | "server"

export const USERS: Record<Role, { name: string; email: string; label: string }> = {
  manager: { name: "Emir Abiyyu", email: "emir@kansresto.com", label: "Manager" },
  cashier: { name: "Sara Lee", email: "sara@kansresto.com", label: "Cashier" },
  server: { name: "Tom Reyes", email: "tom@kansresto.com", label: "Server" },
}

export type Permission = "menu.delete" | "table.delete" | "order.void" | "payment.refund" | "audit.view" | "shift.close"

const ALLOWED: Record<Permission, Role[]> = {
  "menu.delete": ["manager"],
  "table.delete": ["manager"],
  "order.void": ["manager"],
  "payment.refund": ["manager"],
  "audit.view": ["manager"],
  "shift.close": ["manager"],
}

export const can = (role: Role, perm: Permission) => ALLOWED[perm].includes(role)

// ponytail: client-side demo only. Real roles and the manager PIN must be checked on the server
// (hashed PIN, per-manager, rate limited); anything enforced only in the browser can be bypassed.
export const MANAGER_PIN = "1234"
