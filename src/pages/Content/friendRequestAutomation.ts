export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitUntilResume(): Promise<void> {
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      chrome.storage.local.get('isPaused', (data: { isPaused?: boolean }) => {
        if (!data.isPaused) {
          clearInterval(interval);
          resolve();
        } else {
          console.log('Paused... Waiting to resume.');
        }
      });
    }, 1000);
  });
}

export async function waitForAddFriendButtons(
  timeout: number = 15000
): Promise<Element[]> {
  const interval = 500;
  const maxTries = timeout / interval;
  let tries = 0;

  return new Promise<Element[]>((resolve) => {
    const check = setInterval(() => {
      const buttons = Array.from(
        document.querySelectorAll('div[role="button"], span')
      ).filter((el) => el.textContent?.toLowerCase().includes('add friend'));

      if (buttons.length > 0 || tries >= maxTries) {
        clearInterval(check);
        resolve(buttons);
      }

      tries++;
    }, interval);
  });
}

export async function sendFriendRequests(
  keywords: string[],
  maxRequests: number,
  delayTime: number
): Promise<void> {
  const addFriendButtons = await waitForAddFriendButtons();

  console.log('Total Add Friend buttons found:', addFriendButtons.length);

  let sentCount = 0;
  const processedUsers = new Set<string>();

  (window as any).mountProgressPopup && (window as any).mountProgressPopup();
  (window as any).updateFriendProgress && (window as any).updateFriendProgress({
    status: 'Is sending friend request',
    sent: 0,
    limit: maxRequests,
    scanning: true,
    totalMembers: addFriendButtons.length,
    paused: false,
  });

  for (let i = 0; i < addFriendButtons.length; i++) {
    if ((window as any).__stopFriendAutomation) break;
    if (maxRequests && sentCount >= maxRequests) {
      (window as any).updateFriendProgress && (window as any).updateFriendProgress({
        status: `Reached max requests limit: ${maxRequests}. Stopping.`,
        sent: sentCount,
        scanning: false,
      });
      break;
    }

    await new Promise<void>((checkPauseResolve) => {
      chrome.storage.local.get(
        'isPaused',
        async (data: { isPaused?: boolean }) => {
          if (data.isPaused) {
            console.log('Paused before next request.');
            await waitUntilResume();
          }
          checkPauseResolve();
        }
      );
    });

    const btn = addFriendButtons[i] as HTMLElement;

    let card: HTMLElement | null = btn;
    for (let j = 0; j < 6; j++) {
      card = card?.parentElement as HTMLElement | null;
      if (!card) break;
    }

    if (!card) continue;

    const userIdentifier = card.innerText.trim();
    if (processedUsers.has(userIdentifier)) {
      (window as any).updateFriendProgress && (window as any).updateFriendProgress({
        status: `Already processed → Skipping duplicate.`,
        sent: sentCount,
      });
      continue;
    }

    const spans = Array.from(card.querySelectorAll('span')).filter(
      (span) => span.innerText
    );
    const roleMatch = spans.find((span) =>
      keywords.some((keyword) => span.innerText.toLowerCase().trim() === keyword)
    );

    if (roleMatch) {
      (window as any).updateFriendProgress && (window as any).updateFriendProgress({
        status: `Role "${roleMatch.innerText}" matched → Preparing to send request.`,
        sent: sentCount,
      });

      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(1000);

      try {
        if (btn.offsetParent !== null) {
          btn.click();
          sentCount++;
          processedUsers.add(userIdentifier);
          (window as any).updateFriendProgress && (window as any).updateFriendProgress({
            status: `Friend request sent to role: ${roleMatch.innerText}. Total sent: ${sentCount}`,
            sent: sentCount,
          });
        } else {
          (window as any).updateFriendProgress && (window as any).updateFriendProgress({
            status: `Button not visible → Skipped.`,
            sent: sentCount,
          });
        }
      } catch (e) {
        (window as any).updateFriendProgress && (window as any).updateFriendProgress({
          status: `Click failed → ${e}`,
          sent: sentCount,
        });
      }

      await delay(delayTime * 1000);
    } else {
      (window as any).updateFriendProgress && (window as any).updateFriendProgress({
        status: `Role not matched → Skipping.`,
        sent: sentCount,
      });
    }
  }

  (window as any).updateFriendProgress && (window as any).updateFriendProgress({
    status: `🏁 Automation finished. Total requests sent: ${sentCount}`,
    sent: sentCount,
    scanning: false,
  });
  const popup = document.getElementById('friend-progress-popup');
  if (popup) popup.remove();
  chrome.storage.local.set({ isRunning: false });
}
