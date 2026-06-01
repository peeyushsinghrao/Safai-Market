
# Safai Market — Anupurna Traders
# COMPLETE ENTERPRISE PRD V7 (Single File)

## Document Information
Version: V7
Status: Implementation Ready
Architecture: React + Vite + Tailwind + Supabase + PWA

---

# 1. Executive Summary
Safai Market is a mobile-first, offline-capable, multi-shop retail management platform designed for Indian cleaning, utensil and household product stores. The platform prioritizes simplicity while supporting enterprise-grade inventory, billing, barcode, reporting, customer, supplier and profit management.

# 2. Product Vision
Create the easiest shop management app for non-technical shop owners.

# 3. Core Principles
- Mobile First
- Simple UI
- Offline First
- Multi-Shop Ready
- Fast Billing
- Secure Data Isolation

# 4. User Personas
## Shop Owner
Sales, profit, inventory and reports.
## Family Member
Billing and inventory.
## Staff
Fast billing and stock updates.

# 5. Multi-Shop Architecture
Every shop receives a unique shop_id.
All products, bills, customers, suppliers, expenses and reports are isolated.

# 6. Technology Stack
Frontend: React + Vite + Tailwind
Backend: Supabase
Offline: IndexedDB + Sync Queue
Deployment: PWA

# 7. Database Design
Tables:
- shops
- products
- customers
- suppliers
- bills
- bill_items
- expenses
- settings
- barcode_history
- devices
- print_logs
- activity_logs
- sync_logs

# 8. Security
- Row Level Security
- shop_id filtering
- Audit logs
- Activity tracking

# 9. Navigation
Home
Products
Billing
Customers
More

# 10. Home Dashboard
- Today's Sales
- Pending Udhaar
- Low Stock
- Quick Actions
- Recent Activity

# 11. Product Management
Features:
- Add Product
- Edit Product
- Delete Product
- Duplicate Product
- Category Filtering
- Product Images
- Product Search

# 12. Inventory Management
- Stock In
- Stock Out
- Adjustments
- Low Stock Alerts
- Fast Moving Products

# 13. Billing System
Workflow:
Search Product -> Cart -> Checkout -> Payment -> Create Bill

Payment Types:
- Cash
- UPI
- Udhaar

Actions:
- Download PDF
- Share
- Print
- Reprint

# 14. Cart Engine
- Unlimited Products
- Quantity Controls
- Discounts
- Cart Reset After Bill

# 15. Customer & Udhaar
- Customer Profiles
- Outstanding Balance
- Partial Payments
- Payment History

# 16. Supplier Management
- Suppliers
- Purchases
- Restock Workflow
- Pending Payments

# 17. Expense Tracking
- Rent
- Salary
- Electricity
- Transport
- Miscellaneous

# 18. Profit Analytics
- Buy Price
- Sell Price
- Margin %
- Profit Reports

# 19. Barcode System
- Manual Barcode
- Camera Scan
- Bluetooth Scanner
- USB Scanner
- Bulk Scan Mode
- Barcode History
- Internal Barcode Generator

# 20. Printer System
- PDF Export
- Browser Print
- Future Bluetooth Printing
- Future WiFi Printing

# 21. Device Center
More → Devices
- Barcode Devices
- Printers
- Connected Devices

# 22. Offline First Architecture
- IndexedDB
- Local Cache
- Sync Queue
- Retry Logic

# 23. Sync Engine
- Pending Operations
- Retry Mechanism
- Conflict Resolution

# 24. Responsive Design
Mobile First
Tablet Optimized
Desktop Optimized

Desktop Billing:
Products | Cart

# 25. Reports
- Daily Sales
- Monthly Sales
- Expenses
- Profit
- Udhaar
- Low Stock

# 26. Daily Closing
- Sales
- Cash
- UPI
- Udhaar
- Expenses
- Profit

# 27. Testing Strategy
- Billing Tests
- Inventory Tests
- Offline Tests
- Barcode Tests
- Printer Tests

# 28. Deployment Strategy
- PWA Installation
- Netlify/Vercel
- Supabase Backend

# 29. Future Roadmap
Phase 1: Billing + Inventory
Phase 2: Barcode + Reports
Phase 3: Printers + Analytics
Phase 4: AI Insights + Multi-Branch

# 30. Claude Implementation Rules
- Audit first
- Fix broken features before adding new ones
- Generate migrations
- Generate RLS
- Generate architecture docs
- Keep UI extremely simple
- Production-ready code only

# Final Goal
Build a production-ready, multi-shop, mobile-first store management platform that feels extremely simple to use while providing enterprise-grade capabilities.
