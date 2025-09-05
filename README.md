# Roadside Rights

**Your rights. Your safety. Instantly accessible.**

A mobile-first web application providing essential legal information and guidance for individuals during police roadside encounters, with state-specific details and quick documentation features.

## 🚀 Features

### Core Features
- **State-Specific Rights Cards**: One-page, mobile-optimized guides detailing user rights and 'what to say/not to say' scripts for each U.S. state
- **Real-Time Encounter Assistant**: Instant access to relevant rights information and pre-defined scripts based on location and scenario
- **One-Click Documentation**: Quick audio/video recording and encounter detail logging with a single tap
- **Shareable Encounter Summary**: Automatically compiled summaries for sharing with legal counsel or trusted contacts

### Premium Features
- **Unlimited Recording**: No time limits on audio/video recording
- **AI-Powered Scripts**: Dynamic, contextual advice generation using OpenAI
- **Advanced Sharing**: Enhanced summary generation and sharing options
- **Priority Support**: Direct access to legal resources and support

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **AI Integration**: OpenAI GPT-3.5-turbo
- **Payments**: Stripe
- **Deployment**: Vercel/Netlify ready

## 📱 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- Stripe account (for payments)

### Environment Variables
Create a `.env` file based on `.env.example`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration  
VITE_OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# App Configuration
VITE_APP_ENV=development
```

### Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  current_state TEXT,
  subscription_status TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create state_info table
CREATE TABLE state_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state_name TEXT UNIQUE NOT NULL,
  rights_summary TEXT NOT NULL,
  do_say TEXT NOT NULL,
  dont_say TEXT NOT NULL,
  legal_resources TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create encounter_logs table
CREATE TABLE encounter_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location TEXT,
  state TEXT,
  notes TEXT,
  audio_recording_url TEXT,
  video_recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', true);

-- Set up Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounter_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Users can only see their own encounter logs
CREATE POLICY "Users can view own encounters" ON encounter_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own encounters" ON encounter_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own encounters" ON encounter_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own encounters" ON encounter_logs FOR DELETE USING (auth.uid() = user_id);

-- State info is public
ALTER TABLE state_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "State info is public" ON state_info FOR SELECT TO public USING (true);
```

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd roadside-rights

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🏗 Architecture

### Frontend Structure
```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── AuthModal.jsx   # Authentication modal
│   ├── Header.jsx      # App header
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication context
├── data/              # Static data
│   └── stateRights.js # State-specific rights data
├── lib/               # Utility libraries
│   ├── supabase.js    # Supabase client & services
│   ├── openai.js      # OpenAI integration
│   ├── stripe.js      # Stripe payment processing
│   ├── recording.js   # Audio/video recording
│   └── geolocation.js # Location services
└── App.jsx           # Main app component
```

### Key Services

#### Recording Service (`src/lib/recording.js`)
- Real-time audio/video recording using MediaRecorder API
- Automatic file upload to Supabase Storage
- Duration limits based on subscription tier
- Cross-browser compatibility

#### Geolocation Service (`src/lib/geolocation.js`)
- Automatic state detection from GPS coordinates
- Reverse geocoding for readable addresses
- Fallback to manual state selection

#### AI Service (`src/lib/openai.js`)
- Dynamic script generation for specific scenarios
- Contextual advice based on encounter notes
- Automated encounter summary generation

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Encrypted Storage**: All recordings encrypted at rest
- **No Client-Side Secrets**: API keys properly secured
- **HTTPS Only**: All communications encrypted in transit
- **Data Minimization**: Only collect necessary information

## 💰 Subscription Model

### Free Tier
- Basic rights information for all states
- Up to 3 encounter logs
- 5-minute recording limit
- Manual state selection

### Premium Tier ($4.99/month)
- Unlimited encounter logs
- Unlimited recording duration
- AI-powered contextual advice
- Automatic state detection
- Priority support
- Advanced sharing features

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify Deployment
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables

### Manual Deployment
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📊 Analytics & Monitoring

Consider integrating:
- **Sentry**: Error tracking and performance monitoring
- **Google Analytics**: User behavior analytics
- **Supabase Analytics**: Database performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚖️ Legal Disclaimer

This application provides general legal information and should not be considered as legal advice. Users should consult with qualified legal professionals for specific legal matters. The information provided may not be current or applicable to all jurisdictions.

## 🆘 Support

- **Documentation**: [Link to docs]
- **Issues**: [GitHub Issues]
- **Email**: support@roadsiderights.com
- **Legal Hotline**: (877) 337-8673 (ACLU)

## 🗺 Roadmap

### Phase 1 (Current)
- ✅ Core functionality implementation
- ✅ State-specific rights data
- ✅ Recording capabilities
- ✅ Basic authentication

### Phase 2 (Next)
- [ ] Mobile app (React Native)
- [ ] Offline mode support
- [ ] Multi-language support
- [ ] Enhanced AI features

### Phase 3 (Future)
- [ ] Legal professional network
- [ ] Real-time legal chat
- [ ] Community features
- [ ] Advanced analytics

---

**Built with ❤️ for civil rights and public safety**
