"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, ChevronDown, TrendingUp, TrendingDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PosHeader } from "@/components/pos-header"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Area, AreaChart,
} from "recharts"

const dailySalesData = [
  { hour: "6AM", sales: 120 }, { hour: "8AM", sales: 240 }, { hour: "10AM", sales: 320 }, { hour: "12PM", sales: 650 },
  { hour: "2PM", sales: 450 }, { hour: "4PM", sales: 280 }, { hour: "6PM", sales: 480 }, { hour: "8PM", sales: 580 }, { hour: "10PM", sales: 250 },
]

const weeklySalesData = [
  { day: "Mon", sales: 2450, orders: 32 }, { day: "Tue", sales: 2100, orders: 28 }, { day: "Wed", sales: 2800, orders: 36 },
  { day: "Thu", sales: 3200, orders: 42 }, { day: "Fri", sales: 4100, orders: 52 }, { day: "Sat", sales: 4800, orders: 58 }, { day: "Sun", sales: 3600, orders: 46 },
]

const paymentMethodData = [
  { name: "Credit Card", value: 67.7 }, { name: "Cash", value: 17.3 }, { name: "Mobile", value: 10.0 }, { name: "Gift Card", value: 5.0 },
]
const COLORS = ["#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"]

const topSellingItems = [
  { name: "Margherita Pizza", category: "Main Course", quantity: 42, revenue: 629.58 },
  { name: "Caesar Salad", category: "Appetizer", quantity: 38, revenue: 341.62 },
  { name: "Chocolate Cake", category: "Dessert", quantity: 31, revenue: 216.69 },
  { name: "Grilled Salmon", category: "Main Course", quantity: 28, revenue: 531.72 },
  { name: "Garlic Bread", category: "Appetizer", quantity: 25, revenue: 124.75 },
]

const staffData = [
  { name: "Sarah", orders: 142, sales: "$5,120", tips: "$1,024", rating: 4.8 },
  { name: "Lisa", orders: 132, sales: "$4,860", tips: "$972", rating: 4.7 },
  { name: "John", orders: 124, sales: "$4,250", tips: "$850", rating: 4.5 },
  { name: "David", orders: 118, sales: "$4,320", tips: "$864", rating: 4.6 },
  { name: "Mike", orders: 98, sales: "$3,680", tips: "$736", rating: 4.3 },
]

const salesKPIs = [
  { label: "Total Sales", value: "$1,248.42", change: "+12.5%", up: true },
  { label: "Orders", value: "42", change: "+8.2%", up: true },
  { label: "Avg Order", value: "$29.72", change: "+3.1%", up: true },
  { label: "Customers", value: "36", change: "+5.6%", up: true },
]

const reportTabs = ["Sales", "Menu Items", "Staff", "Customers"]

const tooltipStyle = {
  borderRadius: 12,
  border: "none",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  fontSize: 12,
  padding: "8px 12px",
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("today")
  const [activeTab, setActiveTab] = useState("Sales")

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PosHeader />

      <main className="flex-1 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h1 className="text-xl font-semibold text-foreground">Reports</h1>
          <div className="flex items-center gap-3">
            <Select defaultValue={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px] rounded-xl bg-secondary border-0 text-sm">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2 text-sm">
                  <Download className="h-4 w-4" /> Export <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40" align="end">
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" className="justify-start text-sm">PDF</Button>
                  <Button variant="ghost" size="sm" className="justify-start text-sm">CSV</Button>
                  <Button variant="ghost" size="sm" className="justify-start text-sm">Excel</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {reportTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                activeTab === tab
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-secondary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Sales Tab */}
        {activeTab === "Sales" && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {salesKPIs.map((kpi) => (
                <div key={kpi.label} className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {kpi.up ? <TrendingUp className="h-3 w-3 text-emerald-600" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                    <span className={`text-xs ${kpi.up ? "text-emerald-600" : "text-destructive"}`}>{kpi.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Bar Chart - Sales by Hour */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-1">Sales by Hour</h3>
                <p className="text-xs text-muted-foreground mb-4">Hourly breakdown for the selected period</p>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailySalesData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#93C5FD" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value: number) => [`$${value}`, "Sales"]} contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--secondary))" }} />
                      <Bar dataKey="sales" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line/Area Chart - Weekly Trend */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-foreground mb-1">Weekly Trend</h3>
                <p className="text-xs text-muted-foreground mb-4">Sales performance over the past week</p>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklySalesData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#93C5FD" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value: number) => [`$${value}`, "Sales"]} contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2.5} fill="url(#lineGradient)" dot={{ fill: "#3B82F6", strokeWidth: 2, stroke: "#fff", r: 4 }} activeDot={{ fill: "#3B82F6", strokeWidth: 2, stroke: "#fff", r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Payment Methods</h3>
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="h-[200px] w-[200px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentMethodData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" strokeWidth={0}>
                        {paymentMethodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value}%`} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 flex-1">
                  {paymentMethodData.map((method, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-sm text-foreground">{method.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{method.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items Tab */}
        {activeTab === "Menu Items" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Top Selling Items</h3>
              <div className="space-y-0">
                {topSellingItems.map((item, i) => (
                  <div key={i} className={cn("flex items-center justify-between py-3", i < topSellingItems.length - 1 && "border-b border-border")}>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600">{i + 1}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{item.quantity} sold</p>
                      <p className="text-xs text-muted-foreground">${item.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Staff Tab */}
        {activeTab === "Staff" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Staff Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Name</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Orders</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Sales</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Tips</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffData.map((staff, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="py-3 px-2 font-medium text-foreground">{staff.name}</td>
                        <td className="py-3 px-2 text-right text-foreground">{staff.orders}</td>
                        <td className="py-3 px-2 text-right text-foreground">{staff.sales}</td>
                        <td className="py-3 px-2 text-right text-foreground">{staff.tips}</td>
                        <td className="py-3 px-2 text-right">
                          <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">{staff.rating}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === "Customers" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Customers", value: "1,248", change: "+12.5%", up: true },
                { label: "New Customers", value: "86", change: "+18.2%", up: true },
                { label: "Returning", value: "72%", change: "+3.1%", up: true },
                { label: "Avg Visit Freq", value: "2.4/mo", change: "-1.2%", up: false },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {kpi.up ? <TrendingUp className="h-3 w-3 text-emerald-600" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                    <span className={`text-xs ${kpi.up ? "text-emerald-600" : "text-destructive"}`}>{kpi.change}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Loyalty Program</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Active Members", value: "342" },
                  { label: "Points Issued", value: "24,580" },
                  { label: "Points Redeemed", value: "12,340" },
                  { label: "Revenue from Members", value: "$18,420" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-secondary rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
