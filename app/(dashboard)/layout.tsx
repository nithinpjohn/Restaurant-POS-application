import { NotificationsProvider } from "@/components/notifications/notifications-provider"
import { AuditProvider } from "@/components/audit/audit-provider"
import { NotificationPanel } from "@/components/notifications/notification-panel"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider>
      <AuditProvider>
        {children}
        <NotificationPanel />
      </AuditProvider>
    </NotificationsProvider>
  )
}
