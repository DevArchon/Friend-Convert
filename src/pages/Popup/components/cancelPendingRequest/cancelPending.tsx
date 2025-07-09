import React, { useState } from 'react';
import './cancelPending.css';

// Extend the Window interface to include cancelPendingRequests
declare global {
  interface Window {
    cancelPendingRequests?: () => Promise<void>;
  }
}

function CancelPending() {
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingOutgoing, setLoadingOutgoing] = useState(false);

  const handleCancel = async () => {
    setLoadingPending(true);
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (typeof tab?.id !== 'number') {
        throw new Error('Could not find active tab.');
      }

      // Refresh the tab
      await chrome.tabs.reload(tab.id);

      // Wait for the tab to finish loading, then send the message
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.sendMessage(tab.id!, {
            type: 'CANCEL_PENDING_REQUESTS',
          });
          chrome.tabs.onUpdated.removeListener(listener);
          setLoadingPending(false);
        }
      });
    } catch (e) {
      alert('An error occurred: ' + e);
      setLoadingPending(false);
    }
  };

  const handleCancelOutgoing = async () => {
    setLoadingOutgoing(true);
    chrome.tabs.create(
      { url: 'https://www.facebook.com/friends/requests' },
      (tab) => {
        const tabId = tab?.id;
        if (!tabId) {
          alert('Could not open Facebook requests page.');
          setLoadingOutgoing(false);
          return;
        }

        chrome.tabs.onUpdated.addListener(function listener(
          updatedTabId,
          info
        ) {
          if (updatedTabId === tabId && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);

            chrome.scripting.executeScript({
              target: { tabId },
              func: () => {
                const delay = (ms: number) =>
                  new Promise((res) => setTimeout(res, ms));

                async function cancelOutgoingRequests() {
                  await delay(3000); // Wait for page to settle

                  // Step 1: Click the "…" button (menu trigger)
                  const moreMenu = Array.from(
                    document.querySelectorAll('span')
                  ).find((el) => el.innerText.trim() === '…');
                  if (!moreMenu) return console.warn("'…' menu not found.");
                  (moreMenu as HTMLElement).click();
                  console.log("Clicked '…' menu");
                  await delay(1500);

                  // Step 2: Click the correct <div> that shows 'View Sent Requests'
                  const sentReqBtn = Array.from(
                    document.querySelectorAll('div[role="button"]')
                  ).find(
                    (div) =>
                      div.textContent &&
                      div.textContent.toLowerCase().includes('view sent')
                  );
                  if (!sentReqBtn)
                    return console.warn(
                      "'View Sent Requests' button not found."
                    );
                  (sentReqBtn as HTMLElement).click();
                  console.log("Clicked 'View Sent Requests'");
                  await delay(3000);

                  // Step 3: Cancel all requests
                  const cancelBtns = Array.from(
                    document.querySelectorAll(
                      'div[aria-label="Cancel request"]'
                    )
                  );
                  if (!cancelBtns.length)
                    return console.warn('No cancel buttons found.');

                  for (let i = 0; i < cancelBtns.length; i++) {
                    (cancelBtns[i] as HTMLElement).click();
                    console.log(`Cancelled request #${i + 1}`);
                    await delay(1500);
                  }

                  console.log(`Done. Cancelled ${cancelBtns.length} requests.`);
                }

                cancelOutgoingRequests();
              },
            });
            setLoadingOutgoing(false);
          }
        });
      }
    );
  };

  return (
    <div className="cancel-pending-container">
      <h2 className="cancel-pending-title">Cancel Pending Requests</h2>
      <button
        className="cancel-pending-start-btn"
        onClick={handleCancel}
        disabled={loadingPending || loadingOutgoing}
      >
        {loadingPending ? 'Cancelling...' : 'Cancel Pending'}
      </button>
      <hr style={{ margin: '24px 0', width: '100%' }} />
      <h3 style={{ color: '#ff9800', marginBottom: 10 }}>
        Cancel Outgoing Friend Requests
      </h3>
      <button
        className="cancel-pending-start-btn"
        style={{ background: '#ff9800', marginBottom: 10 }}
        onClick={handleCancelOutgoing}
        disabled={loadingPending || loadingOutgoing}
      >
        {loadingOutgoing ? 'Processing...' : 'Cancel Outgoing Requests'}
      </button>
    </div>
  );
}

export default CancelPending;
