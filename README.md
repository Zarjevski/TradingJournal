# Trading Journal

A comprehensive trading journal application built with Next.js 16 to help traders review their trades, learn from failures, and remember important lessons and rules. Features real-time collaboration, video chat, and advanced analytics.

## Overview

To become a successful trader, you must review your trades. This application helps you:
- Track and analyze your trading performance
- Document trading rules and strategies
- Monitor multiple exchanges
- Learn from both successes and failures
- Maintain a detailed trading history
- Collaborate with team members
- Share trades and insights
- Communicate via real-time chat and video

## Features

### Core Features
- 🔐 **Authentication** - Secure user authentication with NextAuth.js
- 📊 **Trade Management** - Create, update, delete, and view trades with detailed information
- 💱 **Exchange Tracking** - Manage multiple exchanges and their balances
- 📝 **Trading Rules** - Document and manage your trading rules
- 📈 **Analytics v2** - Advanced trading statistics and performance metrics with filters
- 🎨 **Modern UI** - Beautiful glass-morphism design with dark/light mode
- 🔒 **Type Safety** - Full TypeScript support with comprehensive type definitions
- ⚡ **Performance** - Optimized with Next.js 16 and Turbopack

### Team Collaboration
- 👥 **Teams** - Create and manage trading teams
- 💬 **Team Chat** - Real-time messaging with team members
- 📤 **Trade Sharing** - Share trades with team members
- 🎥 **Video Rooms** - WebRTC video chat with screen sharing
- 👤 **Member Management** - Invite, manage roles, and remove members
- 🔔 **Team Invites** - Email-based invitation system

### Advanced Features
- 📸 **Image Uploads** - Upload trade screenshots, profile pictures, and team images
- 📊 **Charts & Visualizations** - Interactive charts for performance analysis
- 🔍 **Advanced Filtering** - Filter trades by date, exchange, status, symbol, and more
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🌓 **Theme Support** - Beautiful dark and light themes with smooth transitions
- ⏰ **Market Clocks** - Real-time market clocks for different timezones
- 📈 **Fear & Greed Index** - Market sentiment indicator
- 🔥 **Trending Assets** - Real-time trending cryptocurrencies

## Tech Stack

### Core Framework
- **[Next.js 16.1.6](https://nextjs.org/docs)** - React framework with App Router
- **[React 18.3.1](https://react.dev/)** - UI library
- **[TypeScript 5.6.3](https://www.typescriptlang.org/)** - Type safety

### UI & Styling
- **[Tailwind CSS 3.4.13](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion 11.11.1](https://www.framer.com/motion/)** - Animation library
- **[React Icons 5.3.0](https://react-icons.github.io/react-icons/)** - Icon library

### Data & Charts
- **[Prisma 5.20.0](https://www.prisma.io/)** - ORM for database management
- **[MongoDB 6.5.0](https://www.mongodb.com/)** - NoSQL database
- **[Chart.js 4.4.6](https://www.chartjs.org/)** - Charting library
- **[React Chart.js 2 5.2.0](https://react-chartjs-2.js.org/)** - React wrapper for Chart.js

### Authentication
- **[NextAuth.js 4.24.7](https://next-auth.js.org/)** - Authentication solution
- **[@auth/prisma-adapter 2.4.0](https://authjs.dev/)** - Prisma adapter for NextAuth

### Real-time Communication
- **WebRTC** - Peer-to-peer video chat and screen sharing
- **STUN Servers** - Google STUN servers for NAT traversal

### Utilities
- **[Axios 1.7.7](https://axios-http.com/)** - HTTP client
- **[Bcrypt 5.1.1](https://github.com/kelektiv/node.bcrypt.js)** - Password hashing

## Prerequisites

- **Node.js** 20.9+ (Node.js 18 is no longer supported in Next.js 16)
- **npm** or **yarn** or **pnpm**
- **MongoDB** (local installation or Docker or MongoDB Atlas)
- **TypeScript** 5.1.0+

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TradingJournal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   # For local MongoDB:
   DATABASE_URL="mongodb://localhost:27017/trading-journal"
   # For MongoDB Atlas (see docs/MONGODB_ATLAS_SETUP.md):
   # DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/trading-journal?retryWrites=true&w=majority"
   
   # NextAuth Configuration (REQUIRED)
   # Generate a secret with: openssl rand -base64 32
   # Or use: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Optional: Node Environment
   NODE_ENV="development"
   ```
   
   **Important:** You must set `NEXTAUTH_SECRET` and `NEXTAUTH_URL` for authentication to work. 
   
   Generate a secure secret using one of these methods:
   - `npm run generate-secret` (recommended - uses the included script)
   - `openssl rand -base64 32` (Linux/Mac)
   - `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` (Node.js)

4. **Set up the database**
   
   You have two options:
   
   **Option A: MongoDB Atlas (Recommended for Production)**
   
   Connect to MongoDB Atlas (cloud-hosted MongoDB):
   1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   2. Create a cluster and database user
   3. Get your connection string from Atlas
   4. Update `DATABASE_URL` in your `.env` file:
      ```env
      DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/trading-journal?retryWrites=true&w=majority"
      ```
   5. See [MongoDB Atlas Setup Guide](./docs/MONGODB_ATLAS_SETUP.md) for detailed instructions
   
   **Option B: Local MongoDB (Development)**
   
   Using Docker:
   ```bash
   docker-compose up -d
   ```
   
   Or use a local MongoDB instance with:
   ```env
   DATABASE_URL="mongodb://localhost:27017/trading-journal"
   ```

5. **Run Prisma migrations**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server (with Turbopack)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run generate-secret` - Generate a secure NextAuth secret

## Project Structure

```
TradingJournal/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/       # Dashboard routes
│   │   │   ├── analytics/     # Analytics page
│   │   │   ├── settings/      # Settings pages
│   │   │   ├── team/          # Team pages
│   │   │   └── trades/        # Trade pages
│   │   ├── actions/           # Server actions
│   │   ├── api/               # API routes
│   │   │   ├── analytics/     # Analytics API
│   │   │   ├── auth/           # Auth API
│   │   │   ├── rooms/         # WebRTC signaling
│   │   │   ├── teams/         # Team API
│   │   │   └── trades/        # Trade API
│   │   └── auth/              # Authentication pages
│   ├── components/            # React components
│   │   ├── analytics/         # Analytics components
│   │   ├── common/            # Shared components
│   │   ├── forms/             # Form components
│   │   ├── home/              # Home page components
│   │   ├── navbar/            # Navigation components
│   │   ├── sidebar/           # Sidebar components
│   │   ├── trades/            # Trade-related components
│   │   └── ui/                # Reusable UI primitives
│   ├── context/               # React contexts
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   │   ├── analytics.ts       # Analytics computation
│   │   ├── home.ts            # Home page data
│   │   ├── prisma.ts         # Prisma client
│   │   ├── teamAuth.ts       # Team auth helpers
│   │   └── webrtc.ts         # WebRTC utilities
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
├── prisma/
│   └── schema.prisma          # Prisma schema
├── public/                    # Static assets
│   └── uploads/               # User uploads (profiles, trades, teams)
├── docs/                      # Documentation
│   ├── changes/               # Changelog
│   └── MONGODB_ATLAS_SETUP.md # MongoDB setup guide
└── docker-compose.yml         # Docker configuration
```

## API Routes

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/register` - User registration

### User
- `GET /api/user` - Get current user data
- `PATCH /api/user/update` - Update user information
- `DELETE /api/user/delete` - Delete user account

### Trades
- `GET /api/trades` - Get trades with filtering and pagination
- `GET /api/trades/[id]` - Get trade details
- `POST /api/trades/new` - Create a new trade
- `PATCH /api/trades/update` - Update a trade
- `PATCH /api/trades/[id]` - Update trade details
- `DELETE /api/trades/delete` - Delete a trade

### Exchanges
- `POST /api/exchanges/new` - Create a new exchange
- `DELETE /api/exchanges/delete` - Delete an exchange

### Rules
- `POST /api/rules/new` - Create a new trading rule
- `PATCH /api/rules/update` - Update a rule
- `DELETE /api/rules/delete` - Delete a rule

### Analytics
- `GET /api/analytics` - Get analytics data with filters

### Teams
- `GET /api/teams` - Get user's teams
- `POST /api/teams` - Create a new team
- `GET /api/teams/[teamId]` - Get team details
- `PATCH /api/teams/[teamId]` - Update team (name, description, image)
- `GET /api/teams/[teamId]/members` - Get team members
- `PATCH /api/teams/[teamId]/members` - Update member role
- `DELETE /api/teams/[teamId]/members` - Remove member
- `GET /api/teams/[teamId]/messages` - Get team messages
- `POST /api/teams/[teamId]/messages` - Send message
- `GET /api/teams/[teamId]/trade-shares` - Get shared trades
- `POST /api/teams/[teamId]/trade-shares` - Share a trade
- `DELETE /api/teams/[teamId]/trade-shares` - Unshare a trade
- `GET /api/teams/[teamId]/rooms` - Get team rooms
- `POST /api/teams/[teamId]/rooms` - Create room
- `GET /api/teams/[teamId]/invites` - Get pending invites
- `POST /api/teams/[teamId]/invites` - Send invite
- `GET /api/team-invites/[token]` - Get invite details
- `POST /api/team-invites/[token]` - Accept invite

### WebRTC
- `POST /api/rooms/[roomId]/signal` - Send WebRTC signal
- `GET /api/rooms/[roomId]/signal` - Get WebRTC signals

### Upload
- `POST /api/upload` - Upload images (profiles, trades, teams)

## Database Schema

The application uses MongoDB with Prisma ORM. Key models include:

- **User** - User accounts, authentication, and profile data
- **Trade** - Trading records with detailed information
- **Exchange** - Exchange accounts and balances
- **Rule** - Trading rules and strategies
- **Comment** - Comments on trades
- **Team** - Trading teams
- **TeamMember** - Team membership and roles
- **TeamMessage** - Team chat messages
- **TeamTradeShare** - Shared trades within teams
- **TeamRoom** - Video chat rooms
- **RoomSignal** - WebRTC signaling data
- **TeamInvite** - Team invitation system

## Recent Improvements

- ✅ Upgraded to Next.js 16.1.6 with Turbopack
- ✅ Removed Chakra UI, migrated to Tailwind CSS
- ✅ Implemented glass-morphism design system
- ✅ Added Team collaboration features
- ✅ Implemented WebRTC video chat with screen sharing
- ✅ Redesigned Home page as Trading Command Center
- ✅ Implemented Analytics v2 with advanced filtering
- ✅ Added Trade Details page with edit capabilities
- ✅ Enhanced UI components with theme support
- ✅ Fixed dark/light theme consistency
- ✅ Added password reset functionality
- ✅ Implemented image upload system
- ✅ Added profile picture management
- ✅ Enhanced sidebar with animations
- ✅ Improved navbar with glass effect
- ✅ Added market clocks and market data widgets
- ✅ Implemented Prisma singleton pattern for better connection management
- ✅ Enhanced error handling and input validation across all API routes
- ✅ Improved TypeScript type safety throughout the application
- ✅ Added comprehensive API route documentation
- ✅ Fixed security issues and authorization checks
- ✅ Optimized middleware for Next.js 16

## Development Notes

- The application uses **Server Components** by default for better performance
- **Turbopack** is enabled by default in Next.js 16 for faster builds
- Prisma client is configured as a singleton to prevent connection pool exhaustion
- All API routes include proper error handling and validation
- TypeScript strict mode is enabled for better type safety
- Custom ColorModeContext manages theme state (not browser-based)
- WebRTC uses P2P mesh networking with STUN servers
- Image uploads are stored locally in `public/uploads/`

## Troubleshooting

### NextAuth Configuration Errors

If you see errors like `[next-auth][error][NO_SECRET]` or `[next-auth][warn][NEXTAUTH_URL]`:

1. **Missing NEXTAUTH_SECRET**: 
   - Generate a secret: `npm run generate-secret`
   - Add it to your `.env` file: `NEXTAUTH_SECRET="your-generated-secret"`

2. **Missing NEXTAUTH_URL**:
   - For local development: `NEXTAUTH_URL="http://localhost:3000"`
   - For production: Set it to your production URL

3. **Verify your `.env` file**:
   - Make sure it's in the root directory
   - Check that there are no extra spaces or quotes issues
   - Restart your development server after creating/updating `.env`

### Database Connection Issues

- **Local MongoDB:** Ensure MongoDB is running: `docker-compose up -d` or start your local MongoDB instance
- **MongoDB Atlas:** 
  - Verify your IP address is whitelisted in Network Access
  - Check that your username and password are correct (URL encode special characters)
  - Ensure your connection string includes the database name: `/trading-journal`
- **General:** 
  - Verify `DATABASE_URL` in your `.env` file is correct
  - Run `npx prisma generate` and `npx prisma db push` to set up the database schema
  - See [MongoDB Atlas Setup Guide](./docs/MONGODB_ATLAS_SETUP.md) for detailed connection instructions

### WebRTC Issues

- **Camera/Microphone Access:** Ensure browser permissions are granted
- **Screen Sharing:** Requires HTTPS in production (localhost works in development)
- **Connection Issues:** Check firewall settings and STUN server availability

### Theme Issues

- If colors don't match, ensure you're using the custom ColorModeContext, not browser dark mode
- Clear browser cache if theme persists incorrectly
- Check that all components use `useColorMode()` hook

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

See [docs/changes/unreleased/](./docs/changes/unreleased/) for detailed changelog.

## License

This project is private and proprietary.

---

Built with ❤️ using Next.js 16
