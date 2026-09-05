import React from 'react';

export default function Dashboard() {
  return (
    <div className="page-container">
      <h2>Admin Dashboard</h2>
      <p>Welcome to the Member 1 Blockchain Admin Dashboard.</p>
      <div className="card">
        <h3>Architecture Overview</h3>
        <p>This frontend connects exclusively to the local Hardhat deployment of the Digital Credential platform.</p>
        <p>Use the navigation above to:</p>
        <ul>
          <li><strong>Institutions:</strong> Register institutions and authorize issuers (Platform/Institution Admin).</li>
          <li><strong>Certificates:</strong> Issue, revoke, verify, and version digital certificates (Authorized Issuers/Public).</li>
          <li><strong>Activity:</strong> Listen to live on-chain events.</li>
        </ul>
      </div>
    </div>
  );
}
