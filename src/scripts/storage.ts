export default {
  clear: function (): void {
    try {
      window.localStorage.clear();
    } catch (e: unknown) {
      console.error('[storage] clear', e);
    }
  },
  
  getItem: function (key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch (e: unknown) {
      console.error('[storage] getItem', e);
    }
    return null;
  },
  
  removeItem: function (key: string): void {
    try {
      return window.localStorage.removeItem(key);
    } catch (e: unknown) {
      console.error('[storage] removeItem', e);
    }
  },
  
  setItem: function (key: string, data: string): void {
    try {
      return window.localStorage.setItem(key, data);
    } catch (e: unknown) {
      console.error('[storage] setItem', e);
    }
  },
}