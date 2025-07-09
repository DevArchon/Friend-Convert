import './progressPopup';

console.log('Content Working');

import { sendFriendRequests } from './friendRequestAutomation';
import { cancelPendingRequests } from './cancelPendingRequests';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_FRIEND_REQUESTS') {
    sendFriendRequests(
      message.keywords,
      message.maxRequests,
      message.delayTime
    );
  }
  if (message.type === 'CANCEL_PENDING_REQUESTS') {
    cancelPendingRequests();
  }
  if (message.type === 'PAUSE_FRIEND_REQUESTS') {
    chrome.storage.local.set({ isPaused: true });
    if ((window as any).updateFriendProgress) (window as any).updateFriendProgress({ paused: true, status: 'Paused' });
  }
  if (message.type === 'RESUME_FRIEND_REQUESTS') {
    chrome.storage.local.set({ isPaused: false });
    if ((window as any).updateFriendProgress) (window as any).updateFriendProgress({ paused: false, status: 'Running' });
  }
  if (message.type === 'STOP_FRIEND_REQUESTS') {
    (window as any).__stopFriendAutomation = true;
    const popup = document.getElementById('friend-progress-popup');
    if (popup) popup.remove();
  }
});

(window as any).sendFriendRequests = sendFriendRequests;
(window as any).cancelPendingRequests = cancelPendingRequests;

console.log('Scripts loaded. Ready to call from popup React buttons.');
