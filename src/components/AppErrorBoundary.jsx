import React from 'react';
import { isChunkLoadError, reloadForNewVersion } from '@/lib/chunkReload';

// Catches anything that throws while a page renders, so a single broken page
// shows a way out instead of a blank white screen. Moving to another page
// clears it (resetKey is the path).

export default class AppErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // A page file missing after a deploy is fixed by loading the new version.
    if (isChunkLoadError(error)) reloadForNewVersion();
    console.error('[app] page crashed:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16" dir="rtl">
        <div className="max-w-md rounded-3xl bg-brand-mist px-6 py-12 text-center">
          <p className="text-2xl font-semibold text-brand-navy">משהו השתבש</p>
          <p className="mt-2 text-[15px] leading-relaxed text-brand-navy/60">
            כנראה שהאתר התעדכן בזמן שהדף היה פתוח. רענון יטען את הגרסה החדשה.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <button type="button" onClick={() => window.location.reload()} className="shop-btn px-8">רענון הדף</button>
            <a href="/" className="shop-btn-secondary px-6">לדף הבית</a>
          </div>
        </div>
      </div>
    );
  }
}
