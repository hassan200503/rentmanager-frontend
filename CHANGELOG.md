# Changelog

All notable changes to RentManager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Mobile app (React Native)
- AI-powered property recommendations
- Virtual property tours (360°)
- Multi-language support (Swahili, English)

---

## [2.1.0] - 2026-10-25

### Added
- **Production-Grade README** with real UI screenshots
  - 12 high-quality screenshots from live application
  - Comprehensive documentation sections
  - Professional badges and shields
  - Live demo links and metrics
- **Screenshot Capture Scripts** for automated UI documentation
- **Contributing Guidelines** (CONTRIBUTING.md)
- **Changelog** (CHANGELOG.md)
- **Mobile Responsive Views** optimized for phones and tablets
- **Enhanced Property Listings** page with better filters
- **FAQ Section** with accordion UI
- **Pricing Section** with tiered plans

### Changed
- Updated landing page hero section with improved CTAs
- Improved authentication flow with role-based redirect
- Enhanced mobile navigation menu
- Optimized image loading with lazy loading

### Fixed
- Fixed mobile menu z-index overlay issue
- Resolved property card alignment on small screens
- Fixed M-Pesa callback timeout handling

---

## [2.0.0] - 2026-09-15

### Added
- **M-Pesa STK Push Integration** for automated rent collection
- **Digital Lease Generation** with e-signature capability
- **Landlord Dashboard** with analytics and revenue tracking
- **Tenant Portal** with payment history and maintenance requests
- **Property Management System** for landlords
- **Advanced Search Filters** (price range, location, amenities)
- **Real-Time Notifications** using WebSockets
- **Email Notifications** for important events
- **PDF Receipt Generation** for all payments
- **Admin Panel** for platform management

### Changed
- **Complete UI Redesign** with TailwindCSS
- **Migrated to React 18** with concurrent features
- **API Architecture Overhaul** with RESTful design
- **Database Schema Optimization** for better performance
- **Authentication System Upgrade** with JWT refresh tokens

### Security
- Implemented JWT token rotation
- Added rate limiting on auth endpoints
- Enhanced password requirements
- Enabled CORS protection
- Added Content Security Policy headers

---

## [1.5.0] - 2026-07-20

### Added
- **Property Listing Feature** for landlords
- **User Profiles** with avatar upload
- **Review System** for landlords (verified tenants only)
- **Payment History** page for tenants
- **Basic Dashboard** for landlords

### Changed
- Improved property card design
- Enhanced search functionality
- Updated color scheme to brand colors

### Fixed
- Fixed image upload file size validation
- Resolved authentication redirect loops
- Fixed mobile responsiveness issues

---

## [1.0.0] - 2026-05-01

### Added
- **Initial Release** 🎉
- User authentication (register, login, logout)
- Property search and browsing
- Property detail pages
- Basic tenant and landlord roles
- Cloudflare Workers deployment
- PostgreSQL database integration

### Features
- Browse properties by location
- View property details and images
- User registration and login
- Basic tenant dashboard
- Landlord property listing

---

## Version History Summary

| Version | Release Date | Key Features |
|---------|--------------|--------------|
| 2.1.0   | 2026-10-25  | Production README, Screenshots, Docs |
| 2.0.0   | 2026-09-15  | M-Pesa, Digital Leases, Full Dashboard |
| 1.5.0   | 2026-07-20  | Reviews, Profiles, Payment History |
| 1.0.0   | 2026-05-01  | Initial Release, Core Features |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute to this project.

## Links

- [Live Demo](https://www.rentmanagerke.workers.dev/)
- [GitHub Repository](https://github.com/hassan200503/rentmanager-frontend)
- [Issue Tracker](https://github.com/hassan200503/rentmanager-frontend/issues)

---

[Unreleased]: https://github.com/hassan200503/rentmanager-frontend/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/hassan200503/rentmanager-frontend/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/hassan200503/rentmanager-frontend/compare/v1.5.0...v2.0.0
[1.5.0]: https://github.com/hassan200503/rentmanager-frontend/compare/v1.0.0...v1.5.0
[1.0.0]: https://github.com/hassan200503/rentmanager-frontend/releases/tag/v1.0.0
