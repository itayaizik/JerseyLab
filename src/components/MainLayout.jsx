import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { t } from '@/lib/i18n';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-[100] focus:bg-brand-orange focus:text-white focus:px-4 focus:py-2 focus:font-heading focus:font-bold focus:text-sm focus:uppercase">
        {t('דלג לתוכן הראשי', 'Skip to main content')}
      </a>
      <Navbar />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
