# 🛰️ Eclipso - Cosmic Networking App

Eclipso is a unique, cosmic-themed networking application designed for two people (partners, friends, collaborators) to stay connected in a visually stunning, universe-inspired interface.

## 🌑 Concept

Eclipso visualizes relationships as shared mini-universes where:
- **Chat** → Comet-like messages stream across the cosmos
- **Interests** → Stars that form constellations when they overlap between users
- **Mood updates** → Moons orbiting user avatars
- **Capsules** → Glowing orbs containing shared memories (notes, images, voice messages)
- **Orbit meter** → Visual gauge showing how active the connection is

## 🎨 Design Language (Elegant Cosmic)

### Colors:
- **Deep Space Navy** `#0B0E2C` - Background
- **Eclipse Black** `#1A1A2E` - Panels
- **Aurora Purple** `#8A5DFF` - Primary
- **Nebula Rose** `#FF4F91` - Secondary  
- **Starlight Cyan** `#00FFE0` - Highlights
- **Solar Gold** `#F9A826` - Milestones

### Typography:
- **Orbitron** - Headings (cosmic/tech feel)
- **Poppins SemiBold** - Subheadings
- **Inter** - Body text

### UI Motifs:
- Constellation connections
- Glowing orbs and particles
- Smooth orbital animations
- Starfield backgrounds

## 🛠 Tech Stack

### Frontend
- **React** + **Vite** + **TypeScript**
- **TailwindCSS** for styling
- **shadcn/ui** components
- **lucide-react** for icons
- **framer-motion** for animations
- **Socket.io-client** for real-time features

### Backend
- **Node.js** + **Express** + **TypeScript**
- **MongoDB Atlas** with **Prisma ORM**
- **JWT** authentication
- **Socket.io** for real-time chat and live updates
- **bcryptjs** for password hashing

## 🎯 MVP Features

### ✅ Core Features Implemented

1. **Authentication System**
   - User registration and login
   - JWT-based authentication
   - Protected routes

2. **Onboarding Flow**
   - Avatar selection with cosmic colors
   - Interest selection (creates personal stars)
   - Profile customization

3. **Cosmos Dashboard**
   - Animated starfield background  
   - Interactive constellation view
   - Shared interests displayed as connected stars
   - Orbit meter showing connection activity level

4. **Real-time Chat**
   - Socket.io powered messaging
   - Comet-trail message animations
   - Connection status indicators
   - Message history

5. **Memory Capsules**
   - Create and view shared memory capsules
   - Locked capsules requiring both users to unlock
   - Different content types (text, image, audio)
   - Beautiful modal interface

6. **Partnership System**
   - Connect with another user via email
   - Shared cosmic space
   - Constellation formation based on mutual interests

## 📦 Project Structure

```
eclipso/
├── frontend/              # React + Vite + Tailwind app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── Cosmos.tsx        # Starfield + constellations
│   │   │   ├── Chat.tsx          # Real-time chat
│   │   │   ├── Capsule.tsx       # Memory capsule modal
│   │   │   ├── OrbitMeter.tsx    # Connection activity gauge
│   │   │   └── Starfield.tsx     # Animated background
│   │   ├── pages/         # Main app pages
│   │   │   ├── Login.tsx         # Authentication
│   │   │   ├── Onboarding.tsx    # Profile setup
│   │   │   └── Dashboard.tsx     # Main cosmos view
│   │   ├── context/       # React contexts
│   │   │   ├── AuthContext.tsx   # User authentication
│   │   │   ├── SocketContext.tsx # Real-time messaging
│   │   │   └── CosmosContext.tsx # Constellation state
│   │   ├── hooks/         # Custom React hooks
│   │   └── styles/        # Global CSS and Tailwind
│   └── package.json
│
└── backend/               # Express + Prisma + Socket.io
    ├── src/
    │   ├── routes/        # API endpoints
    │   │   ├── auth.ts           # Login/signup, JWT
    │   │   ├── users.ts          # Profile + interests
    │   │   └── chat.ts           # Messages + capsules  
    │   ├── middleware/
    │   │   └── authMiddleware.ts # JWT verification
    │   └── index.ts       # Express + Socket.io server
    ├── prisma/
   │   ├── schema.prisma  # Database schema (single source of truth)
   │   └── seed.ts        # Sample data
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas connection string
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eclipso
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Setup environment variables
   cp .env.example .env
   # Edit .env with your MongoDB connection and JWT secret
   
   # Setup database
   npx prisma db push
   npx prisma generate
   
   # Seed sample data
   npm run seed
   
   # Start development server
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install

   # Optional socket endpoint override
   cp .env.example .env
   
   # Start development server  
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Sample Users
The seed script creates two demo users:
- **alice@eclipso.app** / password: `password123`
- **bob@eclipso.app** / password: `password123`

These users are already partnered and have sample messages and capsules.

## 🌟 Key Features in Detail

### Cosmic Authentication
- Beautiful space-themed login/register forms
- Smooth animations and cosmic particle effects
- Persistent JWT sessions

### Interactive Cosmos View  
- Real-time constellation formation based on shared interests
- Animated orbit meter reflecting relationship activity
- Hover effects and star tooltips
- SVG-based constellation lines connecting shared interests

### Real-time Messaging
- Socket.io powered instant messaging
- Comet-trail visual effects for messages
- Connection status indicators
- Message history with smooth animations

### Memory Capsules
- Create multimedia memory capsules
- Locked capsules requiring both users to unlock together
- Beautiful modal interface with tabs
- Different content types supported

### Responsive Design
- Mobile-first approach
- Cosmic theme consistent across all screen sizes
- Touch-friendly interactions

## 🎨 Custom CSS Features

- **Starfield Animation**: Twinkling background stars with parallax effect
- **Cosmic Glow Effects**: Purple/cyan glowing borders and shadows
- **Orbital Animations**: Smooth rotation effects for UI elements
- **Message Comets**: CSS triangular tails on chat bubbles
- **Constellation Lines**: SVG connections between shared interests

## 🔮 Future Enhancements

- Voice message capsules with audio visualization
- Image sharing with cosmic photo filters
- Mood tracking with orbital moon phases
- Collaborative playlist creation (musical constellations)
- Calendar integration for shared cosmic events
- Mobile app with push notifications
- AR view of constellations using device camera
- Achievement system (cosmic milestones)
- Multi-user cosmic communities
- Advanced constellation algorithm based on interaction patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/cosmic-feature`)
3. Commit changes (`git commit -m 'Add cosmic feature'`)
4. Push to branch (`git push origin feature/cosmic-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛰️ Built with Cosmic Love

Eclipso represents the beauty of human connections visualized through the infinite wonder of space. Each relationship is a unique constellation in the vast universe of human experience.

---

*"In the cosmic dance of connection, every shared moment creates a new star in our constellation."*

Goal: Scaffold the initial draft of Eclipso, a cosmic-themed networking app for two people (partners, friends, collaborators) to stay connected in a unique, visual way.

🌑 Concept

Eclipso visualizes a relationship as a shared mini-universe.

Chat → comet-like messages.

Interests → stars that form constellations when they overlap.

Mood updates → moons orbiting user avatars.

Capsules → glowing orbs with shared memories (notes, images, voice).

Orbit meter → visual gauge of how active the connection is.

🎨 Design Language (Elegant Cosmic)

Colors:

Deep Space Navy #0B0E2C (bg)

Eclipse Black #1A1A2E (panels)

Aurora Purple #8A5DFF (primary)

Nebula Rose #FF4F91 (secondary)

Starlight Cyan #00FFE0 (glows)

Solar Gold #F9A826 (milestones)

Typography: Orbitron (headings), Poppins SemiBold (subheadings), Inter (body).

UI Motifs: constellations, glowing orbs, smooth animations.

🛠 Tech Stack

Frontend: React + Vite + TailwindCSS

UI Components: shadcn/ui, lucide-react

Backend: Node.js (Express)

Database: MongoDB Atlas with Prisma ORM

Auth: JWT (basic email/password)

Real-time: Socket.io (chat + live constellation updates)

🎯 MVP Features

Onboarding / Profile Setup

Create account → choose avatar orb → select interests.

Cosmos Dashboard

Starfield background.

Shared interests = glowing constellations.

Mood = orbiting moons.

Chat

Real-time messaging with comet animation.

Capsules

Orb container for shared notes/media.

Unlockable with both users’ actions.

Orbit Meter

Expands/contracts based on interaction frequency.

📦 Deliverables

Scaffold project with React + Vite + Tailwind + shadcn/ui.

Basic Express backend with JWT auth.

Prisma schema + MongoDB connection.

Socket.io setup for real-time chat.

Components: Cosmos view, Chat panel, Capsule modal, Orbit meter.

Example seed data (two users, stars/interests, dummy messages).

💡 Instruction for Copilot/Cursor:
Use this brief to generate:

README.md with project overview.

Initial frontend/ React + Vite + Tailwind scaffold.

Initial backend/ Express + Prisma + Socket.io scaffold.

Example components (Cosmos.tsx, Chat.tsx, Capsule.tsx, etc.) with placeholder data and styling hooks.



Commit Project Structure
eclipso/
├── README.md              # Project brief (include the prompt here)
├── frontend/              # React + Vite + Tailwind app
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── assets/        # logos, backgrounds, cosmic svgs
│       ├── components/    
│       │   ├── Cosmos.tsx        # starfield + constellations
│       │   ├── Chat.tsx          # real-time chat
│       │   ├── Capsule.tsx       # shared orb capsule
│       │   ├── OrbitMeter.tsx    # gauge of interaction
│       │   └── ui/               # shadcn/ui components
│       ├── pages/
│       │   ├── Onboarding.tsx    # profile setup
│       │   ├── Dashboard.tsx     # cosmos view
│       │   └── Login.tsx         # auth
│       ├── hooks/                # custom hooks (useAuth, useSocket)
│       ├── context/              # React contexts (auth, chat, cosmos)
│       └── styles/               # Tailwind custom styles
│
├── backend/               # Express + Prisma + Socket.io
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts        # Express entry
│   │   ├── server.ts       # app + socket.io
│   │   ├── prisma/         
│   │   │   └── schema.prisma   # MongoDB schema
│   │   ├── routes/
│   │   │   ├── auth.ts     # login/signup, JWT
│   │   │   ├── users.ts    # profile + interests
│   │   │   └── chat.ts     # chat + capsules
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   └── chatController.ts
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts
│   │   └── utils/
│   │       └── jwt.ts
│   └── prisma/
│       └── migrations/    # database migrations
│
└── .gitignore



So please:
1. Scaffold the frontend (React + Vite + Tailwind) with placeholder pages + components.

2. Scaffold the backend (Express + Prisma + Socket.io) with auth + chat routes.

3. Create a basic Prisma schema with User, Interest, Message, Capsule.

4. Wire up Socket.io for chat + constellation updates.

5. Add a seed script with dummy users, sample stars/interests, and messages.