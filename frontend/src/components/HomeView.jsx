import { useState, useRef } from 'react';

const HomeView = ({ setRepoUrl, setRepoId, navigate, apiBase }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const abortRef = useRef(null);

  const pollStatus = async (repoId, signal) => {
    const maxAttempts = 120; // 10 minutes max (5s * 120)
    let attempts = 0;

    while (attempts < maxAttempts) {
      // Check if cancelled
      if (signal?.aborted) return;

      try {
        const res = await fetch(`${apiBase}/status/${repoId}`, { signal });

        if (!res.ok) {
          // Handle 404 — server doesn't know this repo_id
          if (res.status === 404) {
            setIsLoading(false);
            setError('Repository not found on the server. The server may have restarted during ingestion. Please try again.');
            setStatusMsg('');
            return;
          }
          throw new Error(`Status check failed: ${res.status}`);
        }

        const data = await res.json();

        // Backend returns: { repo_id: string, status: "processing" | "ready" | "failed" }
        if (data.status === 'ready') {
          setRepoId(repoId);
          setIsLoading(false);
          setStatusMsg('');
          navigate('chat');
          return;
        }

        if (data.status === 'failed') {
          setIsLoading(false);
          setError('Repository ingestion failed. Please check the server logs and try again.');
          setStatusMsg('');
          return;
        }

        // Still processing
        const elapsed = attempts * 5;
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        setStatusMsg(`Indexing repository... (${timeStr} elapsed)`);
      } catch (err) {
        if (err.name === 'AbortError') return;

        // Check for connection errors
        if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
          setIsLoading(false);
          setError(`Cannot reach the backend server at ${apiBase}. Make sure it's running.`);
          setStatusMsg('');
          return;
        }
        console.error('Status poll error:', err);
      }

      attempts++;
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, 5000);
        // If signal aborts, clear timeout and reject
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new DOMException('Aborted', 'AbortError'));
          }, { once: true });
        }
      }).catch(() => { /* aborted */ return; });
    }

    setIsLoading(false);
    setError('Ingestion timed out after 10 minutes. The repository may be too large. Please check server logs.');
    setStatusMsg('');
  };

  const handleExplore = async (url) => {
    const repoUrlValue = url || inputUrl.trim();
    if (!repoUrlValue) return;

    // Ensure it's a full GitHub URL
    let fullUrl = repoUrlValue;
    if (!fullUrl.startsWith('http')) {
      fullUrl = `https://github.com/${fullUrl}`;
    }

    // Basic URL validation
    try {
      const parsed = new URL(fullUrl);
      if (!parsed.hostname.includes('github.com')) {
        setError('Please enter a valid GitHub repository URL.');
        return;
      }
    } catch {
      setError('Please enter a valid URL (e.g., https://github.com/owner/repo).');
      return;
    }

    // Cancel any previous pending request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setError('');
    setIsLoading(true);
    setStatusMsg('Starting ingestion...');
    setRepoUrl(fullUrl);

    try {
      const res = await fetch(`${apiBase}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: fullUrl }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errorMessage = `Server error: ${res.status}`;
        try {
          const errData = await res.json();
          errorMessage = errData.detail || errorMessage;
        } catch {
          errorMessage = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Backend returns: { status: "processing", repo_id: string, message: string }
      const data = await res.json();
      const repoId = data.repo_id;

      if (!repoId) {
        throw new Error('Server did not return a repo_id. Check backend logs.');
      }

      setStatusMsg(`Repository submitted (ID: ${repoId.slice(0, 8)}...). Polling for status...`);

      // Start polling
      await pollStatus(repoId, controller.signal);

    } catch (err) {
      if (err.name === 'AbortError') return;

      setIsLoading(false);

      // Friendly error for connection issues
      if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
        setError(`Cannot reach the backend server at ${apiBase}. Make sure it's running (python server.py).`);
      } else {
        setError(err.message || 'Failed to connect to backend server.');
      }
      setStatusMsg('');
    }
  };

  // Cancel ingestion
  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);
    setStatusMsg('');
    setError('');
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d0f14',
      padding: '32px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(79,142,247,0.1) 1px, transparent 0)',
        backgroundSize: '36px 36px',
        pointerEvents: 'none',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', width: '100%' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 16px', borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          marginBottom: '28px',
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6fecc8', boxShadow: '0 0 8px #6fecc8' }} />
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6a7585', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Codebase Explorer
          </span>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: '56px', fontWeight: '800', lineHeight: '1.1', marginBottom: '16px', color: '#e8eaf0' }}>
          Explore any repo,
          <br />
          <span style={{
            background: 'linear-gradient(90deg, #4f8ef7, #6fecc8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            understand instantly.
          </span>
        </h1>

        <p style={{ fontSize: '17px', color: '#4a5570', marginBottom: '40px', lineHeight: '1.7' }}>
          Paste a GitHub link and start chatting with any codebase.
        </p>

        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#161b26',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '6px',
          gap: '8px', width: '100%',
          boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
          opacity: isLoading ? 0.6 : 1,
          pointerEvents: isLoading ? 'none' : 'auto',
        }}>
          <div style={{ paddingLeft: '12px', color: '#3a4050' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="https://github.com/owner/repository"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleExplore(); }}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'monospace', fontSize: '13px', color: '#e8eaf0',
              padding: '12px 4px',
            }}
          />
          <button
            onClick={() => handleExplore()}
            disabled={isLoading}
            style={{
              background: isLoading
                ? 'rgba(79,142,247,0.4)'
                : 'linear-gradient(135deg, #4f8ef7, #6ba3fa)',
              color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: '12px',
              fontSize: '14px', fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(79,142,247,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isLoading ? 'Indexing...' : 'Explore →'}
          </button>
        </div>

        {/* Status message */}
        {statusMsg && (
          <div style={{
            marginTop: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#4f8ef7',
              animation: 'pulse 1.5s infinite',
            }} />
            <span style={{ fontSize: '13px', color: '#4f8ef7', fontFamily: 'monospace' }}>
              {statusMsg}
            </span>
            <button
              onClick={handleCancel}
              style={{
                background: 'none', border: '1px solid rgba(255,107,107,0.3)',
                color: '#ff6b6b', fontSize: '11px', padding: '3px 10px',
                borderRadius: '6px', cursor: 'pointer', marginLeft: '8px',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            marginTop: '16px', padding: '10px 16px',
            background: 'rgba(255,107,107,0.1)',
            border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: '10px',
          }}>
            <span style={{ fontSize: '13px', color: '#ff6b6b' }}>{error}</span>
          </div>
        )}

        {/* Suggestions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['vercel/next.js', 'facebook/react', 'tailwindlabs/tailwindcss', 'vitejs/vite'].map(r => (
            <span
              key={r}
              style={{
                fontSize: '12px', color: '#4f8ef7', fontFamily: 'monospace',
                cursor: isLoading ? 'not-allowed' : 'pointer', opacity: 0.6,
              }}
              onMouseEnter={e => e.target.style.opacity = 1}
              onMouseLeave={e => e.target.style.opacity = 0.6}
              onClick={() => {
                if (!isLoading) {
                  setInputUrl(r);
                  handleExplore(r);
                }
              }}
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

export default HomeView;