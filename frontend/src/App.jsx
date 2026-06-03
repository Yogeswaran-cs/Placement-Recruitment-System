import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { PlacementProvider } from './context/PlacementContext';
import AppRouter from './router/AppRouter';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <PlacementProvider>
        <AppRouter />
      </PlacementProvider>
    </AuthProvider>
  );
}

export default App;
