export const isInstagramBrowser = (): boolean =>
  /Instagram/.test(navigator.userAgent);

export const isAndroid = (): boolean =>
  /Android/.test(navigator.userAgent);

export const isIOS = (): boolean =>
  /iPhone|iPad|iPod/.test(navigator.userAgent);

// Android only — opens current URL in Chrome via intent
export const tryAndroidRedirect = (): void => {
  const url = location.href.replace(/^https?:\/\//, '');
  location.href = `intent://${url}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(location.href)};end`;
};
