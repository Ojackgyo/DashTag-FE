import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
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
import { ApiError, getToken } from './api/client';
import { getStudentVerificationStatus } from './api/studentVerification';
import { useSession } from './hooks/useSession';
import { useMe } from './hooks/useMe';
import { useChatStore } from './store/chatStore';
import QueryStatus from './components/QueryStatus';
import ServicePending from './components/ServicePending';
import { capabilities } from './api/capabilities';

function SessionCache() {
  useEffect(() => {
    let previous = getToken();
    const reset = () => {
      const current = getToken();
      if (current === previous) return;
      previous = current;
      queryClient.clear();
      useChatStore.getState().setActiveRoom(null);
    };
    window.addEventListener('dashtag-auth', reset);
    window.addEventListener('storage', reset);
    return () => { window.removeEventListener('dashtag-auth', reset); window.removeEventListener('storage', reset); };
  }, []);
  return null;
}

function ProfileGate({ children }: { children: React.ReactNode }) {
  const profile = useMe();
  if (profile.error instanceof ApiError && profile.error.status === 404) return <Navigate to="/signup" replace />;
  if (profile.isLoading || profile.error) return <QueryStatus loading={profile.isLoading} error={profile.error} retry={() => { void profile.refetch(); }} />;
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useSession();
  const verification = useQuery({ queryKey: ['studentVerification'], queryFn: getStudentVerificationStatus, enabled: !!token, retry: false });
  if (!token) return <Navigate to="/login" replace />;
  if (verification.isLoading || verification.error) return <QueryStatus loading={verification.isLoading} error={verification.error} retry={() => { void verification.refetch(); }} />;
  if (!verification.data?.verified) return <Navigate to="/signup" replace />;
  return <ProfileGate>{children}</ProfileGate>;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <GNB />
      <main className="app-main" style={{ flex: 1 }}>
        {children}
      </main>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <SessionCache />
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
                    <Route path="/date" element={<ServicePending name="소개팅 상대 찾기" available={capabilities.profileDiscovery}><DatePage /></ServicePending>} />
                    <Route path="/meeting" element={<ServicePending name="미팅" available={capabilities.meetings}><MeetingPage /></ServicePending>} />
                    <Route path="/community" element={<ServicePending name="소모임" available={capabilities.communities}><CommunityPage /></ServicePending>} />
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
