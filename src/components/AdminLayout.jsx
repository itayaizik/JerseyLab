import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Shirt, Users, FolderOpen, Star, HelpCircle, Settings, ArrowRight, BarChart2, TrendingUp, Layout, Upload, Mail, Instagram } from 'lucide-react';

const adminLinks = [
  { to: '/admin', label: 'דשבורד', icon: LayoutDashboard },
  { to: '/admin/sales', label: 'דוח מכירות', icon: TrendingUp },
  { to: '/admin/add-shirt', label: 'הוסף מוצר', icon: PlusCircle },
  { to: '/admin/bulk-import', label: 'ייבוא מסיבי', icon: Upload },
  { to: '/admin/shirts', label: 'ערוך מוצרים', icon: Shirt },
  { to: '/admin/requests', label: 'בקשות לקוחות', icon: Users },
  { to: '/admin/contact-messages', label: 'פניות צור קשר', icon: Mail },
  { to: '/admin/categories', label: 'קטגוריות', icon: FolderOpen },
  { to: '/admin/reviews', label: 'ביקורות', icon: Star },
  { to: '/admin/faq', label: 'שאלות ותשובות', icon: HelpCircle },
  { to: '/admin/home-sections', label: 'עריכת דף הבית', icon: Layout },
  { to: '/admin/instagram', label: 'אינסטגרם', icon: Instagram },
  { to: '/admin/search-analytics', label: 'אנליטיקת חיפוש', icon: BarChart2 },
  { to: '/admin/settings', label: 'הגדרות', icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-pitch text-chalk flex flex-col">
      {/* Top Bar */}
      <div className="bg-pitch border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-varnish hover:text-turf transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <span className="font-heading font-black text-lg">
            <span className="text-turf">JERSEY</span>LAB
            <span className="text-varnish text-xs mr-2">/ ניהול</span>
          </span>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-56 bg-pitch border-l border-white/10 p-4 space-y-1 sticky top-12 h-[calc(100vh-48px)] overflow-y-auto">
          {adminLinks.map(link => {
            const Icon = link.icon;
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${active ? 'bg-turf/10 text-turf font-bold' : 'text-varnish hover:text-chalk hover:bg-white/5'}`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </aside>

        {/* Mobile Nav */}
        <div className="lg:hidden overflow-x-auto border-b border-white/10 bg-pitch sticky top-12 z-30">
          <div className="flex gap-1 p-2 min-w-max">
            {adminLinks.map(link => {
              const Icon = link.icon;
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap transition-colors ${active ? 'bg-turf text-pitch font-bold' : 'text-varnish hover:text-chalk'}`}
                >
                  <Icon className="w-3 h-3" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}