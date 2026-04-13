import { useEffect, useState } from 'react';
import { isInstagramBrowser, isAndroid, isIOS, tryAndroidRedirect } from '../utils/instagramEscape';

export const BrowserGate = ({ children }: { children: React.ReactNode }) => {
  // We check synchronously so the camera hooks inside children don't even run once
  const isInsta = isInstagramBrowser();
  const [blocked] = useState(isInsta);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    if (!isInsta) return;

    if (isAndroid()) {
      setPlatform('android');
      // Try silent redirect first — works on most Android devices
      tryAndroidRedirect();
      // If still here after 1.5s, Android redirect failed → show manual UI
    } else if (isIOS()) {
      setPlatform('ios');
      // iOS cannot be auto-redirected — must show manual instruction
    }
  }, [isInsta]);

  if (!blocked) return <>{children}</>;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      padding: '2rem',
      textAlign: 'center',
      background: '#000',
      color: '#fff',
      fontFamily: 'sans-serif',
      gap: '1.5rem',
    }}>

      {/* Icon */}
      <div style={{
        width: 64, height: 64,
        borderRadius: '50%',
        background: '#1a1a1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32,
        border: '1px solid #333',
      }}>
        📷
      </div>

      <div style={{ maxWidth: 320 }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Camera not available here
        </p>
        <p style={{ fontSize: '0.95rem', color: '#aaa', lineHeight: 1.6 }}>
          This site needs camera access which Instagram's browser doesn't support.
          Please open it in{' '}
          {platform === 'ios' ? 'Safari' : 'Chrome'}.
        </p>
      </div>

      {/* iOS: manual instruction */}
      {platform === 'ios' && (
        <div style={{
          background: '#111',
          border: '1px solid #333',
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
          maxWidth: 320,
          textAlign: 'left',
        }}>
          <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            HOW TO OPEN IN SAFARI
          </p>
          <ol style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: 2, fontSize: '0.95rem', color: '#ddd' }}>
            <li>Tap <strong style={{ color: '#fff' }}>···</strong> in the top-right corner</li>
            <li>Tap <strong style={{ color: '#fff' }}>"Open in Safari"</strong></li>
          </ol>
        </div>
      )}

      {/* Android: button fallback if intent redirect failed */}
      {platform === 'android' && (
        <a
          href={`intent://${location.href.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(location.href)};end`}
          style={{
            display: 'inline-block',
            padding: '0.85rem 2rem',
            background: '#fff',
            color: '#000',
            borderRadius: 50,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          Open in Chrome
        </a>
      )}

      {/* Copy link fallback for both */}
      <button
        onClick={() => {
          navigator.clipboard?.writeText(location.href).catch(() => {});
        }}
        style={{
          background: 'transparent',
          border: '1px solid #444',
          color: '#888',
          borderRadius: 50,
          padding: '0.6rem 1.5rem',
          fontSize: '0.85rem',
          cursor: 'pointer',
        }}
      >
        Copy link
      </button>

    </div>
  );
};
