import React from 'react';
import { isChunkLoadError, reloadForNewVersion } from '@/lib/chunkReload';
import { recordCrash } from '@/lib/crashLog';

// Catches anything that throws while a page renders, so a single broken page
// shows a way out instead of a blank white screen. Moving to another page
// clears it (resetKey is the path).
//
// The first button puts the page back without reloading, which keeps whatever
// was typed but not yet saved; a reload is offered second, not first. The
// crash itself is recorded (lib/crashLog.js) so it can be found and fixed.

export default class AppErrorBoundary extends React.Component {
  state = { error: null, showDetails: false };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // A page file missing after a deploy is fixed by loading the new version.
    if (isChunkLoadError(error) && reloadForNewVersion()) return;
    recordCrash(error, { source: 'render', componentStack: info?.componentStack });
    console.error('[app] page crashed:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null, showDetails: false });
    }
  }

  render() {
    const { error, showDetails } = this.state;
    if (!error) return this.props.children;

    const onAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16" dir="rtl">
        <div className="w-full max-w-md rounded-3xl bg-brand-mist px-6 py-10 text-center">
          <p className="text-2xl font-semibold text-brand-navy">משהו השתבש</p>
          <p className="mt-2 text-[15px] leading-relaxed text-brand-navy/60">
            {onAdmin
              ? 'התקלה נרשמה ביומן הניהול. שינויים בעריכת חולצות נשמרים אוטומטית בדפדפן, ויוצעו לשחזור כשתחזור לעמוד.'
              : 'אפשר לנסות לחזור לעמוד. אם זה חוזר, רענון יטען את הגרסה העדכנית של האתר.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <button type="button" onClick={() => this.setState({ error: null, showDetails: false })} className="shop-btn px-6">
              חזרה בלי רענון
            </button>
            <button type="button" onClick={() => window.location.reload()} className="shop-btn-secondary px-6">רענון הדף</button>
            <a href={onAdmin ? '/admin' : '/'} className="shop-btn-secondary px-6">{onAdmin ? 'לדשבורד' : 'לדף הבית'}</a>
          </div>
          <button type="button" onClick={() => this.setState({ showDetails: !showDetails })}
            className="mt-5 text-xs text-brand-navy/45 underline-offset-2 hover:underline">
            {showDetails ? 'הסתרת פרטים טכניים' : 'פרטים טכניים'}
          </button>
          {showDetails && (
            <pre dir="ltr" className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-left text-[11px] text-brand-navy/70">
              {String(error?.message || error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
