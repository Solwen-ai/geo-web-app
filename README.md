# Geo Web App

A modern monorepo application with React frontend and Express backend, featuring Tailwind CSS for styling.

## 🏗️ Project Structure

```
geo-web-app/
├── frontend/          # React + TypeScript + Vite + Tailwind CSS
├── backend/           # Express.js + TypeScript API server
├── package.json       # Root package.json with workspace configuration
├── pnpm-workspace.yaml # pnpm workspace configuration
├── .eslintrc.json    # Shared ESLint configuration
├── .prettierrc       # Shared Prettier configuration
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd geo-web-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development servers**
   ```bash
   # Start both frontend and backend concurrently
   pnpm dev
   
   # Or start them individually
   pnpm frontend:dev    # Frontend on http://localhost:5173
   pnpm backend:dev     # Backend on http://localhost:3001
   ```

## 📦 Available Scripts

### Root Level (Monorepo)
```bash
pnpm dev              # Start both frontend and backend in development mode
pnpm build            # Build both frontend and backend
pnpm clean            # Clean build artifacts
pnpm install:all      # Install all dependencies
pnpm frontend:dev     # Start only frontend development server
pnpm backend:dev      # Start only backend development server
pnpm frontend:build   # Build only frontend
pnpm backend:build    # Build only backend
```

### Frontend Scripts
```bash
cd frontend
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build
```

### Backend Scripts
```bash
cd backend
pnpm dev              # Start development server with hot reload
pnpm build            # Build TypeScript to JavaScript
pnpm start            # Start production server
pnpm clean            # Clean build artifacts
```

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint + Prettier** - Code linting and formatting

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger

### Development Tools
- **pnpm** - Fast, disk space efficient package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

## 🌐 API Endpoints

The backend provides the following endpoints:

- `GET /health` - Health check endpoint
- `GET /api/hello` - Sample API endpoint
- `GET /api/geo/location` - Sample geo location endpoint

## 🔧 Development

### Frontend Development
The frontend is built with React and Vite, featuring:
- Hot Module Replacement (HMR)
- Tailwind CSS with PostCSS
- TypeScript support
- ESLint and Prettier integration

### Backend Development
The backend is built with Express.js and TypeScript, featuring:
- Hot reload with tsx
- CORS configuration for frontend communication
- Security middleware (Helmet)
- Request logging (Morgan)
- Error handling middleware

### Code Quality
- **ESLint**: Shared configuration for both frontend and backend
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict type checking

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend
pnpm build
# Deploy the dist/ folder to your hosting service
```

### Backend Deployment
```bash
cd backend
pnpm build
pnpm start
# Or use PM2 for production process management
```

## 📝 Environment Variables

### Backend Environment Variables
```bash
PORT=3001                    # Server port (default: 3001)
NODE_ENV=development         # Environment (development/production)
```

### Frontend Environment Variables
```bash
VITE_API_URL=http://localhost:3001  # Backend API URL
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues or have questions, please:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include your Node.js and pnpm versions

---

**Happy coding! 🎉** 