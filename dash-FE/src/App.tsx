import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AcceptedDashProvider } from './context/AcceptedDashContext';
import { isLoggedIn } from './api/client';
import Header from './components/Header';
import GNB from './components/GNB';
import HomePage from './pages/HomePage';
import DatePage from './pages/DatePage';
import MeetingPage from './pages/MeetingPage';
import CommunityPage from './pages/CommunityPage';
import MyInfoPage from './pages/MyInfoPage';
import ChatPage from './pages/ChatPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ReceivedDashPage from './pages/ReceivedDashPage';
import SentDashPage from './pages/SentDashPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  useEffect(() => {
    const check = () => { if (!isLoggedIn()) navigate('/login', { replace: true }); };
    window.addEventListener('dashtag-auth', check);
    return () => window.removeEventListener('dashtag-auth', check);
  }, [navigate]);
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <GNB />
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AcceptedDashProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/received-dashes" element={<ProtectedRoute><ReceivedDashPage /></ProtectedRoute>} />
          <Route path="/sent-dashes" element={<ProtectedRoute><SentDashPage /></ProtectedRoute>} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/date" element={<DatePage />} />
                    <Route path="/meeting" element={<MeetingPage />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/myinfo" element={<MyInfoPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      </AcceptedDashProvider>
    </ThemeProvider>
  );
}
