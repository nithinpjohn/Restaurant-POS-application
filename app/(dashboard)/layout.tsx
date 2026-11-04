import { NotificationsProvider } from "@/components/notifications/notifications-provider"
import { NotificationPanel } from "@/components/notifications/notification-panel"
import { AuthProvider } from "@/components/auth/auth-provider"
import { AuditProvider } from "@/components/audit/audit-provider"
import { ApprovalProvider } from "@/components/auth/approval-provider"
import { OrdersProvider } from "@/components/orders/orders-provider"
import { InventoryProvider } from "@/components/inventory/inventory-provider"
import { ShiftProvider } from "@/components/shift/shift-provider"
import { FoodSafetyProvider } from "@/components/food-safety/food-safety-provider"
import { SyncProvider } from "@/components/sync/sync-provider"
import { OfflineBanner } from "@/components/sync/sync-status"
import { SessionTimeout } from "@/components/auth/session-timeout"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider>
      <AuthProvider>
        <AuditProvider>
          <ApprovalProvider>
            <SyncProvider>
            <InventoryProvider>
              <OrdersProvider>
                <ShiftProvider>
                  <FoodSafetyProvider>
                    <OfflineBanner />
                    {children}
                    <NotificationPanel />
                    <SessionTimeout />
                  </FoodSafetyProvider>
                </ShiftProvider>
              </OrdersProvider>
            </InventoryProvider>
            </SyncProvider>
          </ApprovalProvider>
        </AuditProvider>
      </AuthProvider>
    </NotificationsProvider>
  )
}
