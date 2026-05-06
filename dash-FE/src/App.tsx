import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AcceptedDashProvider } from './context/AcceptedDashContext';
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
          <Route path="/received-dashes" element={<ReceivedDashPage />} />
          <Route path="/sent-dashes" element={<SentDashPage />} />
          <Route
            path="/*"
            element={
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
            }
          />
        </Routes>
      </BrowserRouter>
      </AcceptedDashProvider>
    </ThemeProvider>
  );
}
