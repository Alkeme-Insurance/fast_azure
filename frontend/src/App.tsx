import React from 'react';
import { AppAuthProvider } from './auth/AuthProvider';
import { Home } from './pages/Home';
import BoardPage from './pages/BoardPage';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { BoardPanel } from './components/BoardPanel';
import ProjectDetails from './pages/ProjectDetails';
import { ProjectsPanel } from './components/ProjectsPanel';
import ProjectBoards from './pages/ProjectBoards';
import { ProjectTickerBar } from './components/ProjectTickerBar';
import { useTicker } from './hooks/useTicker';
import { KPIPage } from './pages/KPIPage';



function BoardRoute(): React.ReactElement {
  const { boardId } = useParams();
  if (!boardId) return <div style={{ padding: '1rem' }}>Select a board id in the URL.</div>;
  return <BoardPage boardId={boardId} />;
}

function TickerWrapper(): React.ReactElement {
  const { data: tickerData, loading: tickerLoading } = useTicker();
  
  if (tickerLoading || tickerData.length === 0) {
    return <></>;
  }
  
  return <ProjectTickerBar data={tickerData} autoScroll={true} scrollSpeed={30} />;
}

function App(): React.ReactElement {
  return (
    <AppAuthProvider>
      <Router>
        <div style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
          {/* Navbar */}
          <header style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--card-border)', width: '100%' }}>
            <strong>Fast Azure</strong>
            <nav style={{ display: 'inline-flex', gap: '0.75rem' }}>
              <Link to="/">Home</Link>
              <Link to="/projects">Projects</Link>
              <Link to="/board">Board</Link>
              <Link to="/kpi">Dashboard</Link>
            </nav>
          </header>
          
          {/* Ticker Bar - single row beneath navbar */}
          <TickerWrapper />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<ProjectsPanel />} />
            <Route path="/projects/:projectId" element={<ProjectDetails />} />
            <Route path="/projects/:projectId/boards" element={<ProjectBoards />} />
            <Route path="/board" element={<BoardPanel />} />
            <Route path="/board/:boardId" element={<BoardRoute />} />
            <Route path="/kpi" element={<KPIPage />} />
          </Routes>
        </div>
      </Router>
    </AppAuthProvider>
  );
}

export default App;
