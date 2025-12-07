import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AttendanceScanner } from './components/AttendanceScanner';
import { Registration } from './components/Registration';
import { View } from './types';
import { loadModels } from './services/faceService';
import { Loader } from './components/Loader';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.ATTENDANCE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await loadModels();
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load Face Recognition models. Please refresh or check your connection.");
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader text="Loading AI Models (This may take a moment)..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-red-500 p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-white">
          Retry
        </button>
      </div>
    );
  }

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === View.DASHBOARD && <Dashboard />}
      {currentView === View.ATTENDANCE && <AttendanceScanner />}
      {currentView === View.REGISTER && <Registration />}
    </Layout>
  );
};

export default App;