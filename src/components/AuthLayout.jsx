import React from "react";
import { Link } from "react-router-dom";
import { t } from "@/lib/i18n";

// The frame around the sign-in, registration and password pages: the logo, a
// title, and one white card on a soft grey ground.
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-mist to-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" aria-label={t("JerseyLab - דף הבית", "JerseyLab - Home")} className="inline-block rounded-lg">
            {/* The navy logo on a light page, the white one in dark mode. */}
            <img src="/logo-navbar-dark.png" alt="JerseyLab" width="391" height="128" className="mx-auto h-12 w-auto dark:hidden" />
            <img src="/logo-navbar.png" alt="JerseyLab" width="391" height="128" className="mx-auto hidden h-12 w-auto dark:block" />
          </Link>
          {Icon && (
            <span className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange-soft text-brand-orange-ink">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
          )}
          <h1 className="mt-5 text-3xl font-bold tracking-[-0.02em] text-brand-navy">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] text-brand-navy/60">{subtitle}</p>}
        </div>

        <div className="shop-card p-6 sm:p-8">
          {children}
        </div>

        {footer && (
          <p className="mt-6 text-center text-[15px] text-brand-navy/60">{footer}</p>
        )}
      </div>
    </div>
  );
}
