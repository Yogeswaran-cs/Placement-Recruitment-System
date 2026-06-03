import React, { useContext, useEffect, useState } from 'react';
import { PlacementContext } from '../context/PlacementContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Dashboard = () => {
  const {
    state,
    fetchStats,
    fetchDrives,
    fetchApplications,
    fetchInterviews,
    syncData
  } = useContext(PlacementContext);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [syncStatus, setSyncStatus] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      await fetchStats();
      await fetchDrives();
      await fetchApplications();
      await fetchInterviews();
    };
    loadDashboardData();
  }, []);

  const handleSync = async () => {
    setSyncStatus('Synchronizing...');
    setLocalLoading(true);
    const res = await syncData();
    setLocalLoading(false);
    if (res.success) {
      let totalFetched = 0;
      let totalInserted = 0;
      if (res.data) {
        for (const key of Object.keys(res.data)) {
          totalFetched += res.data[key].fetched || 0;
          totalInserted += res.data[key].inserted || 0;
        }
      }
      setSyncStatus(`Sync successful! Fetched: ${totalFetched}, Inserted: ${totalInserted}`);
      // Refresh stats after sync
      await fetchStats();
    } else {
      setSyncStatus(`Sync failed: ${res.error}`);
    }
  };

  const { stats, drives, applications, interviews } = state;

  // Filter open drives for upcoming
  const upcomingDrives = drives ? drives.filter(d => d.status === 'OPEN').slice(0, 5) : [];

  // Filter applications that are shortlisted or selected
  const shortlisted = applications ? applications.filter(a => a.status === 'SHORTLISTED' || a.status === 'SELECTED').slice(0, 5) : [];

  // Filter recent scheduled interviews
  const recentInterviews = interviews ? interviews.filter(i => i.status === 'SCHEDULED').slice(0, 5) : [];

  const total = stats?.placementAnalysis?.totalStudents ?? 0;
  const placed = stats?.placementAnalysis?.placedStudents ?? 0;
  const unplaced = stats?.placementAnalysis?.unplacedStudents ?? 0;
  const rate = stats?.placementAnalysis?.placementRate ?? 0;

  return (
    <div className="dashboard-container">
      {/* Navigation Header */}
      <header className="dashboard-header">
        <div className="header-brand">
          <h1>Placement Portal</h1>
        </div>
        <div className="header-user">
          <span className="user-info">Logged in as: {user?.username} ({user?.role})</span>
          {user?.role === 'PLACEMENT_OFFICER' && (
            <nav className="header-nav">
              <Link to="/students" className="nav-link">Students</Link>
              <Link to="/drives" className="nav-link">Drives & Interviews</Link>
            </nav>
          )}
          {user?.role === 'STUDENT' && (
            <nav className="header-nav">
              <Link to="/apply" className="nav-link">Apply Drives</Link>
            </nav>
          )}
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="dashboard-main">
        {/* Sync Action Area */}
        <section className="sync-section">
          <div className="sync-card">
            <h2>Data Synchronization</h2>
            <p>Sync latest students list from external dataset API.</p>
            <button
              onClick={handleSync}
              className="sync-btn"
              data-testid="sync-btn"
              disabled={localLoading}
            >
              {localLoading ? 'Syncing...' : 'Sync Dataset'}
            </button>
            {syncStatus && <div className="sync-status-msg">{syncStatus}</div>}
          </div>
        </section>

        {/* Analytics Cards Grid (q15) */}
        <section className="stats-grid">
          <div className="stat-card">
            <h3>Total Candidates</h3>
            <div className="stat-value" data-testid="stat-total">{total}</div>
          </div>
          <div className="stat-card">
            <h3>Placed Students</h3>
            <div className="stat-value" data-testid="stat-placed">{placed}</div>
          </div>
          <div className="stat-card">
            <h3>Unplaced Students</h3>
            <div className="stat-value" data-testid="stat-unplaced">{unplaced}</div>
          </div>
          <div className="stat-card">
            <h3>Placement Rate</h3>
            <div className="stat-value" data-testid="stat-rate">{rate}%</div>
          </div>
        </section>

        {/* Multi-column Detail View */}
        <div className="details-grid">
          {/* Column 1: Upcoming Drives */}
          <div className="details-col">
            <h2>Upcoming Drives</h2>
            <div className="details-list">
              {upcomingDrives.length === 0 ? (
                <div className="empty-msg">No upcoming drives scheduled</div>
              ) : (
                upcomingDrives.map(drive => (
                  <div key={drive._id || drive.id} className="details-item">
                    <h4>{drive.company?.name}</h4>
                    <p>Role: {drive.jobRole}</p>
                    <p>Date: {new Date(drive.date).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Shortlisted Students */}
          <div className="details-col">
            <h2>Shortlisted / Selected Students</h2>
            <div className="details-list">
              {shortlisted.length === 0 ? (
                <div className="empty-msg">No candidates shortlisted yet</div>
              ) : (
                shortlisted.map(app => (
                  <div key={app._id || app.id} className="details-item">
                    <h4>{app.student?.name}</h4>
                    <p>Company: {app.drive?.company?.name}</p>
                    <p className={`status-badge status-${app.status.toLowerCase()}`}>
                      {app.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Scheduled Interviews */}
          <div className="details-col">
            <h2>Recent Scheduled Interviews</h2>
            <div className="details-list">
              {recentInterviews.length === 0 ? (
                <div className="empty-msg">No interviews scheduled</div>
              ) : (
                recentInterviews.map(interview => (
                  <div key={interview._id || interview.id} className="details-item">
                    <h4>{interview.application?.student?.name}</h4>
                    <p>Company: {interview.application?.drive?.company?.name}</p>
                    <p>Round {interview.roundNumber}: {interview.roundType}</p>
                    <p>Date: {new Date(interview.date).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
