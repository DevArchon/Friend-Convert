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
});

(window as any).sendFriendRequests = sendFriendRequests;
(window as any).cancelPendingRequests = cancelPendingRequests;

console.log('✅ Scripts loaded. Ready to call from popup React buttons.');
