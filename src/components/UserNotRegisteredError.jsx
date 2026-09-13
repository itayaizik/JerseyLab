import React from 'react';
import { AlertTriangle } from 'lucide-react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-mist to-white px-4">
      <div className="shop-card w-full max-w-md p-8 text-center">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange-soft text-brand-orange-ink">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mb-3 text-2xl font-bold text-brand-navy">אין גישה</h1>
        <p className="mb-6 text-[15px] leading-relaxed text-brand-navy/65">
          החשבון הזה לא רשום לשימוש באתר. אם זו טעות, אפשר:
        </p>
        <ul className="space-y-2 rounded-2xl bg-brand-mist p-4 text-start text-sm text-brand-navy/70">
          <li>לוודא שהתחברתם עם החשבון הנכון</li>
          <li>להתנתק ולהתחבר מחדש</li>
          <li>לפנות אלינו בוואטסאפ או באינסטגרם</li>
        </ul>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
