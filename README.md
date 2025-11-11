# Interactive Presenter

Real-time audience interaction platform built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Presenter Mode**: Create rooms, display QR codes, view real-time audience contributions
- **Audience Mode**: Join rooms via QR code, submit colored contributions
- **Real-time Updates**: Instant synchronization using Supabase real-time subscriptions
- **Authentication**: Secure presenter login with Supabase Auth
- **No Auth Required**: Audience can participate without signing up

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Supabase project at [https://supabase.com](https://supabase.com)

4. Run the SQL schema in your Supabase SQL Editor:
   ```sql
   -- See supabase/schema.sql
   ```

5. Enable Email authentication in Supabase Dashboard → Authentication → Providers

6. Copy `.env.example` to `.env.local` and add your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000)

## Usage

### For Presenters

1. Sign up / Sign in at `/login`
2. Create a new room at `/home`
3. Select available colors for audience
4. Share the QR code displayed in presenter view
5. Watch contributions appear in real-time

### For Audience

1. Scan QR code or visit the room URL
2. Select a color
3. Click "Send"
4. Your contribution appears instantly on the presenter's screen

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Project Structure

```
├── app/                    # Next.js app routes
│   ├── [roomCode]/        # Dynamic room routes
│   │   ├── audience/      # Audience views
│   │   └── presenter/     # Presenter views
│   ├── auth/              # Auth callbacks
│   ├── home/              # Room creation
│   └── login/             # Authentication
├── components/            # React components
├── lib/                   # Utilities and Supabase clients
│   ├── supabase/         # Supabase client configurations
│   ├── types/            # TypeScript types
│   └── utils/            # Helper functions
└── supabase/             # Database schema
```

## License

MIT
