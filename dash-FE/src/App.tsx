import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import GNB from './components/GNB';
import HomePage from './pages/HomePage';
import DatePage from './pages/DatePage';
import MeetingPage from './pages/MeetingPage';
import CommunityPage from './pages/CommunityPage';
import MyInfoPage from './pages/MyInfoPage';
import SignupPage from './pages/SignupPage';

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
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
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
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
