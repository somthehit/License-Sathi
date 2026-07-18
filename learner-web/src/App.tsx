import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import './index.css';
import { Navbar } from './components/Navbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';

// Lazy load non-critical pages
const PracticeMode = lazy(() => import('./pages/PracticeMode'));
const MockExam = lazy(() => import('./pages/MockExam'));
const StudyMaterials = lazy(() => import('./pages/StudyMaterials'));
const Progress = lazy(() => import('./pages/Progress'));

function PageLoader() {
  return (
    <div className="loader-container">
      <div className="loader"></div>
      <p>Loading...</p>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app-layout">
          <Navbar />
          <main className="page-content">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/practice" element={<PracticeMode />} />
                <Route path="/mock-exam" element={<MockExam />} />
                <Route path="/study" element={<StudyMaterials />} />
                <Route path="/progress" element={<Progress />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
