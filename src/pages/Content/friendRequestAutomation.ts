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
          console.log('⏸️ Paused... Waiting to resume.');
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

  console.log('✅ Total Add Friend buttons found:', addFriendButtons.length);

  let sentCount = 0;
  const processedUsers = new Set<string>();

  for (let i = 0; i < addFriendButtons.length; i++) {
    if (maxRequests && sentCount >= maxRequests) {
      console.log(`✅ Reached max requests limit: ${maxRequests}. Stopping.`);
      alert(`✅ Reached max requests limit: ${maxRequests}.`);
      break;
    }

    await new Promise<void>((checkPauseResolve) => {
      chrome.storage.local.get(
        'isPaused',
        async (data: { isPaused?: boolean }) => {
          if (data.isPaused) {
            console.log('⏸️ Paused before next request.');
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
      console.log(`🔁 [${i + 1}] Already processed → Skipping duplicate.`);
      continue;
    }

    const spans = Array.from(card.querySelectorAll('span')).filter(
      (span) => span.innerText
    );
    const roleMatch = spans.find((span) =>
      keywords.some((keyword) => span.innerText.toLowerCase().includes(keyword))
    );

    if (roleMatch) {
      console.log(
        `✅ [${i + 1}] Role "${
          roleMatch.innerText
        }" matched → Preparing to send request.`
      );

      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(1000);

      try {
        if (btn.offsetParent !== null) {
          btn.click();
          sentCount++;
          processedUsers.add(userIdentifier);
          console.log(
            `🚀 [${i + 1}] Friend request sent! Total sent: ${sentCount}`
          );
          alert(
            `🚀 Friend request sent to role: ${roleMatch.innerText}. Total sent: ${sentCount}`
          );
        } else {
          console.warn(` [${i + 1}] Button not visible → Skipped.`);
        }
      } catch (e) {
        console.error(` [${i + 1}] Click failed →`, e);
      }

      await delay(delayTime * 1000);
    } else {
      console.log(` [${i + 1}] Role not matched → Skipping.`);
    }
  }

  console.log('🏁 Automation finished. Total requests sent:', sentCount);
  alert(`🏁 Automation finished. Total requests sent: ${sentCount}`);
  chrome.storage.local.set({ isRunning: false });
}
