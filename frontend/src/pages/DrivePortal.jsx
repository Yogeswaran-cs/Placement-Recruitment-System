import React, { useContext, useEffect, useState } from 'react';
import { PlacementContext } from '../context/PlacementContext';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const DrivePortal = () => {
  const {
    state,
    fetchCompanies,
    fetchDrives,
    fetchApplications,
    fetchInterviews,
    createCompany,
    createDrive,
    updateDrive,
    updateApplicationStatus,
    scheduleInterview,
    updateInterviewResult
  } = useContext(PlacementContext);
  
  const { logout } = useContext(AuthContext);

  // Modal controls
  const [activeModal, setActiveModal] = useState(null); // 'company', 'drive', 'interview', 'result'
  const [editingDriveId, setEditingDriveId] = useState(null);
  const [activeInterviewId, setActiveInterviewId] = useState(null);
  const [formError, setFormError] = useState('');

  // Company Form fields
  const [compId, setCompId] = useState('');
  const [compName, setCompName] = useState('');
  const [compRole, setCompRole] = useState('');
  const [compPackage, setCompPackage] = useState('');
  const [compDeps, setCompDeps] = useState('');
  const [compCgpa, setCompCgpa] = useState('');
  const [compDate, setCompDate] = useState('');
  const [compStatus, setCompStatus] = useState('upcoming');

  // Drive Form fields
  const [drvId, setDrvId] = useState('');
  const [drvCompId, setDrvCompId] = useState('');
  const [drvTitle, setDrvTitle] = useState('');
  const [drvMode, setDrvMode] = useState('offline');
  const [drvLoc, setDrvLoc] = useState('');
  const [drvDeadline, setDrvDeadline] = useState('');
  const [drvRounds, setDrvRounds] = useState('Aptitude, Technical, HR');
  const [drvStatus, setDrvStatus] = useState('open');

  // Interview Form fields
  const [intAppId, setIntAppId] = useState('');
  const [intRound, setIntRound] = useState('Technical');
  const [intInterviewer, setIntInterviewer] = useState('');
  const [intDate, setIntDate] = useState('');

  // Result Form fields
  const [resValue, setResValue] = useState('pass');
  const [resFeedback, setResFeedback] = useState('');

  useEffect(() => {
    fetchCompanies();
    fetchDrives();
    fetchApplications();
    fetchInterviews();
  }, []);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!compId.trim() || !compName.trim() || !compDeps.trim() || !compCgpa || !compPackage) {
      setFormError('All required fields must be filled');
      return;
    }

    const payload = {
      companyId: compId.trim(),
      name: compName.trim(),
      role: compRole.trim(),
      package: parseFloat(compPackage),
      eligibleDepartments: compDeps.split(',').map(d => d.trim()),
      minimumCgpa: parseFloat(compCgpa),
      driveDate: compDate,
      status: compStatus
    };

    const res = await createCompany(payload);
    if (res.success) {
      setActiveModal(null);
      fetchCompanies();
    } else {
      setFormError(res.error || 'Failed to create company');
    }
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!drvId.trim() || !drvCompId || !drvTitle.trim()) {
      setFormError('Drive ID, Company and Title are required');
      return;
    }

    const payload = {
      driveId: drvId.trim(),
      companyId: drvCompId,
      title: drvTitle.trim(),
      mode: drvMode,
      location: drvLoc.trim(),
      registrationDeadline: drvDeadline,
      rounds: drvRounds.split(',').map(r => r.trim()),
      status: drvStatus
    };

    const res = await createDrive(payload);
    if (res.success) {
      setActiveModal(null);
      fetchDrives();
    } else {
      setFormError(res.error || 'Failed to create drive');
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!intAppId || !intRound.trim() || !intDate) {
      setFormError('Application, Round Name and Interview Date are required');
      return;
    }

    const payload = {
      applicationId: intAppId,
      round: intRound.trim(),
      interviewer: intInterviewer.trim(),
      interviewDate: intDate
    };

    const res = await scheduleInterview(payload);
    if (res.success) {
      setActiveModal(null);
      fetchInterviews();
    } else {
      setFormError(res.error || 'Failed to schedule interview');
    }
  };

  const handleUpdateResult = async (e) => {
    e.preventDefault();
    setFormError('');

    const res = await updateInterviewResult(activeInterviewId, {
      result: resValue,
      feedback: resFeedback.trim()
    });

    if (res.success) {
      setActiveModal(null);
      fetchInterviews();
      fetchApplications(); // Reload applications as their status changes
    } else {
      setFormError(res.error || 'Failed to update result');
    }
  };

  const toggleDriveStatus = async (drive) => {
    const nextStatus = drive.status === 'open' ? 'closed' : 'open';
    await updateDrive(drive._id || drive.id, { status: nextStatus });
    fetchDrives();
  };

  const handleAppStatusChange = async (appId, newStatus) => {
    await updateApplicationStatus(appId, newStatus);
    fetchApplications();
  };

  const { companies, drives, applications, interviews, loading } = state;

  return (
    <div className="dashboard-container">
      {/* Navigation Header */}
      <header className="dashboard-header">
        <div className="header-brand">
          <h1>Placement Portal</h1>
        </div>
        <div className="header-user">
          <nav className="header-nav">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/students" className="nav-link">Students</Link>
            <Link to="/drives" className="nav-link active">Drives & Interviews</Link>
          </nav>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Main content */}
      <main className="dashboard-main">
        <div className="page-header-actions">
          <h2>Placement Drives Portal</h2>
          <div className="action-buttons">
            <button onClick={() => { setActiveModal('company'); setFormError(''); }} className="action-btn-primary" data-testid="add-company-btn">
              Add Company
            </button>
            <button onClick={() => { setActiveModal('drive'); setFormError(''); }} className="action-btn-primary" data-testid="add-drive-btn">
              Create Drive
            </button>
            <button onClick={() => { setActiveModal('interview'); setFormError(''); }} className="action-btn-primary" data-testid="add-interview-btn">
              Schedule Interview
            </button>
          </div>
        </div>

        {/* Drives Section */}
        <section className="portal-section">
          <h3>Active Placement Drives</h3>
          {loading && drives.length === 0 ? (
            <div>Loading drives...</div>
          ) : drives.length === 0 ? (
            <div className="empty-msg">No drives configured</div>
          ) : (
            <div className="portal-cards">
              {drives.map(drive => (
                <div key={drive._id || drive.id} className="portal-card">
                  <div className="card-header">
                    <h4>{drive.title}</h4>
                    <span className={`status-badge status-${drive.status}`}>
                      {drive.status}
                    </span>
                  </div>
                  <div className="card-body">
                    <p><strong>Company:</strong> {drive.company?.name || drive.companyId}</p>
                    <p><strong>Mode:</strong> {drive.mode} ({drive.location})</p>
                    <p><strong>Deadline:</strong> {drive.registrationDeadline}</p>
                    <p><strong>Rounds:</strong> {drive.rounds ? drive.rounds.join(' -> ') : 'None'}</p>
                  </div>
                  <div className="card-footer">
                    <button
                      onClick={() => toggleDriveStatus(drive)}
                      className="edit-btn"
                      data-testid={`edit-drive-btn-${drive.driveId}`}
                    >
                      {drive.status === 'open' ? 'Close Drive' : 'Open Drive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Applications Section */}
        <section className="portal-section">
          <h3>Hiring Applications Status</h3>
          {applications.length === 0 ? (
            <div className="empty-msg">No applications received yet</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>App ID</th>
                  <th>Candidate</th>
                  <th>Department</th>
                  <th>CGPA</th>
                  <th>Drive / Company</th>
                  <th>Applied At</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app._id || app.id}>
                    <td>{app.applicationId}</td>
                    <td>{app.student?.name || app.studentId}</td>
                    <td>{app.student?.department}</td>
                    <td>{app.student?.cgpa}</td>
                    <td>{app.drive?.company?.name || app.driveId}</td>
                    <td>{app.appliedAt}</td>
                    <td>
                      <span className={`status-badge status-${app.status.toLowerCase()}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={app.status}
                        onChange={(e) => handleAppStatusChange(app._id || app.id, e.target.value)}
                        className="table-select"
                      >
                        <option value="APPLIED">Applied</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="SELECTED">Selected</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Interviews Section */}
        <section className="portal-section">
          <h3>Scheduled Interview Rounds</h3>
          {interviews.length === 0 ? (
            <div className="empty-msg">No interviews scheduled yet</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Int ID</th>
                  <th>Candidate</th>
                  <th>Company</th>
                  <th>Round</th>
                  <th>Interviewer</th>
                  <th>Date</th>
                  <th>Result</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map(int => (
                  <tr key={int._id || int.id}>
                    <td>{int.interviewId}</td>
                    <td>{int.application?.student?.name || int.applicationId}</td>
                    <td>{int.application?.drive?.company?.name}</td>
                    <td>{int.round}</td>
                    <td>{int.interviewer}</td>
                    <td>{int.interviewDate}</td>
                    <td>
                      <span className={`status-badge status-${int.result}`}>
                        {int.result}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => { setActiveInterviewId(int._id || int.id); setResValue(int.result === 'pending' ? 'pass' : int.result); setResFeedback(int.feedback || ''); setActiveModal('result'); }}
                        className="edit-btn"
                        data-testid={`update-interview-btn-${int.interviewId}`}
                      >
                        Result
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {/* MODAL 1: Add Company */}
      {activeModal === 'company' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Hiring Company</h3>
            {formError && <div className="form-error-banner">{formError}</div>}
            <form onSubmit={handleCreateCompany} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="companyId">Company ID</label>
                  <input type="text" id="companyId" value={compId} onChange={(e) => setCompId(e.target.value)} data-testid="company-id-input" placeholder="e.g. CMP501" />
                </div>
                <div className="form-group">
                  <label htmlFor="companyName">Company Name</label>
                  <input type="text" id="companyName" value={compName} onChange={(e) => setCompName(e.target.value)} data-testid="company-name-input" placeholder="e.g. Google" />
                </div>
                <div className="form-group">
                  <label htmlFor="companyRole">Job Role</label>
                  <input type="text" id="companyRole" value={compRole} onChange={(e) => setCompRole(e.target.value)} data-testid="company-role-input" placeholder="e.g. ML Engineer" />
                </div>
                <div className="form-group">
                  <label htmlFor="companyPackage">Package (LPA)</label>
                  <input type="number" id="companyPackage" value={compPackage} onChange={(e) => setCompPackage(e.target.value)} data-testid="company-package-input" placeholder="e.g. 12" />
                </div>
                <div className="form-group">
                  <label htmlFor="companyDeps">Eligible Departments (comma-separated)</label>
                  <input type="text" id="companyDeps" value={compDeps} onChange={(e) => setCompDeps(e.target.value)} data-testid="company-eligible-input" placeholder="e.g. CSE, IT, AI&DS" />
                </div>
                <div className="form-group">
                  <label htmlFor="companyCgpa">Minimum CGPA</label>
                  <input type="number" step="0.01" id="companyCgpa" value={compCgpa} onChange={(e) => setCompCgpa(e.target.value)} data-testid="company-cgpa-input" placeholder="e.g. 7.5" />
                </div>
                <div className="form-group">
                  <label htmlFor="companyDate">Drive Date</label>
                  <input type="date" id="companyDate" value={compDate} onChange={(e) => setCompDate(e.target.value)} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setActiveModal(null)} className="action-btn-secondary">Cancel</button>
                <button type="submit" className="action-btn-primary" data-testid="submit-company-btn">Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Drive */}
      {activeModal === 'drive' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Recruitment Drive</h3>
            {formError && <div className="form-error-banner">{formError}</div>}
            <form onSubmit={handleCreateDrive} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="driveId">Drive ID</label>
                  <input type="text" id="driveId" value={drvId} onChange={(e) => setDrvId(e.target.value)} data-testid="drive-id-input" placeholder="e.g. DRV101" />
                </div>
                <div className="form-group">
                  <label htmlFor="driveCompany">Select Company</label>
                  <select id="driveCompany" value={drvCompId} onChange={(e) => setDrvCompId(e.target.value)} data-testid="drive-company-select">
                    <option value="">-- Choose Company --</option>
                    {companies.map(c => (
                      <option key={c._id || c.id} value={c.companyId}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="driveTitle">Drive Title</label>
                  <input type="text" id="driveTitle" value={drvTitle} onChange={(e) => setDrvTitle(e.target.value)} data-testid="drive-title-input" placeholder="e.g. PixelCraft Hiring Drive" />
                </div>
                <div className="form-group">
                  <label htmlFor="driveMode">Mode</label>
                  <select id="driveMode" value={drvMode} onChange={(e) => setDrvMode(e.target.value)}>
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="driveLoc">Location</label>
                  <input type="text" id="driveLoc" value={drvLoc} onChange={(e) => setDrvLoc(e.target.value)} placeholder="e.g. Coimbatore" />
                </div>
                <div className="form-group">
                  <label htmlFor="driveDeadline">Registration Deadline</label>
                  <input type="date" id="driveDeadline" value={drvDeadline} onChange={(e) => setDrvDeadline(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="driveRounds">Interview Rounds (comma-separated)</label>
                  <input type="text" id="driveRounds" value={drvRounds} onChange={(e) => setDrvRounds(e.target.value)} placeholder="e.g. Aptitude, Technical, HR" />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setActiveModal(null)} className="action-btn-secondary">Cancel</button>
                <button type="submit" className="action-btn-primary" data-testid="submit-drive-btn">Create Drive</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Schedule Interview */}
      {activeModal === 'interview' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Schedule Candidate Interview</h3>
            {formError && <div className="form-error-banner">{formError}</div>}
            <form onSubmit={handleScheduleInterview} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="intApp">Select Application</label>
                  <select id="intApp" value={intAppId} onChange={(e) => setIntAppId(e.target.value)} data-testid="interview-application-select">
                    <option value="">-- Choose Candidate App --</option>
                    {applications.filter(a => a.status === 'APPLIED' || a.status === 'SHORTLISTED').map(a => (
                      <option key={a._id || a.id} value={a.applicationId}>
                        {a.applicationId} - {a.student?.name} ({a.drive?.company?.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="intRoundName">Round Name</label>
                  <input type="text" id="intRoundName" value={intRound} onChange={(e) => setIntRound(e.target.value)} data-testid="interview-round-input" placeholder="e.g. Technical, HR" />
                </div>
                <div className="form-group">
                  <label htmlFor="intInterviewerName">Interviewer Name</label>
                  <input type="text" id="intInterviewerName" value={intInterviewer} onChange={(e) => setIntInterviewer(e.target.value)} placeholder="Enter interviewer name" />
                </div>
                <div className="form-group">
                  <label htmlFor="intDateVal">Interview Date</label>
                  <input type="date" id="intDateVal" value={intDate} onChange={(e) => setIntDate(e.target.value)} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setActiveModal(null)} className="action-btn-secondary">Cancel</button>
                <button type="submit" className="action-btn-primary" data-testid="submit-interview-btn">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Update Interview Result */}
      {activeModal === 'result' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Update Interview Result</h3>
            {formError && <div className="form-error-banner">{formError}</div>}
            <form onSubmit={handleUpdateResult} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="resVal">Result</label>
                  <select id="resVal" value={resValue} onChange={(e) => setResValue(e.target.value)} data-testid="interview-result-select">
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="resFeed">Feedback</label>
                  <textarea id="resFeed" value={resFeedback} onChange={(e) => setResFeedback(e.target.value)} data-testid="interview-feedback-input" placeholder="Enter interview feedback" rows="3" />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setActiveModal(null)} className="action-btn-secondary">Cancel</button>
                <button type="submit" className="action-btn-primary" data-testid="submit-result-btn">Save Result</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrivePortal;
