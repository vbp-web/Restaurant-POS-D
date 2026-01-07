# 🍽️ Restaurant POS - Backend API

Backend API for the Restaurant POS Desktop Application - A comprehensive multi-tenant SaaS solution for restaurant management.

## 🚀 Features

- **Multi-tenant Architecture** - Support multiple restaurants with isolated data
- **Authentication & Authorization** - JWT-based secure authentication
- **Root Admin Dashboard** - Centralized management of all restaurants
- **Subscription Management** - Razorpay integration for payment processing
- **Order Management** - Real-time order tracking with Socket.IO
- **Table Management** - Dynamic table allocation and status tracking
- **Staff Management** - Role-based access control
- **Menu Management** - Complete menu CRUD with image support
- **Invoice Generation** - PDF invoices with QR codes
- **Kitchen Display System** - Real-time order updates for kitchen staff

## 📋 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Payment:** Razorpay
- **Real-time:** Socket.IO
- **File Upload:** Multer
- **PDF Generation:** PDFKit
- **Validation:** Express Validator

## 🛠️ Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Razorpay account (for payments)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/vbp-web/Restaurant-POS.git
   cd Restaurant-POS/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ROOT_ADMIN_EMAIL=admin@yourdomain.com
   ROOT_ADMIN_PASSWORD=your_admin_password
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   
   # Mock mode (no database required)
   npm run mock
   ```

5. **Verify installation**
   - Open browser: `http://localhost:5000/api/health`
   - Should see: `{"status":"OK","message":"Server is running"}`

## 🌐 Deployment to Render

### Quick Deploy

1. **Push to GitHub** (this repository)

2. **Create Render Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - New + → Web Service
   - Connect this repository
   - Render will auto-detect settings from `render.yaml`

3. **Add Environment Variables**
   Required variables:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - `RAZORPAY_KEY_ID` - From Razorpay dashboard
   - `RAZORPAY_KEY_SECRET` - From Razorpay dashboard
   - `ROOT_ADMIN_EMAIL` - Your admin email
   - `ROOT_ADMIN_PASSWORD` - Strong password

4. **Deploy!**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your API will be live at: `https://your-app.onrender.com`

### Detailed Deployment Guide

See [RENDER_DEPLOYMENT_GUIDE.md](../RENDER_DEPLOYMENT_GUIDE.md) for step-by-step instructions.

## 📡 API Endpoints

### Public Routes
- `GET /api/health` - Health check
- `POST /api/public/register` - Register new restaurant
- `POST /api/public/login` - Restaurant login

### Root Admin Routes
- `POST /api/root/login` - Root admin login
- `GET /api/root/restaurants` - List all restaurants
- `GET /api/root/analytics` - System analytics
- `PUT /api/root/restaurants/:id/subscription` - Update subscription

### Business Routes (Authenticated)
- `GET /api/business/menu` - Get menu items
- `POST /api/business/menu` - Create menu item
- `PUT /api/business/menu/:id` - Update menu item
- `DELETE /api/business/menu/:id` - Delete menu item

### Order Routes
- `GET /api/business/orders` - Get all orders
- `POST /api/business/orders` - Create new order
- `PUT /api/business/orders/:id` - Update order status

### Table Routes
- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create table
- `PUT /api/tables/:id` - Update table

### Staff Routes
- `GET /api/staff` - Get all staff
- `POST /api/staff` - Create staff member
- `PUT /api/staff/:id` - Update staff

### Subscription Routes
- `GET /api/subscriptions/plans` - Get subscription plans
- `POST /api/subscriptions/upgrade` - Upgrade subscription
- `POST /api/subscriptions/verify-payment` - Verify Razorpay payment

### Invoice Routes
- `GET /api/invoices/:orderId` - Get invoice
- `POST /api/invoices/generate` - Generate invoice PDF

## 🔒 Security

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **CORS Protection** - Configured allowed origins
- **Rate Limiting** - Prevent abuse
- **Input Validation** - Express Validator
- **Environment Variables** - Sensitive data protection

## 📁 Project Structure

```
backend/
├── config/           # Configuration files
│   └── database.js   # MongoDB connection
├── controllers/      # Route controllers
│   ├── authController.js
│   ├── menuController.js
│   ├── orderController.js
│   └── ...
├── middleware/       # Custom middleware
│   ├── auth.js       # JWT verification
│   ├── rootAuth.js   # Root admin auth
│   └── ...
├── models/          # Mongoose models
│   ├── Restaurant.js
│   ├── Order.js
│   ├── MenuItem.js
│   └── ...
├── routes/          # API routes
│   ├── publicRoutes.js
│   ├── businessRoutes.js
│   ├── rootRoutes.js
│   └── ...
├── services/        # Business logic
│   ├── paymentService.js
│   ├── invoiceService.js
│   └── ...
├── utils/           # Utility functions
│   └── initRootAdmin.js
├── .env.example     # Environment template
├── .gitignore       # Git ignore rules
├── package.json     # Dependencies
├── render.yaml      # Render config
└── server.js        # Entry point
```

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test registration
curl -X POST http://localhost:5000/api/public/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Restaurant","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:5000/api/public/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📊 Database Schema

### Restaurant
- Business details (name, email, phone)
- Subscription information
- Owner credentials
- Settings and preferences

### Order
- Order items with quantities
- Customer information
- Table assignment
- Payment status
- Timestamps

### MenuItem
- Name, description, price
- Category, image
- Availability status
- Restaurant reference

### Table
- Table number, capacity
- Current status (available/occupied)
- Current order reference

### Staff
- Name, role, contact
- Credentials
- Restaurant reference

## 🔧 Environment Variables

See `.env.production.example` for complete list of environment variables.

### Required
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Token signing key
- `RAZORPAY_KEY_ID` - Payment gateway
- `RAZORPAY_KEY_SECRET` - Payment secret
- `ROOT_ADMIN_EMAIL` - Admin email
- `ROOT_ADMIN_PASSWORD` - Admin password

### Optional
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MAX_FILE_SIZE` - Upload limit
- `RATE_LIMIT_MAX` - Request limit
- `LOG_LEVEL` - Logging level

## 🤝 Contributing

This is a private project. For issues or suggestions, please contact the repository owner.

## 📄 License

Proprietary - All rights reserved

## 📞 Support

For support, email: admin@yourdomain.com

## 🎯 Roadmap

- [ ] Email notifications
- [ ] SMS alerts
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Mobile app API
- [ ] Inventory management
- [ ] Customer loyalty program

## 🙏 Acknowledgments

Built with ❤️ for restaurant owners who deserve better management tools.

---

**Made with Node.js, Express, and MongoDB**
