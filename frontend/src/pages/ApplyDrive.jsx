import React, { useContext, useEffect, useState } from 'react';
import { PlacementContext } from '../context/PlacementContext';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ApplyDrive = () => {
  const {
    state,
    fetchStudents,
    fetchDrives,
    fetchApplications,
    applyForDrive
  } = useContext(PlacementContext);

  const { user, logout } = useContext(AuthContext);
  const [studentProfile, setStudentProfile] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const loadStudentData = async () => {
      await fetchDrives();
      await fetchApplications();
      
      // Fetch all students to look up this student's profile details
      const res = await fetchStudents(1, 100);
      if (state.students && user?.studentId) {
        const profile = state.students.find(s => s.studentId === user.studentId);
        if (profile) {
          setStudentProfile(profile);
        }
      }
    };
    loadStudentData();
  }, [user]);

  // Secondary effect to sync studentProfile when state.students finishes loading
  useEffect(() => {
    if (state.students && user?.studentId) {
      const profile = state.students.find(s => s.studentId === user.studentId);
      if (profile) {
        setStudentProfile(profile);
      }
    }
  }, [state.students]);

  const handleApply = async (driveId) => {
    if (!user?.studentId) {
      setApplyMessage('You must have a linked student ID to apply');
      return;
    }
    
    setLocalLoading(true);
    setApplyMessage('');
    const res = await applyForDrive(user.studentId, driveId);
    setLocalLoading(false);
    
    if (res.success) {
      setApplyMessage(res.message || 'Successfully applied!');
      // Reload applications list to reflect the new application
      await fetchApplications();
    } else {
      setApplyMessage(`Application failed: ${res.error}`);
    }
  };

  const { drives, applications } = state;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-brand">
          <h1>Placement Portal</h1>
        </div>
        <div className="header-user">
          <nav className="header-nav">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/apply" className="nav-link active">Apply Drives</Link>
          </nav>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Main Student Portal */}
      <main className="dashboard-main">
        {/* Profile Card */}
        {studentProfile ? (
          <section className="profile-section">
            <div className="profile-card">
              <h3>Student Profile Details</h3>
              <div className="profile-grid">
                <p><strong>Name:</strong> {studentProfile.name}</p>
                <p><strong>Student ID:</strong> {studentProfile.studentId}</p>
                <p><strong>Department:</strong> {studentProfile.department}</p>
                <p><strong>CGPA:</strong> {studentProfile.cgpa}</p>
                <p><strong>Placement Status:</strong> {studentProfile.status}</p>
              </div>
            </div>
          </section>
        ) : (
          <div className="warning-banner">
            Loading your student profile. If this card persists, ensure your student record has been synced by a placement officer.
          </div>
        )}

        <div className="page-header-actions">
          <h2>Recruitment Drives</h2>
        </div>

        {applyMessage && (
          <div className="info-banner" data-testid="apply-status-banner">
            {applyMessage}
          </div>
        )}

        {/* Drives List */}
        <section className="portal-section">
          {drives.length === 0 ? (
            <div className="empty-msg">No drives are currently configured</div>
          ) : (
            <div className="portal-cards">
              {drives.map(drive => {
                const company = drive.company;
                const minCgpa = company?.minimumCgpa ?? 0;
                const eligibleDeps = company?.eligibleDepartments ?? [];
                
                // 1. Check if already applied
                const app = applications.find(a => a.driveId === drive.driveId && a.studentId === user.studentId);
                const hasApplied = !!app;

                // 2. Check CGPA eligibility
                const hasCgpaEligible = studentProfile ? studentProfile.cgpa >= minCgpa : false;

                // 3. Check Department eligibility
                const hasDeptEligible = studentProfile && eligibleDeps.some(
                  dept => dept.trim().toUpperCase() === studentProfile.department.trim().toUpperCase()
                );

                const isEligible = hasCgpaEligible && hasDeptEligible;
                const isClosed = drive.status?.toLowerCase() === 'closed';

                return (
                  <div key={drive._id || drive.id} className="portal-card" data-testid={`drive-card-${drive.driveId}`}>
                    <div className="card-header">
                      <h4>{drive.title}</h4>
                      <span className={`status-badge status-${drive.status}`}>
                        {drive.status}
                      </span>
                    </div>
                    <div className="card-body">
                      <p><strong>Company:</strong> {company?.name}</p>
                      <p><strong>Role:</strong> {company?.role}</p>
                      <p><strong>Package:</strong> {company?.package} LPA</p>
                      <p><strong>Deadline:</strong> {drive.registrationDeadline}</p>
                      <p><strong>Criteria:</strong> Min CGPA {minCgpa} | Depts: {eligibleDeps.join(', ')}</p>
                      
                      {studentProfile && !hasApplied && !isClosed && (
                        <div className="eligibility-status">
                          {!hasCgpaEligible && (
                            <p className="error-text">Your CGPA meets not company threshold of {minCgpa}</p>
                          )}
                          {!hasDeptEligible && (
                            <p className="error-text">Your department {studentProfile.department} is not in eligible list</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="card-footer">
                      {hasApplied ? (
                        <div className="application-status-tracker">
                          <span>Status:</span>
                          <span className={`status-badge status-${app.status.toLowerCase()}`}>
                            {app.status}
                          </span>
                        </div>
                      ) : isClosed ? (
                        <button className="action-btn-disabled" disabled>Closed</button>
                      ) : !isEligible ? (
                        <button className="action-btn-disabled" disabled>Ineligible</button>
                      ) : (
                        <button
                          onClick={() => handleApply(drive.driveId)}
                          className="action-btn-primary"
                          data-testid="apply-drive-btn"
                          disabled={localLoading}
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ApplyDrive;
