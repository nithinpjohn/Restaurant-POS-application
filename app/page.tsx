"use client"

import Link from "next/link"
import Image from "next/image"
import { PosHeader } from "@/components/pos-header"
import { PlusCircle, Utensils, CreditCard, FileText, ChevronRight, TrendingUp, TrendingDown } from "lucide-react"

const quickActions = [
  { href: "/new-order", icon: PlusCircle, label: "New Order", description: "Create a new customer order" },
  { href: "/menu", icon: Utensils, label: "Manage Menu", description: "Update your restaurant menu" },
  { href: "/payment", icon: CreditCard, label: "Process Payment", description: "Handle customer payments" },
  { href: "/reports", icon: FileText, label: "View Reports", description: "Check sales and inventory" },
]

const recentOrders = [
  { id: "ORD-001", table: "Table 5", items: 4, total: "$42.50", status: "Preparing" },
  { id: "ORD-002", table: "Table 3", items: 2, total: "$18.20", status: "Ready" },
  { id: "ORD-003", table: "Table 7", items: 6, total: "$65.75", status: "Preparing" },
  { id: "ORD-004", table: "Table 2", items: 3, total: "$32.40", status: "Served" },
  { id: "ORD-005", table: "Table 9", items: 5, total: "$54.30", status: "Preparing" },
]

const popularItems = [
  { name: "Margherita Pizza", category: "Main Course", orders: 42, revenue: "$629.58", image: "/images/margherita-pizza.jpg" },
  { name: "Caesar Salad", category: "Appetizer", orders: 38, revenue: "$341.62", image: "/images/caesar-salad.jpg" },
  { name: "Chocolate Cake", category: "Dessert", orders: 31, revenue: "$216.69", image: "/images/chocolate-cake.jpg" },
  { name: "Grilled Salmon", category: "Main Course", orders: 28, revenue: "$531.72", image: "/images/grilled-salmon.jpg" },
]

const salesMetrics = [
  { label: "Today's Sales", value: "$1,248.42", change: "+12.5%", up: true },
  { label: "Weekly Sales", value: "$8,489.75", change: "+5.2%", up: true },
  { label: "Monthly Sales", value: "$32,758.32", change: "+8.7%", up: true },
  { label: "Avg Order Value", value: "$42.50", change: "+2.3%", up: true },
]

const stats = [
  { label: "Total Revenue", value: "$1,248.42", sub: "+12.5% from yesterday" },
  { label: "Active Orders", value: "8", sub: "+2 in the last hour" },
  { label: "Customers", value: "24", sub: "+4 from last hour" },
  { label: "Avg Order Time", value: "18 min", sub: "-2 min from yesterday" },
]

export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader />

      <main className="flex-1 p-6 space-y-6">
        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className="block group">
                <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium text-sm text-foreground">{action.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sales Overview */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Sales Overview</h3>
            <div className="space-y-4">
              {salesMetrics.map((metric, i) => (
                <div key={i} className={`flex items-center justify-between ${i < salesMetrics.length - 1 ? "pb-4 border-b border-border" : ""}`}>
                  <div>
                    <p className="text-sm font-medium text-foreground">{metric.label}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {metric.up ? (
                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span className={`text-xs ${metric.up ? "text-emerald-600" : "text-destructive"}`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-foreground">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Recent Orders</h3>
              <Link href="/orders" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{order.table}</p>
                    <p className="text-xs text-muted-foreground">{order.items} items - {order.total}</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      order.status === "Ready"
                        ? "bg-emerald-100 text-emerald-700"
                        : order.status === "Preparing"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Menu Items */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Popular Items</h3>
              <Link href="/menu" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-4">
              {popularItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-secondary shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-foreground">{item.orders} orders</p>
                    <p className="text-xs text-muted-foreground">{item.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
