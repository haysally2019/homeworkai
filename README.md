# Altus - AI University Study Companion

A mobile-first Progressive Web App (PWA) built with Next.js 14, featuring AI-powered problem solving and tutoring for university students.

## Features

- **Mobile-First Design**: Sleek, dark-themed interface optimized for mobile devices
- **AI-Powered Solutions**: Integrated with Google Gemini AI for intelligent problem solving
- **Dual Modes**:
  - **Solver Mode**: Get instant solutions with step-by-step explanations
  - **Tutor Mode**: Learn with guided questions and hints
- **Image Support**: Upload images directly from your phone's camera
- **LaTeX Rendering**: Beautiful mathematical notation rendering
- **Credit System**: Free tier with 3 credits, Pro tier with unlimited access
- **Supabase Authentication**: Secure email/password authentication

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)
- Google Gemini AI
- React Markdown + KaTeX for rendering

## Setup Instructions

### Prerequisites

1. Node.js 18+ installed
2. A Supabase account and project
3. A Google Gemini API key

### Environment Variables

Update the `.env` file with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key
```

### Getting Your API Keys

#### Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select an existing one
3. Navigate to Settings > API
4. Copy the Project URL and anon/public key
5. Copy the service_role key (keep this secret!)

#### Google Gemini
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### Installation

```bash
npm install
```

### Database Setup

The database migration has already been applied. It creates:
- `users_credits` table to track user credits and Pro status
- Automatic trigger to grant 3 free credits on signup

### Running the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## How It Works

1. **Sign Up/Login**: Create an account to get 3 free credits
2. **Choose Mode**: Toggle between Solver and Tutor mode
3. **Ask Questions**: Type your question or upload an image
4. **Get Help**: Receive AI-powered assistance based on your selected mode
5. **Upgrade**: When you run out of credits, upgrade to Pro for unlimited access

## Architecture

- **Frontend**: Client-side React components with mobile-first responsive design
- **Backend**: Next.js API routes handle AI requests and credit management
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **AI**: Google Gemini 1.5 Pro for problem solving and tutoring

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only read their own credit information
- Credits can only be modified through the API (not directly by users)
- Service role key used server-side only

## Credit System

- **Free Tier**: 3 credits per account
- **Pro Tier**: Unlimited credits for $49.99/semester
- Each AI request consumes 1 credit (unless Pro)

## License

Proprietary
