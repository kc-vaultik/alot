# ALOT! Frontend

React + TypeScript frontend for the ALOT! collectible lot platform.

**Source:** Lovable.dev prototype (https://mycollectcard.lovable.app)

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
- **Animations:** Framer Motion
- **State Management:** React Query + Context API
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod
- **Backend:** Supabase (PostgreSQL + Auth + Storage)

## Project Structure

```
src/
├── assets/              # Images and static files
│   ├── cards/          # Card images
│   ├── mystery/        # Mystery pack images
│   ├── packs/          # Pack images
│   └── products/       # Product images
│
├── components/
│   ├── ui/             # shadcn/ui components (70+ components)
│   ├── landing/        # Landing page components
│   ├── routing/        # Route guards & navigation
│   └── shared/         # Shared components
│       └── reveal/     # Card reveal animations
│
├── features/           # Feature modules
│   ├── collect-room/   # Main lot interface
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   ├── admin/          # Admin panel (6 modules)
│   ├── collectors/     # User profiles
│   ├── rooms/          # Lot rooms
│   ├── marketplace/    # Marketplace (future)
│   ├── settings/       # User settings
│   └── drops/          # Drops (future)
│
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
│
├── integrations/       # External services
│   └── supabase/       # Supabase client & types
│
├── pages/              # Page components
│   ├── Landing.tsx
│   ├── Auth.tsx
│   └── Settings.tsx
│
├── hooks/              # Custom React hooks
├── lib/                # Utilities
├── types/              # TypeScript types
└── utils/              # Helper functions
```

## Key Features

### Implemented
- ✅ **Collect Room** - Main lot interface with card reveal
- ✅ **Trivia Credits** - Sweepstakes-compliant credit system
- ✅ **Admin Panel** - 6 modules (rooms, inventory, economy, users, support, settings)
- ✅ **Authentication** - Magic link (passwordless)
- ✅ **Collector Profiles** - Public user profiles
- ✅ **Settings** - Personal data, KYC, security, notifications
- ✅ **Card Animations** - Framer Motion reveal effects
- ✅ **Responsive Design** - Mobile-first approach

### Feature Modules

**1. Collect Room** (`features/collect-room/`)
- Card purchasing & unboxing
- Vault management
- Trivia questions
- Gift/swap system
- Live pack opening animations

**2. Admin Panel** (`features/admin/`)
- Dashboard analytics
- Room management
- Inventory tracking
- Economy monitoring
- User management
- Support tickets
- Platform settings

**3. Rooms** (`features/rooms/`)
- Room lobby
- Entry purchasing
- Trivia gate
- Draw outcomes
- Participant tracking

**4. Collectors** (`features/collectors/`)
- Public profiles
- Collection showcase
- Stats & badges
- Social interactions

**5. Settings** (`features/settings/`)
- Personal data
- Document upload (KYC)
- Security settings
- Notification preferences
- Support center

## Setup

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   App will be available at http://localhost:5173

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

## Supabase Setup

### 1. Create Supabase Project
- Go to https://supabase.com/dashboard
- Create new project
- Note your project URL and anon key

### 2. Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

Or manually run the 96 SQL migration files in `../supabase/migrations/`

### 3. Configure Auth
- Enable Magic Link auth in Supabase dashboard
- Set up email templates
- Configure redirect URLs

## Development

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Adding New Components

```bash
# Add shadcn/ui component
npx shadcn-ui@latest add button

# Available components (70+)
npx shadcn-ui@latest add --help
```

### Code Style

- **TypeScript:** Strict mode enabled
- **ESLint:** React + TypeScript rules
- **Prettier:** (Configure if needed)
- **Naming:** PascalCase for components, camelCase for functions

## Authentication Flow

The app uses **magic link authentication** via Supabase:

1. User enters email
2. Supabase sends magic link
3. User clicks link
4. Auto-login with session token
5. Redirect to intended page

See `src/contexts/AuthContext.tsx` for implementation.

## State Management

- **React Query:** Server state (API data)
- **Context API:** Auth state, collect room state
- **Local State:** Component-level state
- **URL State:** Filters, pagination via React Router

## Styling

- **Tailwind CSS:** Utility-first CSS
- **shadcn/ui:** Pre-built accessible components
- **CSS Variables:** Theme customization via `tailwind.config.ts`
- **Dark Mode:** Supported via `next-themes`

## API Integration

All API calls go through Supabase:

```typescript
import { supabase } from '@/integrations/supabase/client';

// Query data
const { data, error } = await supabase
  .from('rooms')
  .select('*')
  .eq('status', 'open');

// Insert data
const { data, error } = await supabase
  .from('lot_participants')
  .insert({ room_id, user_id });

// RPC function
const { data, error } = await supabase
  .rpc('earn_trivia_credits', { p_room_id, p_question_id });
```

## Testing

```bash
# Run tests (if configured)
npm test

# Test coverage
npm run test:coverage
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Lovable.dev

The prototype is currently deployed on Lovable:
https://mycollectcard.lovable.app

### Other Platforms

- **Netlify:** Connect GitHub repo
- **AWS CloudFront:** Build + upload to S3
- **Docker:** See `../Dockerfile` (if created)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Yes |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | Yes |

## Performance

- **Code Splitting:** Automatic via Vite
- **Lazy Loading:** Route-based with React.lazy
- **Image Optimization:** Use `next/image` patterns
- **Bundle Size:** ~500KB gzipped (production)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Android

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 5173
netstat -ano | findstr :5173  # Windows
lsof -ti:5173                  # macOS/Linux

# Use different port
npm run dev -- --port 3000
```

### Supabase Connection Failed
- Check `.env` file exists and has correct values
- Verify Supabase project is running
- Check API keys are not expired

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
```

## Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Create pull request

## Documentation

- **Supabase Docs:** https://supabase.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Framer Motion:** https://www.framer.com/motion
- **React Router:** https://reactrouter.com
- **Vite:** https://vitejs.dev

## Support

- **Issues:** https://github.com/kc-vaultik/alot/issues
- **Discussions:** https://github.com/kc-vaultik/alot/discussions

---

**Status:** Production-ready frontend from Lovable prototype
**Last Updated:** February 9, 2026
