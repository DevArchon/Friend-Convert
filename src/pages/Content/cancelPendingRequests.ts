export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function cancelPendingRequests(): Promise<void> {
  let cancelCount = 0;

  while (true) {
    const cancelButtons = Array.from(
      document.querySelectorAll('div[role="button"], span')
    ).filter((el) => el.textContent?.toLowerCase().includes('cancel request'));

    if (cancelButtons.length === 0) {
      console.log('No more Cancel Request buttons found.');
      break;
    }

    const btn = cancelButtons[0] as HTMLElement;
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await delay(1000);

    try {
      if (btn.offsetParent !== null) {
        btn.click();
        cancelCount++;
        console.log(`Request canceled! Total canceled: ${cancelCount}`);
      } else {
        console.warn(`Button not visible → Skipped.`);
      }
    } catch (e) {
      console.error(`Click failed →`, e);
    }

    await delay(1500);
  }

  console.log('Cancel pending finished. Total canceled:', cancelCount);
  alert(`Cancel pending finished. Total canceled: ${cancelCount}`);
}
