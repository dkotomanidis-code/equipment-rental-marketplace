import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function UserProfile({ language, setLanguage }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [verificationData, setVerificationData] = useState({
    idDocumentUrl: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const translations = {
    en: {
      profile: 'Profile',
      verified: 'Verified',
      unverified: 'Unverified',
      pending: 'Pending Review',
      trustScore: 'Trust Score',
      totalRentals: 'Total Rentals',
      earnings: 'Total Earnings',
      badges: 'Trust Badges',
      joinedDate: 'Joined',
      bio: 'Bio',
      phone: 'Phone',
      email: 'Email',
      editProfile: 'Edit Profile',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      verifications: 'Verifications',
      idVerification: 'ID Verification',
      emailVerification: 'Email Verification',
      phoneVerification: 'Phone Verification',
      requestVerification: 'Request Verification',
      uploadIDDocument: 'Upload ID Document',
      verifyPhone: 'Verify Phone',
      verifyEmail: 'Verify Email',
      firstName: 'First Name',
      lastName: 'Last Name',
      profilePicture: 'Profile Picture URL',
      noData: 'No data available',
      verificationPending: 'Verification pending - please wait for admin review',
      verificationSuccess: 'Verification successful!',
      idVerified: '✓ ID Verified',
      emailVerified: '✓ Email Verified',
      phoneVerified: '✓ Phone Verified',
      scamPrevention: 'This user is verified and trusted',
      loading: 'Loading profile...',
      error: 'Error loading profile',
    },
    ka: {
      profile: 'პროფილი',
      verified: 'დამოწმებული',
      unverified: 'დაუმოწმებელი',
      pending: 'მიმდებარე მიმოხილვა',
      trustScore: 'სანდოობის ქულა',
      totalRentals: 'სულ ქირაობა',
      earnings: 'სულ შემოსავალი',
      badges: 'სანდოობის ბეჯი',
      joinedDate: 'შეერთებული',
      bio: 'ბიო',
      phone: 'ტელეფონი',
      email: 'ელფოსტა',
      editProfile: 'პროფილის რედაქტირება',
      saveChanges: 'ცვლილებების შენახვა',
      cancel: 'გაუქმება',
      verifications: 'დამოწმებები',
      idVerification: 'ID დამოწმება',
      emailVerification: 'ელფოსტის დამოწმება',
      phoneVerification: 'ტელეფონის დამოწმება',
      requestVerification: 'მოითხოვეთ დამოწმება',
      uploadIDDocument: 'აიტანეთ ID დოკუმენტი',
      verifyPhone: 'დაამოწმეთ ტელეფონი',
      verifyEmail: 'დაამოწმეთ ელფოსტა',
      firstName: 'პირი სახელი',
      lastName: 'გვარი',
      profilePicture: 'პროფილის სურათი URL',
      noData: 'ახლომდებარე ინფორმაცია არ არის',
      verificationPending: 'დამოწმება მიმდებარე - გთხოვთ დაელოდოთ ადმინის მიმოხილვას',
      verificationSuccess: 'დამოწმება წარმატებული!',
      idVerified: '✓ ID დამოწმებული',
      emailVerified: '✓ ელფოსტა დამოწმებული',
      phoneVerified: '✓ ტელეფონი დამოწმებული',
      scamPrevention: 'ეს მომხმარებელი დამოწმებული და სანდოა',
      loading: 'პროფილის ჩატვირთვა...',
      error: 'შეცდომა პროფილის ჩატვირთვაში',
    },
    ru: {
      profile: 'Профиль',
      verified: 'Проверено',
      unverified: 'Не проверено',
      pending: 'На рассмотрении',
      trustScore: 'Рейтинг доверия',
      totalRentals: 'Всего сдач',
      earnings: 'Общие доходы',
      badges: 'Значки доверия',
      joinedDate: 'Присоединился',
      bio: 'О себе',
      phone: 'Телефон',
      email: 'Email',
      editProfile: 'Редактировать профиль',
      saveChanges: 'Сохранить изменения',
      cancel: 'Отмена',
      verifications: 'Проверки',
      idVerification: 'Проверка удостоверения',
      emailVerification: 'Проверка электронной почты',
      phoneVerification: 'Проверка номера телефона',
      requestVerification: 'Запросить проверку',
      uploadIDDocument: 'Загрузить документ удостоверения',
      verifyPhone: 'Проверить номер телефона',
      verifyEmail: 'Проверить электронную почту',
      firstName: 'Имя',
      lastName: 'Фамилия',
      profilePicture: 'URL изображения профиля',
      noData: 'Нет доступных данных',
      verificationPending: 'Проверка в процессе - пожалуйста, дождитесь рассмотрения администратором',
      verificationSuccess: 'Проверка успешна!',
      idVerified: '✓ Удостоверение проверено',
      emailVerified: '✓ Email проверен',
      phoneVerified: '✓ Телефон проверен',
      scamPrevention: 'Этот пользователь проверен и надежен',
      loading: 'Загрузка профиля...',
      error: 'Ошибка при загрузке профиля',
    },
  };

  const t = translations[language] || translations['en'];

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Check if it's own profile
      let ownUserId = null;
      if (userId === 'me') {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/users/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
        setFormData(response.data);
        setIsOwnProfile(true);
      } else {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
        setFormData(response.data);
      }
    } catch (err) {
      setError(t.error);
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/users/profile/update`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(response.data.user);
      setSuccess(t.verificationSuccess);
      setEditMode(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    }
  };

  const handleRequestIDVerification = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/users/verification/request-id`,
        { idDocumentUrl: verificationData.idDocumentUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(t.verificationPending);
      setVerificationData({ ...verificationData, idDocumentUrl: '' });
      fetchProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error requesting ID verification');
    }
  };

  const handleVerifyPhone = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/users/verification/request-phone`,
        { phone: verificationData.phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(t.verificationSuccess);
      setVerificationData({ ...verificationData, phone: '' });
      fetchProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error verifying phone');
    }
  };

  const VerificationBadge = ({ verified, label }) => {
    return (
      <div className={`verification-badge ${verified ? 'verified' : 'unverified'}`}>
        <span className="badge-icon">{verified ? '✓' : '✗'}</span>
        <span className="badge-label">{label}</span>
      </div>
    );
  };

  const TrustScore = ({ score }) => {
    return (
      <div className="trust-score-container">
        <div className="trust-score-number">{score}</div>
        <div className="trust-score-bar">
          <div className="trust-score-fill" style={{ width: `${Math.min(score, 100)}%` }}></div>
        </div>
        <div className="trust-score-label">/ 100</div>
      </div>
    );
  };

  if (loading) {
    return <div className="user-profile-page">{t.loading}</div>;
  }

  if (!profile) {
    return <div className="user-profile-page">{t.error}</div>;
  }

  return (
    <div className="user-profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <img src={profile.profilePicture || 'https://via.placeholder.com/150'} alt={profile.username} />
          {profile.verificationStatus === 'verified' && (
            <div className="verified-badge">✓</div>
          )}
        </div>

        <div className="profile-header-info">
          <h1>{profile.firstName} {profile.lastName}</h1>
          <p className="username">@{profile.username}</p>
          {profile.verificationStatus === 'verified' && (
            <p className="verified-status">{t.scamPrevention}</p>
          )}
        </div>

        {isOwnProfile && (
          <div className="profile-actions">
            {!editMode ? (
              <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                {t.editProfile}
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
                {t.cancel}
              </button>
            )}
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="profile-container">
        {/* Edit Form */}
        {editMode && isOwnProfile && (
          <div className="edit-form-section">
            <h2>{t.editProfile}</h2>
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>{t.firstName}</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>{t.lastName}</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t.phone}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>{t.bio}</label>
                <textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>{t.profilePicture}</label>
                <input
                  type="url"
                  name="profilePicture"
                  value={formData.profilePicture || ''}
                  onChange={handleInputChange}
                />
              </div>

              <button type="submit" className="btn btn-primary">{t.saveChanges}</button>
            </form>
          </div>
        )}

        {/* Profile Info */}
        <div className="profile-info-section">
          <h2>{t.profile}</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>{t.email}</label>
              <p>{profile.email}</p>
            </div>
            <div className="info-item">
              <label>{t.phone}</label>
              <p>{profile.phone || t.noData}</p>
            </div>
            <div className="info-item">
              <label>{t.joinedDate}</label>
              <p>{new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
            {profile.isOwner && (
              <>
                <div className="info-item">
                  <label>{t.totalRentals}</label>
                  <p>{profile.totalRentals || 0}</p>
                </div>
                <div className="info-item">
                  <label>{t.earnings}</label>
                  <p>${profile.totalEarnings || 0}</p>
                </div>
              </>
            )}
          </div>

          {profile.bio && (
            <div className="bio-section">
              <h3>{t.bio}</h3>
              <p>{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Trust Score */}
        <div className="trust-section">
          <h2>{t.trustScore}</h2>
          <TrustScore score={profile.trustScore} />
        </div>

        {/* Verifications */}
        <div className="verifications-section">
          <h2>{t.verifications}</h2>
          <div className="verification-list">
            <VerificationBadge verified={profile.idVerified} label={t.idVerification} />
            <VerificationBadge verified={profile.emailVerified} label={t.emailVerification} />
            <VerificationBadge verified={profile.phoneVerified} label={t.phoneVerification} />
          </div>

          {isOwnProfile && (
            <div className="verification-requests">
              {!profile.idVerified && (
                <div className="verification-form">
                  <label>{t.uploadIDDocument}</label>
                  <input
                    type="url"
                    placeholder="Document URL"
                    value={verificationData.idDocumentUrl}
                    onChange={(e) => setVerificationData({ ...verificationData, idDocumentUrl: e.target.value })}
                  />
                  <button className="btn btn-secondary" onClick={handleRequestIDVerification}>
                    {t.requestVerification}
                  </button>
                </div>
              )}

              {!profile.phoneVerified && (
                <div className="verification-form">
                  <label>{t.verifyPhone}</label>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={verificationData.phone}
                    onChange={(e) => setVerificationData({ ...verificationData, phone: e.target.value })}
                  />
                  <button className="btn btn-secondary" onClick={handleVerifyPhone}>
                    {t.requestVerification}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Badges */}
        {profile.badges && profile.badges.length > 0 && (
          <div className="badges-section">
            <h2>{t.badges}</h2>
            <div className="badges-grid">
              {profile.badges.map((badge, idx) => (
                <div key={idx} className="badge-item">
                  <span className="badge-emoji">🏆</span>
                  <p>{badge.badgeName}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .user-profile-page {
          padding: 2rem;
          background-color: #f5f5f5;
          min-height: 100vh;
        }

        .profile-header {
          max-width: 1000px;
          margin: 0 auto 2rem;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 2rem;
          align-items: center;
        }

        .profile-avatar {
          position: relative;
          width: 150px;
          height: 150px;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #667eea;
        }

        .verified-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          background: #4caf50;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          border: 3px solid white;
        }

        .profile-header-info h1 {
          margin: 0;
          color: #333;
        }

        .username {
          color: #999;
          margin: 0.5rem 0;
          font-size: 0.95rem;
        }

        .verified-status {
          color: #4caf50;
          font-weight: 600;
          margin: 0.5rem 0 0 0;
        }

        .profile-actions {
          display: flex;
          gap: 1rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
        }

        .btn-primary {
          background-color: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background-color: #5568d3;
        }

        .btn-secondary {
          background-color: #999;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #777;
        }

        .error-message {
          max-width: 1000px;
          margin: 0 auto 1rem;
          background-color: #f8d7da;
          color: #721c24;
          padding: 1rem;
          border-radius: 4px;
          border: 1px solid #f5c6cb;
        }

        .success-message {
          max-width: 1000px;
          margin: 0 auto 1rem;
          background-color: #d4edda;
          color: #155724;
          padding: 1rem;
          border-radius: 4px;
          border: 1px solid #c3e6cb;
        }

        .profile-container {
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          gap: 2rem;
        }

        .edit-form-section,
        .profile-info-section,
        .trust-section,
        .verifications-section,
        .badges-section {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        h2 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #667eea;
          padding-bottom: 1rem;
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .info-item label {
          font-weight: 600;
          color: #667eea;
          display: block;
          margin-bottom: 0.5rem;
        }

        .info-item p {
          margin: 0;
          color: #666;
        }

        .bio-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .bio-section h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .bio-section p {
          margin: 0;
          color: #666;
          line-height: 1.6;
        }

        .trust-score-container {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1rem;
          align-items: center;
        }

        .trust-score-number {
          font-size: 2.5rem;
          font-weight: bold;
          color: #667eea;
        }

        .trust-score-bar {
          background: #eee;
          height: 20px;
          border-radius: 10px;
          overflow: hidden;
        }

        .trust-score-fill {
          background: linear-gradient(90deg, #4caf50, #667eea);
          height: 100%;
          transition: width 0.3s;
        }

        .trust-score-label {
          text-align: right;
          color: #999;
          font-size: 0.9rem;
        }

        .verification-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .verification-badge {
          padding: 1rem;
          border-radius: 6px;
          border: 2px solid #ddd;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .verification-badge.verified {
          background-color: #d4edda;
          border-color: #4caf50;
        }

        .verification-badge.unverified {
          background-color: #f8d7da;
          border-color: #dc3545;
        }

        .badge-icon {
          font-size: 1.5rem;
          font-weight: bold;
          width: 30px;
          text-align: center;
        }

        .verification-badge.verified .badge-icon {
          color: #4caf50;
        }

        .verification-badge.unverified .badge-icon {
          color: #dc3545;
        }

        .badge-label {
          font-weight: 600;
          color: #333;
        }

        .verification-requests {
          display: grid;
          gap: 1rem;
        }

        .verification-form {
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 6px;
          border: 1px solid #eee;
        }

        .verification-form label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .verification-form input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 0.75rem;
          font-family: inherit;
        }

        .verification-form input:focus {
          outline: none;
          border-color: #667eea;
        }

        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 1rem;
        }

        .badge-item {
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 6px;
          text-align: center;
          border: 1px solid #eee;
        }

        .badge-emoji {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .badge-item p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .profile-header {
            grid-template-columns: auto;
            gap: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .verification-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default UserProfile;