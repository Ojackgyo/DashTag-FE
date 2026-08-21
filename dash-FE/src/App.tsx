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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // 개발 중에는 로그인 여부와 관계없이 모든 페이지 접근을 허용합니다.
  // 로그인 기능을 다시 사용할 때 기존 인증 가드 로직을 복구하세요.
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
    <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AcceptedDashProvider>
      <BrowserRouter>
        <Routes>
          {/* 로그인 기능 비활성화 중: 로그인 주소도 홈으로 바로 이동 */}
          <Route path="/login" element={<Navigate to="/" replace />} />
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
    </QueryClientProvider>
  );
}
