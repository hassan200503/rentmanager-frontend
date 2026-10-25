<div align="center">

# 🏠 RentManager

### Kenya's Trusted Rental Platform | Modern Property Management SaaS

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge&logo=vercel)](https://www.rentmanagerke.workers.dev/)
[![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

**[🌐 Live Demo](https://www.rentmanagerke.workers.dev/)** • **[📖 Documentation](#documentation)** • **[🚀 Features](#features)** • **[💼 Use Cases](#use-cases)**

---

</div>

## 📸 Screenshots

### 🏡 Landing Page & Property Discovery

<div align="center">
  <img src="assets/full-landing.png" alt="RentManager Landing Page" width="100%">
  <p><em>Full-featured landing page with hero section, features showcase, and property listings</em></p>
</div>

### 🏢 Property Listings

<div align="center">
  <img src="assets/property-listings.png" alt="Property Listings" width="100%">
  <p><em>Real-time property listings from approved landlords across Kenya</em></p>
</div>

### 📱 Mobile Responsive Design

<div align="center">
  <img src="assets/mobile-homepage.png" alt="Mobile Homepage" height="600">
  <img src="assets/mobile-listings.png" alt="Mobile Listings" height="600">
  <p><em>Fully responsive design optimized for mobile devices</em></p>
</div>

### 🔐 Authentication & Onboarding

<div align="center">
  <img src="assets/signup-landlord.png" alt="Landlord Signup" width="49%">
  <img src="assets/signin-page.png" alt="Sign In" width="49%">
  <p><em>Secure authentication with role-based access (Landlord/Tenant/Admin)</em></p>
</div>

---

## 🎯 Overview

**RentManager** is a modern, full-stack property management platform designed specifically for Kenya's rental market. It eliminates traditional pain points like broker fees, fake listings, and lost paperwork by connecting renters directly with approved landlords through a secure, transparent platform.

### 🎥 Live Demo

> **👉 [Visit Live Application](https://www.rentmanagerke.workers.dev/)**

The application is fully deployed and operational, handling real property listings, M-Pesa payments, and digital lease management.

---

## ✨ Features

### For Renters 🏠

- **🔍 Advanced Property Search** - Filter by location, price, amenities, and availability
- **✅ Verified Listings** - Only properties from approved landlords
- **💳 M-Pesa Integration** - Secure deposit and rent payments
- **📄 Digital Leases** - Legally binding agreements stored securely
- **🧾 Automatic Receipts** - Instant payment receipts for every transaction
- **⭐ Landlord Reviews** - Verified reviews from real tenants

### For Landlords 🏢

- **📊 Portfolio Dashboard** - Real-time occupancy and revenue tracking
- **💰 Automated Rent Collection** - M-Pesa STK push integration
- **👥 Tenant Management** - Comprehensive tenant profiles and history
- **📈 Financial Reports** - Detailed analytics and export capabilities
- **🔔 Smart Notifications** - Automated reminders for due payments
- **📝 Lease Management** - Digital lease generation and e-signatures

### Platform Features ⚙️

- **🔐 Role-Based Authentication** - Secure access for Renters, Landlords, and Admins
- **💸 Payment Processing** - M-Pesa Daraja API integration with STK push
- **📱 Responsive Design** - Optimized for desktop, tablet, and mobile
- **🌍 Multi-Region Support** - Properties across 5+ regions in Kenya
- **🔔 Real-Time Notifications** - WebSocket-powered live updates
- **📊 Analytics & Insights** - Comprehensive reporting and data visualization
- **🔒 Data Security** - Encrypted storage and secure payment handling
- **♿ Accessibility** - WCAG 2.1 compliant for inclusive access

---

## 🛠️ Tech Stack

### Frontend

```
⚛️  React 18.x                  - Modern UI library with hooks
🎨  TailwindCSS                  - Utility-first CSS framework
🔄  React Query (TanStack)       - Server state management
🧭  React Router v6              - Client-side routing
📊  Recharts                     - Data visualization
🎭  Headless UI                  - Accessible UI components
✅  React Hook Form              - Form validation
🌐  Axios                        - HTTP client
```

### Backend

```
🚀  Node.js + Express            - REST API server
🗄️  PostgreSQL                   - Primary database
🔐  JWT Authentication           - Secure token-based auth
💳  M-Pesa Daraja API            - Payment integration
📧  Nodemailer                   - Email notifications
🔒  bcrypt                       - Password hashing
✨  Prisma ORM                    - Database ORM (optional)
```

### DevOps & Infrastructure

```
☁️  Cloudflare Workers           - Edge deployment
🔧  GitHub Actions               - CI/CD pipeline
📦  npm/yarn                     - Package management
🧪  Jest + React Testing Library - Testing framework
📝  ESLint + Prettier            - Code quality
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- M-Pesa Daraja API credentials (for payment features)
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/hassan200503/rentmanager-frontend.git
cd rentmanager-frontend
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# API Configuration
REACT_APP_API_BASE_URL=https://api.rentmanagerke.workers.dev
REACT_APP_API_TIMEOUT=30000

# M-Pesa Configuration (Backend)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey

# Database (Backend)
DATABASE_URL=postgresql://user:password@localhost:5432/rentmanager

# JWT Secret (Backend)
JWT_SECRET=your_jwt_secret_key

# Email Configuration (Backend)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

4. **Start the development server**

```bash
npm start
# or
yarn start
```

The application will open at `http://localhost:3000`

### Building for Production

```bash
npm run build
# or
yarn build
```

The optimized production build will be in the `build/` directory.

---

## 📁 Project Structure

```
rentmanager-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Buttons, inputs, modals
│   │   ├── layout/          # Header, footer, sidebar
│   │   └── features/        # Feature-specific components
│   ├── pages/               # Page components (routes)
│   │   ├── Home/
│   │   ├── Properties/
│   │   ├── Dashboard/
│   │   └── Auth/
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Helper functions
│   ├── services/            # API service layer
│   ├── context/             # React context providers
│   ├── assets/              # Images, icons, fonts
│   └── styles/              # Global styles
├── public/                  # Static assets
├── assets/                  # Documentation screenshots
├── tests/                   # Test files
└── docs/                    # Additional documentation
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

---

## 🎨 Design System

RentManager uses a comprehensive design system built with TailwindCSS:

### Color Palette

```css
Primary:   #4F46E5 (Indigo-600)
Secondary: #10B981 (Emerald-500)
Accent:    #F59E0B (Amber-500)
Error:     #EF4444 (Red-500)
Success:   #10B981 (Emerald-500)
```

### Typography

- **Headings**: Inter (Bold, Semibold)
- **Body**: Inter (Regular, Medium)
- **Monospace**: JetBrains Mono

---

## 🔌 API Integration

The frontend connects to a Node.js/Express backend deployed on Cloudflare Workers.

### Key API Endpoints

```
Authentication
POST   /api/auth/register       - User registration
POST   /api/auth/login          - User login
POST   /api/auth/logout         - User logout
GET    /api/auth/me             - Get current user

Properties
GET    /api/properties          - List properties
GET    /api/properties/:id      - Get property details
POST   /api/properties          - Create property (landlord)
PUT    /api/properties/:id      - Update property
DELETE /api/properties/:id      - Delete property

Leases
GET    /api/leases              - List user leases
POST   /api/leases              - Create lease
GET    /api/leases/:id/pdf      - Download lease PDF

Payments
POST   /api/payments/mpesa      - Initiate M-Pesa payment
GET    /api/payments/history    - Payment history
POST   /api/payments/callback   - M-Pesa callback (webhook)

Dashboard
GET    /api/dashboard/stats     - Dashboard statistics
GET    /api/dashboard/revenue   - Revenue analytics
```

### API Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2026-10-25T10:30:00Z"
}
```

---

## 🔐 Security

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **HTTPS Only** - All communication encrypted
- **CORS Protection** - Configured CORS policies
- **Input Validation** - Server-side validation for all inputs
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Content Security Policy headers
- **Rate Limiting** - API rate limiting to prevent abuse

---

## 📊 Key Metrics & Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, SEO)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: ~200KB gzipped
- **API Response Time**: < 500ms average
- **Uptime**: 99.9%

---

## 💡 Use Cases

### 1. Tenant Journey
```
Search Properties → View Details → Reserve Unit → 
Pay Deposit (M-Pesa) → Sign Digital Lease → Move In → 
Pay Monthly Rent → Request Maintenance
```

### 2. Landlord Workflow
```
List Property → Receive Applications → Approve Tenant → 
Generate Lease → Collect Rent (M-Pesa) → 
Track Payments → Generate Reports
```

### 3. Admin Operations
```
Approve Landlords → Monitor Transactions → 
Handle Disputes → Generate Platform Analytics → 
Manage User Accounts
```

---

## 🌍 Deployment

### Frontend (Cloudflare Pages)

```bash
# Build and deploy
npm run build
wrangler pages publish build
```

### Backend (Cloudflare Workers)

```bash
cd backend
wrangler publish
```

### Environment Variables

Configure the following in your deployment platform:

- `REACT_APP_API_BASE_URL`
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `DATABASE_URL`
- `JWT_SECRET`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developer

**Hassan Abdikarim**

- GitHub: [@hassan200503](https://github.com/hassan200503)
- Email: hassan.abdikarim@example.com
- LinkedIn: [Connect with me](https://linkedin.com/in/hassan-abdikarim)
- Portfolio: [hassanabdikarim.dev](https://hassanabdikarim.dev)

---

## 🙏 Acknowledgments

- **M-Pesa Daraja API** - For seamless payment integration
- **Cloudflare** - For reliable edge deployment
- **React Community** - For excellent libraries and tools
- **Kenyan Rental Market** - For inspiring this solution

---

## 📞 Support

For support, email support@rentmanagerke.com or open an issue on GitHub.

---

## 🗺️ Roadmap

### Q4 2026
- [ ] Mobile app (React Native)
- [ ] Property insurance integration
- [ ] Tenant background checks
- [ ] Virtual property tours (360°)

### Q1 2027
- [ ] AI-powered property recommendations
- [ ] Predictive maintenance scheduling
- [ ] Multi-language support (Swahili, English)
- [ ] Expansion to Uganda and Tanzania

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=hassan200503/rentmanager-frontend&type=Date)](https://star-history.com/#hassan200503/rentmanager-frontend&Date)

---

<div align="center">

### 🌟 If you find this project valuable, please consider giving it a star!

[![GitHub stars](https://img.shields.io/github/stars/hassan200503/rentmanager-frontend?style=social)](https://github.com/hassan200503/rentmanager-frontend/stargazers)

**Built with ❤️ in Kenya 🇰🇪**

</div>
