# Video App Frontend

Frontend React application for the Video Processing API.

## Features

- **Authentication**: Login and registration with JWT tokens
- **Dashboard**: Overview of available features
- **Video Upload**: Drag & drop video file upload
- **Processing Status**: Real-time status monitoring with auto-refresh
- **Profile**: View user account information

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Router for navigation
- Axios for API calls

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy the `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000` |

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

Build output will be in the `dist/` directory.

## Pages

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/login` | User login | No |
| `/register` | User registration | No |
| `/` | Dashboard | Yes |
| `/upload` | Video upload | Yes |
| `/status` | Check video processing status | Yes |
| `/profile` | User profile | Yes |

## API Integration

The frontend integrates with the following API endpoints:

### Auth
- `POST /auth/signin` - Login
- `POST /auth/refresh` - Refresh token

### Users
- `POST /users` - Create user
- `GET /users/:identifier` - Get user by ID or email

### Video
- `POST /video` - Upload video file
- `GET /video/status/:jobId` - Get processing status
- `GET /video/:userId/:videoId` - Download processed video
