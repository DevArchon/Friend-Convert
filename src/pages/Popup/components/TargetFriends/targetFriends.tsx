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
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!keywords.trim()) {
      alert('Please enter at least one keyword.');
      return;
    }
    setLoading(true);
    try {
      // Split keywords by comma or space, remove empty
      const keywordArr = keywords
        .split(/[,\s]+/)
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (typeof tab?.id !== 'number') {
        throw new Error('Could not find active tab.');
      }
      await chrome.tabs.sendMessage(tab.id, {
        type: 'START_FRIEND_REQUESTS',
        keywords: keywordArr,
        maxRequests: Number(limit),
        delayTime: Number(delay),
      });
    } catch (e) {
      alert('An error occurred: ' + e);
    }
    setLoading(false);
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
            disabled={loading}
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
            disabled={loading}
          />
        </div>
      </div>
      <div className="target-friends-keywords-group">
        <label className="target-friends-label">
          Keywords{' '}
          <span
            className="info-icon"
            title="Type a keyword and press ENTER to add"
          >
            &#9432;
          </span>
        </label>
        <input
          className="target-friends-keywords-input"
          type="text"
          placeholder="Type a keyword and press ENTER"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          disabled={loading}
        />
      </div>
      <button
        className="target-friends-start-btn"
        onClick={handleStart}
        disabled={loading}
      >
        {loading ? 'Running...' : 'Start'}
      </button>
    </div>
  );
}

export default TargetFriends;
