import { useState } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import ChatView from './components/ChatView';

const API_BASE = 'http://localhost:8000';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [repoUrl, setRepoUrl] = useState('');
  const [repoId, setRepoId] = useState(null);
  const navigate = (page) => setCurrentPage(page);

  return (
    <div style={{
      height: '100vh', width: '100vw',
      display: 'flex', flexDirection: 'column',
      background: '#0d0f14', color: '#e8eaf0',
      overflow: 'hidden', fontFamily: 'sans-serif',
    }}>
      <Navbar currentPage={currentPage} navigate={navigate} />
      {currentPage === 'home' && (
        <HomeView
          setRepoUrl={setRepoUrl}
          setRepoId={setRepoId}
          navigate={navigate}
          apiBase={API_BASE}
        />
      )}
      {currentPage === 'chat' && (
        <ChatView
          repoUrl={repoUrl}
          repoId={repoId}
          setRepoId={setRepoId}
          navigate={navigate}
          apiBase={API_BASE}
        />
      )}
    </div>
  );
};

export default App;