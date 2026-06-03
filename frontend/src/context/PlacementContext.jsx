import React, { createContext, useReducer } from 'react';
import api from '../services/api';
import {
  placementReducer,
  initialState,
  SET_ITEMS,
  ADD_ITEM,
  UPDATE_ITEM,
  DELETE_ITEM,
  SET_LOADING,
  SET_ERROR,
  SET_FILTER,
  SET_SEARCH,
  SET_STATS
} from '../reducer/placementReducer';

export const PlacementContext = createContext();

export const PlacementProvider = ({ children }) => {
  const [state, dispatch] = useReducer(placementReducer, initialState);

  // Helper error wrapper
  const handleError = (error, defaultMsg) => {
    const message = error.response?.data?.message || error.message || defaultMsg;
    dispatch({ type: SET_ERROR, payload: message });
    return { success: false, error: message };
  };

  // Actions
  const syncData = async () => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.post('/sync');
      if (res.data && res.data.success) {
        // Automatically fetch students after syncing
        await fetchStudents(1, 50);
        await fetchStats();
        dispatch({ type: SET_LOADING, payload: false });
        return { success: true, data: res.data.data };
      }
      throw new Error(res.data.message || 'Sync failed');
    } catch (err) {
      return handleError(err, 'Failed to synchronize dataset');
    }
  };

  const fetchStudents = async (page = 1, limit = 10) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const params = { page, limit };
      if (state.filters.department) params.department = state.filters.department;
      if (state.filters.status) params.status = state.filters.status;
      if (state.search) params.q = state.search;

      const res = await api.get('/students', { params });
      if (res.data && res.data.success) {
        dispatch({
          type: SET_ITEMS,
          payload: { entity: 'students', data: res.data.data.students }
        });
        return { success: true, pagination: res.data.data.pagination };
      }
      throw new Error(res.data.message || 'Failed to fetch students');
    } catch (err) {
      return handleError(err, 'Failed to fetch students');
    }
  };

  const fetchCompanies = async () => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.get('/companies');
      if (res.data && res.data.success) {
        dispatch({
          type: SET_ITEMS,
          payload: { entity: 'companies', data: res.data.data }
        });
        return { success: true };
      }
      throw new Error(res.data.message || 'Failed to fetch companies');
    } catch (err) {
      return handleError(err, 'Failed to fetch companies');
    }
  };

  const fetchDrives = async () => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const params = {};
      if (state.filters.driveStatus) params.status = state.filters.driveStatus;

      const res = await api.get('/drives', { params });
      if (res.data && res.data.success) {
        dispatch({
          type: SET_ITEMS,
          payload: { entity: 'drives', data: res.data.data }
        });
        return { success: true };
      }
      throw new Error(res.data.message || 'Failed to fetch drives');
    } catch (err) {
      return handleError(err, 'Failed to fetch drives');
    }
  };

  const fetchApplications = async () => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.get('/applications');
      if (res.data && res.data.success) {
        dispatch({
          type: SET_ITEMS,
          payload: { entity: 'applications', data: res.data.data }
        });
        return { success: true };
      }
      throw new Error(res.data.message || 'Failed to fetch applications');
    } catch (err) {
      return handleError(err, 'Failed to fetch applications');
    }
  };

  const fetchInterviews = async () => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.get('/interviews');
      if (res.data && res.data.success) {
        dispatch({
          type: SET_ITEMS,
          payload: { entity: 'interviews', data: res.data.data }
        });
        return { success: true };
      }
      throw new Error(res.data.message || 'Failed to fetch interviews');
    } catch (err) {
      return handleError(err, 'Failed to fetch interviews');
    }
  };

  const fetchStats = async () => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.get('/stats');
      if (res.data && res.data.success) {
        dispatch({
          type: SET_STATS,
          payload: res.data.data
        });
        return { success: true };
      }
      throw new Error(res.data.message || 'Failed to fetch stats');
    } catch (err) {
      return handleError(err, 'Failed to fetch analytics statistics');
    }
  };

  const createStudent = async (studentData) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.post('/students', studentData);
      if (res.data && res.data.success) {
        dispatch({
          type: ADD_ITEM,
          payload: { entity: 'students', data: res.data.data }
        });
        await fetchStats();
        return { success: true };
      }
      throw new Error(res.data.message || 'Failed to create student');
    } catch (err) {
      return handleError(err, 'Failed to create student');
    }
  };

  const updateStudent = async (id, studentData) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.put(`/students/${id}`, studentData);
      if (res.data && res.data.success) {
        dispatch({
          type: UPDATE_ITEM,
          payload: { entity: 'students', data: res.data.data }
        });
        await fetchStats();
        return { success: true };
      }
      throw new Error(res.data.message || 'Failed to update student');
    } catch (err) {
      return handleError(err, 'Failed to update student');
    }
  };

  const deleteStudent = async (id) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.delete(`/students/${id}`);
      if (res.data && res.data.success) {
        dispatch({
          type: DELETE_ITEM,
          payload: { entity: 'students', id }
        });
        await fetchStats();
        return { success: true };
      }
      throw new Error(res.data.message || 'Failed to delete student');
    } catch (err) {
      return handleError(err, 'Failed to delete student');
    }
  };

  const createCompany = async (companyData) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.post('/companies', companyData);
      if (res.data && res.data.success) {
        dispatch({
          type: ADD_ITEM,
          payload: { entity: 'companies', data: res.data.data }
        });
        await fetchStats();
        return { success: true };
      }
      throw new Error(res.data.message || 'Failed to create company');
    } catch (err) {
      return handleError(err, 'Failed to create company');
    }
  };

  const createDrive = async (driveData) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.post('/drives', driveData);
      if (res.data && res.data.success) {
        dispatch({
          type: ADD_ITEM,
          payload: { entity: 'drives', data: res.data.data }
        });
        return { success: true };
      }
      throw new Error(res.data.message || 'Failed to create drive');
    } catch (err) {
      return handleError(err, 'Failed to create drive');
    }
  };

  const applyForDrive = async (studentId, driveId) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.post('/applications', { studentId, driveId });
      if (res.data && res.data.success) {
        dispatch({
          type: ADD_ITEM,
          payload: { entity: 'applications', data: res.data.data }
        });
        await fetchStats();
        return { success: true, message: res.data.message };
      }
      throw new Error(res.data.message || 'Failed to apply for drive');
    } catch (err) {
      return handleError(err, 'Failed to apply for drive');
    }
  };

  const updateApplicationStatus = async (id, status) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.put(`/applications/${id}`, { status });
      if (res.data && res.data.success) {
        dispatch({
          type: UPDATE_ITEM,
          payload: { entity: 'applications', data: res.data.data }
        });
        await fetchStats();
        return { success: true };
      }
      throw new Error(res.data.message || 'Failed to update application status');
    } catch (err) {
      return handleError(err, 'Failed to update application status');
    }
  };

  const scheduleInterview = async (interviewData) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.post('/interviews', interviewData);
      if (res.data && res.data.success) {
        dispatch({
          type: ADD_ITEM,
          payload: { entity: 'interviews', data: res.data.data }
        });
        return { success: true };
      }
      throw new Error(res.data.message || 'Failed to schedule interview');
    } catch (err) {
      return handleError(err, 'Failed to schedule interview');
    }
  };

  const updateInterviewResult = async (id, resultData) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const res = await api.put(`/interviews/${id}`, resultData);
      if (res.data && res.data.success) {
        dispatch({
          type: UPDATE_ITEM,
          payload: { entity: 'interviews', data: res.data.data }
        });
        // Reload applications and stats since interview results can update applicant state
        await fetchApplications();
        await fetchStats();
        return { success: true };
      }
      throw new Error(res.data.message || 'Failed to update interview result');
    } catch (err) {
      return handleError(err, 'Failed to update interview result');
    }
  };

  const setFilter = (filters) => {
    dispatch({ type: SET_FILTER, payload: filters });
  };

  const setSearch = (q) => {
    dispatch({ type: SET_SEARCH, payload: q });
  };

  return (
    <PlacementContext.Provider
      value={{
        state,
        syncData,
        fetchStudents,
        fetchCompanies,
        fetchDrives,
        fetchApplications,
        fetchInterviews,
        fetchStats,
        createStudent,
        updateStudent,
        deleteStudent,
        createCompany,
        createDrive,
        applyForDrive,
        updateApplicationStatus,
        scheduleInterview,
        updateInterviewResult,
        setFilter,
        setSearch
      }}
    >
      {children}
    </PlacementContext.Provider>
  );
};
