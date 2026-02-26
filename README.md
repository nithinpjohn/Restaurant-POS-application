# 🍽️ Kans Resto - Restaurant POS System

A modern, elegant Point of Sale (POS) system built for restaurants. Streamline your operations with intuitive table management, order tracking, menu administration, and comprehensive reporting.

**Built by:** [Nithin](https://github.com) | **Company:** [Evalogical](https://evalogical.com)

---

## ✨ Features

### 📊 Dashboard
- Real-time sales overview with key metrics
- Quick actions for common tasks (New Order, Menu Management, Payments, Reports)
- Popular menu items tracking
- Sales performance summary
- Recent orders at a glance

### 🛒 Order Management
- Create new orders with intuitive menu selection
- Real-time order status tracking (Preparing → Ready → Served → Completed)
- View detailed order information
- Multiple order tabs (Active, Ready, Completed)
- Search and filter functionality
- Mark orders as ready, served, or complete with instant feedback

### 📋 Table Management
- Add and manage restaurant tables
- View table status (Available/Occupied)
- Seat guests with party size tracking
- View active orders for each table
- Clear tables when customers leave
- Delete tables with confirmation dialog

### 🍴 Menu Management
- View all menu items organized by category
- Add new menu items with pricing and descriptions
- Edit existing menu items
- Toggle item availability (available/unavailable)
- Search menu items by name or category
- Delete menu items with confirmation

### 💳 Payment Processing
- Process payments for completed orders
- Multiple payment method options
- Tip calculation
- Order total display
- Payment confirmation workflow

### 📈 Advanced Reporting
- Sales analytics with daily, weekly, and monthly views
- Menu item performance reports
- Staff performance tracking
- Customer insights and statistics
- Visual charts and data visualization
- Date range filtering with quick presets

### 👤 User Management
- Beautiful login page with email/password authentication
- Profile dropdown menu with user info
- Quick access to settings and account management
- Logout functionality

---

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS with custom design tokens
- **UI Components:** shadcn/ui
- **Typography:** Manrope font family
- **Charts:** Recharts for data visualization
- **State Management:** React hooks with client-side state
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js
- **API Routes:** Next.js Route Handlers
- **Data Storage:** Client-side state (Ready for database integration)

### Development
- **Language:** TypeScript
- **Package Manager:** npm
- **Build Tool:** Next.js built-in

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm installed
- Git installed on your machine

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/kans-resto.git
   cd kans-resto
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000/login
   ```

### Build for production
```bash
npm run build
npm start
```

---

## 💻 Usage

### Getting Started
1. Navigate to the login page at `/login`
2. Enter your credentials to access the system
3. Start managing your restaurant from the dashboard

### Creating a New Order
1. Click "New Order" from the quick actions
2. Browse menu items by category
3. Click items to add them to the cart
4. Adjust quantities using +/- buttons
5. Select a table or enter customer info
6. Click "Place Order"

### Managing Tables
1. Go to the Tables page
2. View all tables and their current status
3. Click "Seat Guests" on available tables
4. Enter guest count and server info
5. Click "View Order" to see what's being served
6. Click "Clear Table" when customers leave

### Processing Payments
1. Go to the Payment page
2. Select an order
3. Choose payment method
4. Add tip if applicable
5. Review total and confirm payment

### Viewing Reports
1. Navigate to the Reports section
2. Select your date range (Today, This Week, This Month, or custom)
3. Choose report type (Sales, Menu Items, Staff, Customers)
4. Analyze data with interactive charts
5. Export data if needed

---

## 🏗️ Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with font setup
│   ├── globals.css             # Global styles and design tokens
│   ├── page.tsx                # Dashboard
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── new-order/
│   │   └── page.tsx            # New order creation
│   ├── orders/
│   │   └── page.tsx            # Order management
│   ├── tables/
│   │   └── page.tsx            # Table management
│   ├── menu/
│   │   └── page.tsx            # Menu management
│   ├── payment/
│   │   └── page.tsx            # Payment processing
│   └── reports/
│       └── page.tsx            # Analytics and reporting
├── components/
│   ├── pos-header.tsx          # Main navigation header
│   ├── menu-edit-form.tsx      # Menu item form component
│   ├── ui/                     # shadcn/ui components
│   └── toaster.tsx             # Toast notifications
├── public/
│   └── images/                 # Food and background images
└── styles/                     # Additional styling files
```

---

## 🎨 Design Features

### Color Palette
- **Primary:** Dark text on light backgrounds
- **Accent:** Warm cream background (#F5F3F0)
- **Success:** Green for positive actions
- **Destructive:** Red for delete/cancel actions
- **Blue Gradient:** Used in charts for visual appeal

### Typography
- **Font:** Manrope (modern, clean, restaurant-friendly)
- **Responsive:** Scales beautifully across all devices

### UI/UX Highlights
- Card-based layout for easy scanning
- Status indicators with color coding
- Loading states and feedback messages
- Confirmation dialogs for critical actions
- Toast notifications for user feedback
- Mobile-responsive design

---

## 🔄 Workflow

### Order Workflow
```
Create Order → Items to Cart → Select Table → Place Order → 
Preparing → Mark Ready → Served → Complete Order → Archive
```

### Table Workflow
```
Available Table → Seat Guests → Occupied → View Order → 
Complete Order → Clear Table → Available
```

### Menu Management Workflow
```
View Menu → Add Item → Edit Details → Set Availability → 
Monitor Performance → Delete if Needed
```

---

## 🎯 Key Pages

| Page | Path | Purpose |
|------|------|---------|
| Login | `/login` | User authentication |
| Dashboard | `/` | Overview and quick actions |
| New Order | `/new-order` | Create and customize orders |
| Orders | `/orders` | Manage all orders |
| Tables | `/tables` | Manage restaurant tables |
| Menu | `/menu` | Edit menu items and availability |
| Payment | `/payment` | Process payments |
| Reports | `/reports` | View analytics and reports |

---

## 🚦 Status Indicators

### Order Status
- 🟡 **Preparing** - Order is being prepared
- 🟢 **Ready** - Order ready for serving
- 🔵 **Served** - Order served to customer
- ⚫ **Completed** - Order finished and paid

### Table Status
- 🟢 **Available** - Table is empty and ready
- 🔴 **Occupied** - Table has customers

### Menu Item Status
- ✅ **Available** - Item can be ordered
- ❌ **Unavailable** - Item is out of stock

---

## 📱 Responsive Design

The application is fully responsive and optimized for:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1280px+)

---

## 🔮 Future Enhancements

- [ ] Database integration (Supabase/Neon)
- [ ] Real authentication with JWT
- [ ] Inventory management system
- [ ] Kitchen display system (KDS)
- [ ] Customer loyalty program
- [ ] Staff management and scheduling
- [ ] Multi-location support
- [ ] Receipt printing
- [ ] Mobile app version
- [ ] Real-time order notifications
- [ ] AI-powered recommendations

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Nithin**
- GitHub: [@nithin](https://github.com)
- Email: nithin@evalogical.com

---

## 🏢 Company

**Evalogical**
- Website: [evalogical.com](https://evalogical.com)
- Email: info@evalogical.com

---

## 🆘 Support

For support, email support@evalogical.com or open an issue in the repository.

---

## 📞 Contact

Have questions or suggestions? Get in touch!
- **Email:** contact@evalogical.com
- **Website:** evalogical.com
- **GitHub Issues:** [Report a bug](https://github.com/yourusername/kans-resto/issues)

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI Components from [shadcn/ui](https://ui.shadcn.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Icons from [Lucide](https://lucide.dev/)

---

<div align="center">

### Made with ❤️ by Nithin at Evalogical

⭐ If you find this project helpful, please star it on GitHub!

</div>
