import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AcceptedDashProvider } from './context/AcceptedDashContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
import Header from './components/Header';
import GNB from './components/GNB';
import HomePage from './pages/HomePage';
import DatePage from './pages/DatePage';
import MeetingPage from './pages/MeetingPage';
import CommunityPage from './pages/CommunityPage';
import MyInfoPage from './pages/MyInfoPage';
import ChatPage from './pages/ChatPage';
import SignupPage from './pages/SignupPage';
import ReceivedDashPage from './pages/ReceivedDashPage';
import SentDashPage from './pages/SentDashPage';
import LoginPage from './pages/LoginPage';
import LegalPage from './pages/LegalPage';
import { isLoggedIn } from './api/client';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;
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
    <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AcceptedDashProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/legal/:type" element={<LegalPage />} />
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
    </QueryClientProvider>
  );
}
