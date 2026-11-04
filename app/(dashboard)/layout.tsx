import { NotificationsProvider } from "@/components/notifications/notifications-provider"
import { NotificationPanel } from "@/components/notifications/notification-panel"
import { AuthProvider } from "@/components/auth/auth-provider"
import { AuditProvider } from "@/components/audit/audit-provider"
import { ApprovalProvider } from "@/components/auth/approval-provider"
import { OrdersProvider } from "@/components/orders/orders-provider"
import { InventoryProvider } from "@/components/inventory/inventory-provider"
import { SessionTimeout } from "@/components/auth/session-timeout"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider>
      <AuthProvider>
        <AuditProvider>
          <ApprovalProvider>
            <InventoryProvider>
              <OrdersProvider>
                {children}
                <NotificationPanel />
                <SessionTimeout />
              </OrdersProvider>
            </InventoryProvider>
          </ApprovalProvider>
        </AuditProvider>
      </AuthProvider>
    </NotificationsProvider>
  )
}
