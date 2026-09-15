import React from 'react';
import { t } from '@/lib/i18n';

// A labelled form field with its error or hint underneath, for the contact,
// request and account forms.

export function fieldClass(error) {
  return `shop-field ${error ? 'border-red-300 bg-red-50/60' : ''}`;
}

export default function FormField({ id, label, required = false, optional = false, error, hint, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-brand-navy/70">
          {label}
          {required && <span className="text-brand-orange-ink"> *</span>}
          {optional && <span className="font-normal text-brand-navy/40"> {t('(לא חובה)', '(optional)')}</span>}
        </label>
      )}
      {children}
      {error
        ? <p className="mt-1 text-xs text-red-600">{error}</p>
        : hint ? <p className="mt-1 text-xs text-brand-navy/50">{hint}</p> : null}
    </div>
  );
}
