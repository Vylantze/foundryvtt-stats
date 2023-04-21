function clear (): void {
  try {
    window.localStorage.clear();
  } catch (e: unknown) {
    console.error('[storage] clear', e);
  }
}

function getItem (key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch (e: unknown) {
    console.error('[storage] getItem', e);
  }
  return null;
}

function removeItem (key: string): void {
  try {
    return window.localStorage.removeItem(key);
  } catch (e: unknown) {
    console.error('[storage] removeItem', e);
  }
}

function setItem (key: string, data: string): void {
  try {
    return window.localStorage.setItem(key, data);
  } catch (e: unknown) {
    console.error('[storage] setItem', e);
  }
}

export { clear, getItem, removeItem, setItem }