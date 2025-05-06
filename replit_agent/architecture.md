# Architecture Overview

## Overview

This repository contains a Mandarin language learning application built with a modern tech stack. The application provides features such as vocabulary practice, character dictionary, word lists, and interactive learning tools. It's designed with a client-server architecture, where the frontend is built with React and the backend is implemented with Node.js.

## System Architecture

### High-Level Architecture

The application follows a client-server architecture with the following components:

1. **Frontend**: A React application using Vite as the build tool
2. **Backend**: An Express.js server providing RESTful APIs
3. **Database**: PostgreSQL database accessed via Drizzle ORM
4. **External Services**: OpenAI API for sentence generation and synonym checking

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                 │         │                  │         │                  │
│  React Frontend │ ───────►│  Express Backend │ ───────►│  PostgreSQL DB   │
│  (Vite)         │         │                  │         │                  │
│                 │         │                  │         │                  │
└─────────────────┘         └──────────────┬───┘         └──────────────────┘
                                           │
                                           │
                                           ▼
                                   ┌──────────────────┐
                                   │                  │
                                   │   OpenAI API     │
                                   │                  │
                                   └──────────────────┘
```

## Key Components

### Frontend Architecture

The frontend is a React application with TypeScript, built using Vite. It employs a component-based architecture with the following key features:

1. **Routing**: Uses `wouter` for lightweight client-side routing
2. **State Management**: Leverages React Query for server state management
3. **UI Components**: Utilizes Shadcn UI with Tailwind CSS for styling
4. **API Communication**: Implements a custom `apiRequest` utility for fetching data from the backend

Key directories:
- `client/src/pages`: Page components for different routes
- `client/src/components`: Reusable UI components
- `client/src/lib`: Utility functions and helpers
- `client/src/hooks`: Custom React hooks

### Backend Architecture

The backend is built with Express.js and follows a modular structure:

1. **API Routes**: RESTful endpoints for vocabulary, characters, and practice sessions
2. **Database Access**: Uses Drizzle ORM for type-safe database operations
3. **External APIs**: Integration with OpenAI for generating sentences and checking synonyms
4. **Middleware**: Express middleware for handling requests and responses

Key files:
- `server/index.ts`: Entry point for the Express server
- `server/routes.ts`: API route definitions
- `server/storage.ts`: Data access layer
- `server/db.ts`: Database connection and configuration

### Database Schema

The application uses PostgreSQL with Drizzle ORM for data management. The main database schemas include:

1. **Users**: Authentication and user management
2. **Vocabulary**: Mandarin vocabulary words with translations
3. **Characters**: Chinese characters with definitions, pinyin, and metadata
4. **Practice Sessions**: User practice data for tracking progress

Key schema files:
- `shared/schema.ts`: Defines database tables and relationships using Drizzle ORM

### API Structure

The backend exposes RESTful APIs with the following structure:

1. **Vocabulary API**: CRUD operations for vocabulary words
2. **Character Dictionary API**: Endpoints for Chinese character lookups and definitions
3. **Practice API**: Endpoints for practice sessions and progress tracking
4. **OpenAI Integration**: APIs for sentence generation and synonym checking

## Data Flow

### Practice Session Flow

1. User selects a difficulty level for practice
2. Frontend requests a sentence from the backend
3. Backend either serves a pre-stored sentence or generates a new one via OpenAI
4. User translates the sentence and submits their answer
5. Backend evaluates the translation, potentially using OpenAI for synonym checking
6. Results are stored in the database and returned to the frontend
7. Frontend updates the UI with feedback and score

### Dictionary Lookup Flow

1. User searches for a character or word
2. Frontend sends the query to the backend API
3. Backend queries the database for matching character information
4. Results are returned to the frontend and displayed to the user
5. User can view additional details, example sentences, and related words

## External Dependencies

### Core Technologies

1. **Frontend**:
   - React with TypeScript
   - Vite for build and development
   - Tailwind CSS for styling
   - Shadcn UI for component library
   - React Query for data fetching and caching

2. **Backend**:
   - Node.js with TypeScript
   - Express.js for API server
   - Drizzle ORM for database access
   - OpenAI SDK for AI integrations

3. **Database**:
   - PostgreSQL via Neon Serverless
   - Connection pooling for efficient database access

### Third-party Services

1. **OpenAI API**: Used for:
   - Generating example sentences with specific vocabulary words
   - Checking if two English words or phrases are synonyms
   - Enhancing dictionary definitions

2. **Neon Database**: PostgreSQL database service with serverless connectivity

## Deployment Strategy

The application is configured for deployment on Replit, with the following setup:

1. **Development Environment**:
   - Uses Vite dev server with HMR for frontend
   - Express server for backend with development-specific configurations
   - Environment variables for different settings between environments

2. **Production Deployment**:
   - Frontend built with Vite and served statically by Express
   - Server-side code bundled with esbuild
   - Database connections optimized for production use

The deployment process includes:

1. Building the frontend assets with Vite
2. Compiling server TypeScript code with esbuild
3. Serving the application from a single Node.js process
4. Database schema migrations using Drizzle Kit

## Data Import and Management

The application includes several scripts for importing and managing Chinese language data:

1. **Dictionary Import**: Scripts to import data from CC-CEDICT and HanziDB
2. **HSK Vocabulary**: Preloaded lists of words from HSK (Hanyu Shuiping Kaoshi) levels
3. **Character Relationships**: Tools to create relationships between single characters and compound words

These data management tools ensure the application has comprehensive Chinese language data available to users.