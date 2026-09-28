import React from 'react';
import { useParams } from 'react-router-dom';

function UserProfile() {
  const { userId } = useParams();

  return (
    <div className="dashboard">
      <div className="dashboard-section">
        <h2>User Profile</h2>
        <p>Profile details for user #{userId} will appear here as the marketplace grows.</p>
      </div>
    </div>
  );
}

export default UserProfile;
