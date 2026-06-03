import React, { useContext, useEffect, useState } from 'react';
import { PlacementContext } from '../context/PlacementContext';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const StudentList = () => {
  const {
    state,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    setFilter,
    setSearch
  } = useContext(PlacementContext);
  
  const { logout } = useContext(AuthContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form fields
  const [studentIdInput, setStudentIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [deptInput, setDeptInput] = useState('');
  const [cgpaInput, setCgpaInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [statusInput, setStatusInput] = useState('active');
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadStudents = async () => {
      const res = await fetchStudents(page, 10);
      if (res.success && res.pagination) {
        setTotalPages(res.pagination.pages);
      }
    };
    loadStudents();
  }, [state.filters.department, state.filters.status, state.search, page]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDeptFilterChange = (e) => {
    setFilter({ department: e.target.value });
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setFilter({ status: e.target.value });
    setPage(1);
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setStudentIdInput('');
    setNameInput('');
    setEmailInput('');
    setDeptInput('');
    setCgpaInput('');
    setSkillsInput('');
    setStatusInput('active');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setModalMode('edit');
    setEditingId(student._id || student.id);
    setStudentIdInput(student.studentId);
    setNameInput(student.name);
    setEmailInput(student.email);
    setDeptInput(student.department);
    setCgpaInput(String(student.cgpa));
    setSkillsInput(student.skills ? student.skills.join(', ') : '');
    setStatusInput(student.status || 'active');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      await deleteStudent(id);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!studentIdInput.trim() || !nameInput.trim() || !emailInput.trim() || !deptInput.trim() || !cgpaInput) {
      setFormError('All required fields must be filled');
      return;
    }

    const cgpaNum = parseFloat(cgpaInput);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      setFormError('CGPA must be a valid number between 0 and 10');
      return;
    }

    const payload = {
      studentId: studentIdInput.trim(),
      name: nameInput.trim(),
      email: emailInput.trim(),
      department: deptInput.trim().toUpperCase(),
      cgpa: cgpaNum,
      skills: skillsInput,
      status: statusInput
    };

    let res;
    if (modalMode === 'add') {
      res = await createStudent(payload);
    } else {
      res = await updateStudent(editingId, payload);
    }

    if (res.success) {
      setIsModalOpen(false);
      fetchStudents(page, 10);
    } else {
      setFormError(res.error || 'Operation failed');
    }
  };

  const { students, loading, error } = state;

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
            <Link to="/students" className="nav-link active">Students</Link>
            <Link to="/drives" className="nav-link">Drives & Interviews</Link>
          </nav>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Main content */}
      <main className="dashboard-main">
        <div className="page-header-actions">
          <h2>Student Management</h2>
          <button
            onClick={openAddModal}
            className="action-btn-primary"
            data-testid="add-student-btn"
          >
            Add Student
          </button>
        </div>

        {/* Filters and Search toolbar */}
        <section className="toolbar-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search students..."
              value={state.search}
              onChange={handleSearchChange}
              data-testid="search-input"
            />
          </div>
          <div className="filter-box">
            <select
              value={state.filters.department}
              onChange={handleDeptFilterChange}
              data-testid="filter-department"
            >
              <option value="">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
              <option value="AI&DS">AI&DS</option>
            </select>

            <select
              value={state.filters.status}
              onChange={handleStatusFilterChange}
              data-testid="filter-status"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="placed">Placed</option>
              <option value="unplaced">Unplaced</option>
            </select>
          </div>
        </section>

        {/* Error message banner */}
        {error && <div className="error-banner">{error}</div>}

        {/* Data Table */}
        <section className="table-section">
          {loading ? (
            <div className="table-loading">Loading student records...</div>
          ) : students.length === 0 ? (
            <div className="empty-msg">No students found matching your criteria</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>CGPA</th>
                  <th>Skills</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id || student.id} data-testid={`student-row-${student.studentId}`}>
                    <td>{student.studentId}</td>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.department}</td>
                    <td>{student.cgpa}</td>
                    <td>
                      <div className="skills-tags">
                        {student.skills && student.skills.map((skill, i) => (
                          <span key={i} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${student.status?.toLowerCase()}`}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          onClick={() => openEditModal(student)}
                          className="edit-btn"
                          data-testid={`edit-student-btn-${student.studentId}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(student._id || student.id)}
                          className="delete-btn"
                          data-testid={`delete-student-btn-${student.studentId}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <section className="pagination-section">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="page-btn"
            >
              Previous
            </button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="page-btn"
            >
              Next
            </button>
          </section>
        )}
      </main>

      {/* Modal Form Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{modalMode === 'add' ? 'Add New Student' : 'Edit Student Record'}</h3>
            
            {formError && <div className="form-error-banner">{formError}</div>}

            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="studentId">Student ID</label>
                  <input
                    type="text"
                    id="studentId"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                    disabled={modalMode === 'edit'}
                    data-testid="student-id-input"
                    placeholder="e.g. STU1001"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    data-testid="student-name-input"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    data-testid="student-email-input"
                    placeholder="student@test.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dept">Department</label>
                  <input
                    type="text"
                    id="dept"
                    value={deptInput}
                    onChange={(e) => setDeptInput(e.target.value)}
                    data-testid="student-department-input"
                    placeholder="e.g. CSE, IT, CIVIL"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cgpa">CGPA</label>
                  <input
                    type="number"
                    id="cgpa"
                    step="0.01"
                    value={cgpaInput}
                    onChange={(e) => setCgpaInput(e.target.value)}
                    data-testid="student-cgpa-input"
                    placeholder="0.00 - 10.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="skills">Skills (comma-separated)</label>
                  <input
                    type="text"
                    id="skills"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    data-testid="student-skills-input"
                    placeholder="e.g. React, Node.js, AWS"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    data-testid="student-status-select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="placed">Placed</option>
                    <option value="unplaced">Unplaced</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="action-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action-btn-primary"
                  data-testid="submit-student-btn"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
