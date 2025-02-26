# Chat Application

A real-time chat application built with React, Node.js, Express, and Socket.io.

## Project Structure

- `/client` - React frontend
- `/server` - Node.js backend with Express and Socket.io

## Setup Instructions

### Quick Setup (Using Root Scripts)

1. Install dependencies for both client and server:
   ```
   npm run install-all
   ```

2. Start both client and server in development mode:
   ```
   npm run dev
   ```

### Manual Setup

#### Backend Setup
1. Navigate to the server directory: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file with required environment variables
4. Start the server: `npm start`

#### Frontend Setup
1. Navigate to the client directory: `cd client`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## Available Scripts

From the root directory, you can run:

- `npm run client` - Start the React frontend
- `npm run server` - Start the Node.js backend
- `npm run client:install` - Install frontend dependencies
- `npm run server:install` - Install backend dependencies
- `npm run install-all` - Install dependencies for both frontend and backend
- `npm run dev` - Run both frontend and backend concurrently (for development)
- `npm run build` - Build the frontend for production

## Environment Variables

### Backend (.env file in server directory)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT token generation
- `GEMINI_API_KEY` - Google Gemini API key

### Frontend (.env file in client directory)
- `REACT_APP_API_URL` - URL of the backend API

## Deployment

This project is set up as a monorepo for easy deployment on platforms like Render.com:

### Backend Deployment (on Render.com)
- Build Command: `cd server && npm install`
- Start Command: `cd server && npm start`

### Frontend Deployment (on Render.com)
- Build Command: `cd client && npm install && npm run build`
- Publish Directory: `client/build`