import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import { Landing } from './screens/Landing';
import { Login } from './screens/Login';
import { SignUp } from './screens/SignUp';
import { EventDashboard } from './screens/EventDashboard';
import { LockIn } from './screens/LockIn';
import { Vault } from './screens/Vault';
import { Market } from './screens/Market';
import { Chats } from './screens/Chats';
import { ChatRoom } from './screens/ChatRoom';
import { ListingDetail } from './screens/ListingDetail';
import { NewListing } from './screens/NewListing';
import { Profile } from './screens/Profile';
import { Settings } from './screens/Settings';
import { Favorites } from './screens/Favorites';
import { Help } from './screens/Help';
import { VIPUpgrade } from './screens/VIPUpgrade';
import { SchoolFeed } from './screens/SchoolFeed';

import { TopBar } from './components/layout/TopBar';
import { BottomNav } from './components/layout/BottomNav';
import { HamburgerMenu } from './components/layout/HamburgerMenu';

type Tab = 'event' | 'lock' | 'vault' | 'market' | 'chats' | 'school';

const PATH_TO_TAB: Record<string, Tab> = {
  '/event': 'event',
  '/lock': 'lock',
  '/vault': 'vault',
  '/market': 'market',
  '/chats': 'chats',
  '/school': 'school',
};

function Spinner() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-lavender animate-pulse" />
    </div>
  );
}

function ProtectedRoute({ children, requireProfile = true }: { children: React.ReactNode; requireProfile?: boolean }) {
  const { user, loading, profileLoading, profile } = useAuth();
  if (loading || (user && profileLoading)) return <Spinner />;
  if (!user) return <Navigate to="/" replace />;
  if (requireProfile && !profile) return <Navigate to="/profile" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/event" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const active = PATH_TO_TAB[location.pathname] ?? 'event';

  return (
    <div className="max-w-[430px] mx-auto min-h-screen relative">
      <TopBar onMenuClick={() => setMenuOpen(true)} />
      <HamburgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(path) => { navigate(path); setMenuOpen(false); }}
      />
      <div className="pt-14">
        {children}
      </div>
      <BottomNav active={active} onChange={(t) => navigate(`/${t}`)} />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />

      {/* Main tabs — with TopBar + BottomNav */}
      <Route path="/event" element={<ProtectedRoute><AppLayout><EventDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/lock" element={<ProtectedRoute><AppLayout><LockIn /></AppLayout></ProtectedRoute>} />
      <Route path="/vault" element={<ProtectedRoute><AppLayout><Vault /></AppLayout></ProtectedRoute>} />
      <Route path="/market" element={<ProtectedRoute><AppLayout><Market /></AppLayout></ProtectedRoute>} />
      <Route path="/chats" element={<ProtectedRoute><AppLayout><Chats /></AppLayout></ProtectedRoute>} />

      {/* Detail screens — own headers, no shell chrome */}
      <Route path="/chat/:id" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
      <Route path="/listing/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
      <Route path="/new-listing" element={<ProtectedRoute><NewListing /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute requireProfile={false}><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
      <Route path="/school" element={<ProtectedRoute><AppLayout><SchoolFeed /></AppLayout></ProtectedRoute>} />
      <Route path="/vip" element={<ProtectedRoute><VIPUpgrade /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
