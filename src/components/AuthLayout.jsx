import React from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--brand-cream-dark)', backgroundImage: 'linear-gradient(rgba(27,42,74,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(27,42,74,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="bg-brand-navy px-4 py-2 inline-block mb-3" style={{ boxShadow: '4px 4px 0 var(--brand-orange)' }}>
              <div className="font-heading font-bold text-white text-2xl leading-tight tracking-widest">LAB<br/>JERSEY</div>
            </div>
          </Link>
          <h1 className="font-heading font-bold text-2xl text-brand-navy uppercase tracking-wide mt-3">{title}</h1>
          {subtitle && <p className="text-gray-500 font-body mt-1 text-sm">{subtitle}</p>}
        </div>

        {/* Card */}
        <div className="bg-white p-8" style={{ border: '2px solid var(--brand-navy)', boxShadow: '5px 5px 0 var(--brand-orange)' }}>
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-gray-600 mt-5 font-body">{footer}</p>
        )}
      </div>
    </div>
  );
}