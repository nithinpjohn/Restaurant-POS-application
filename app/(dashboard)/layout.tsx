import { NotificationsProvider } from "@/components/notifications/notifications-provider"
import { NotificationPanel } from "@/components/notifications/notification-panel"
import { AuthProvider } from "@/components/auth/auth-provider"
import { AuditProvider } from "@/components/audit/audit-provider"
import { ApprovalProvider } from "@/components/auth/approval-provider"
import { SessionTimeout } from "@/components/auth/session-timeout"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider>
      <AuthProvider>
        <AuditProvider>
          <ApprovalProvider>
            {children}
            <NotificationPanel />
            <SessionTimeout />
          </ApprovalProvider>
        </AuditProvider>
      </AuthProvider>
    </NotificationsProvider>
  )
}
