import React, { useState } from 'react';
import './targetFriends.css';

// Extend the Window interface to include sendFriendRequests
declare global {
  interface Window {
    sendFriendRequests?: (
      keywords: string[],
      maxRequests: number,
      delayTime: number
    ) => Promise<void>;
  }
}

function TargetFriends() {
  const [limit, setLimit] = useState(0);
  const [delay, setDelay] = useState(0);
  const [input, setInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [automationState, setAutomationState] = useState<
    'idle' | 'running' | 'paused'
  >('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addKeyword(input.trim());
    }
  };

  const addKeyword = (keyword: string) => {
    const clean = keyword.toLowerCase();
    if (clean && !keywords.includes(clean)) {
      setKeywords([...keywords, clean]);
    }
    setInput('');
  };

  const removeKeyword = (removeIdx: number) => {
    setKeywords(keywords.filter((_, idx) => idx !== removeIdx));
  };

  const handleStart = async () => {
    if (keywords.length === 0) {
      alert('Please enter at least one keyword.');
      return;
    }
    setLoading(true);
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (typeof tab?.id !== 'number') {
        throw new Error('Could not find active tab.');
      }
      await chrome.tabs.reload(tab.id);
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.sendMessage(tab.id!, {
            type: 'START_FRIEND_REQUESTS',
            keywords,
            maxRequests: Number(limit),
            delayTime: Number(delay),
          });
          chrome.tabs.onUpdated.removeListener(listener);
          setLoading(false);
          setAutomationState('running');
        }
      });
    } catch (e) {
      alert('An error occurred: ' + e);
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setAutomationState('paused');
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (typeof tab?.id === 'number') {
      chrome.tabs.sendMessage(tab.id, { type: 'PAUSE_FRIEND_REQUESTS' });
    }
  };

  const handleResume = async () => {
    setAutomationState('running');
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (typeof tab?.id === 'number') {
      chrome.tabs.sendMessage(tab.id, { type: 'RESUME_FRIEND_REQUESTS' });
    }
  };

  const handleStop = async () => {
    setAutomationState('idle');
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (typeof tab?.id === 'number') {
      chrome.tabs.sendMessage(tab.id, { type: 'STOP_FRIEND_REQUESTS' });
    }
  };

  return (
    <div className="target-friends-container">
      <h2 className="target-friends-title">Add targeted friends</h2>
      <div className="target-friends-input-row">
        <div className="target-friends-input-group">
          <label className="target-friends-label">
            Limit{' '}
            <span
              className="info-icon"
              title="Set the maximum number of friends to add"
            >
              &#9432;
            </span>
          </label>
          <input
            className="target-friends-input"
            type="number"
            min={1}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            disabled={loading || automationState !== 'idle'}
          />
        </div>
        <div className="target-friends-input-group">
          <label className="target-friends-label">
            Delay{' '}
            <span
              className="info-icon"
              title="Set the delay between actions (in seconds)"
            >
              &#9432;
            </span>
          </label>
          <input
            className="target-friends-input"
            type="number"
            min={1}
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            disabled={loading || automationState !== 'idle'}
          />
        </div>
      </div>
      <div className="target-friends-keywords-group">
        <label className="target-friends-label">
          Keywords{' '}
          <span
            className="info-icon"
            title="Type a keyword and press ENTER or comma to add"
          >
            &#9432;
          </span>
        </label>
        <div className="tag-input-wrapper">
          {keywords.map((tag, idx) => (
            <span className="tag" key={tag}>
              {tag}
              <button className="tag-remove" onClick={() => removeKeyword(idx)}>
                &times;
              </button>
            </span>
          ))}
          <input
            className="target-friends-keywords-input"
            type="text"
            placeholder="Type a keyword and press ENTER or comma"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            disabled={loading || automationState !== 'idle'}
          />
        </div>
      </div>
      {automationState === 'idle' && (
        <button
          className="target-friends-start-btn"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? 'Running...' : 'Start'}
        </button>
      )}
      {automationState !== 'idle' && (
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            className="target-friends-start-btn"
            style={{ background: '#ff9800' }}
            onClick={automationState === 'running' ? handlePause : handleResume}
          >
            {automationState === 'running' ? 'Pause' : 'Resume'}
          </button>
          <button
            className="target-friends-start-btn"
            style={{ background: '#ff4d4f' }}
            onClick={handleStop}
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
}

export default TargetFriends;
