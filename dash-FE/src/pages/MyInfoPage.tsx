import { useNavigate } from 'react-router-dom';
import './MyInfoPage.css';

export default function MyInfoPage() {
  const navigate = useNavigate();

  return (
    <div className="myinfo-page">
      <div className="page-top">
        <h1 className="page-title">내 정보</h1>
      </div>

      <div className="profile-hero">
        <div className="my-avatar">
          <span>🙂</span>
        </div>
        <button className="edit-profile-btn" onClick={() => navigate('/signup')}>
          프로필 편집
        </button>
      </div>

      <div className="info-section">
        <div className="info-group">
          <h3 className="info-group-title">기본 정보</h3>
          <div className="info-rows">
            <div className="info-row">
              <span className="info-label">닉네임</span>
              <span className="info-value empty">미설정</span>
            </div>
            <div className="info-row">
              <span className="info-label">나이</span>
              <span className="info-value empty">미설정</span>
            </div>
            <div className="info-row">
              <span className="info-label">학과</span>
              <span className="info-value empty">미설정</span>
            </div>
            <div className="info-row">
              <span className="info-label">MBTI</span>
              <span className="info-value empty">미설정</span>
            </div>
          </div>
        </div>

        <div className="info-group">
          <h3 className="info-group-title">외모 정보</h3>
          <div className="info-rows">
            <div className="info-row">
              <span className="info-label">얼굴상</span>
              <span className="info-value empty">미설정</span>
            </div>
            <div className="info-row">
              <span className="info-label">키 / 몸무게</span>
              <span className="info-value empty">미설정</span>
            </div>
            <div className="info-row">
              <span className="info-label">피부톤</span>
              <span className="info-value empty">미설정</span>
            </div>
            <div className="info-row">
              <span className="info-label">헤어스타일</span>
              <span className="info-value empty">미설정</span>
            </div>
          </div>
        </div>

        <div className="info-group">
          <h3 className="info-group-title">라이프스타일</h3>
          <div className="info-rows">
            <div className="info-row">
              <span className="info-label">흡연</span>
              <span className="info-value empty">미설정</span>
            </div>
            <div className="info-row">
              <span className="info-label">타투</span>
              <span className="info-value empty">미설정</span>
            </div>
            <div className="info-row">
              <span className="info-label">군대</span>
              <span className="info-value empty">미설정</span>
            </div>
          </div>
        </div>
      </div>

      <button className="start-fill-btn" onClick={() => navigate('/signup')}>
        프로필 작성 시작하기
      </button>

      <div className="bottom-spacer" />
    </div>
  );
}
