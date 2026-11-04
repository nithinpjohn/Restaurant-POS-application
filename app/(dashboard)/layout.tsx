import { NotificationsProvider } from "@/components/notifications/notifications-provider"
import { NotificationPanel } from "@/components/notifications/notification-panel"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider>
      {children}
      <NotificationPanel />
    </NotificationsProvider>
  )
}
