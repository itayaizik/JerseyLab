import React, { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { t } from "@/lib/i18n";

// The frame around the sign-in, registration and password pages: the logo, a
// title, and one white card on a soft grey ground.
//
// These pages fill the screen and have no header, so a visitor who tapped
// "log in" to see what was behind it had nothing to press but the browser's
// back button. The X is the way out.
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // React Router gives the first entry of a session the key "default". Anything
  // else means the visitor got here from a page of ours, and back returns them
  // to it; a direct arrival goes to the shop rather than off the site.
  const close = () => {
    if (location.key && location.key !== "default") navigate(-1);
    else navigate("/");
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-mist to-white px-4 py-10">
      <button type="button" onClick={close} aria-label={t("סגירה, בלי להתחבר", "Close without logging in")}
        className="fixed end-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-navy shadow-card transition hover:bg-brand-navy hover:text-white sm:end-6 sm:top-6">
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

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
