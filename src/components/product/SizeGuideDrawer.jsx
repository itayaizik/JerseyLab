import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SideDrawer from '@/components/shop/SideDrawer';
import { t } from '@/lib/i18n';
import { SizeChartTabs, SizeChartTable, SizeTips, SizeCalculator } from '@/components/product/SizeChart';

// The size tables without leaving the product page. Opens on the version the
// customer is looking at: the player table when player version is selected,
// the kids table for a kids shirt.
export default function SizeGuideDrawer({ open, onOpenChange, shirtName, defaultTab = 'fan' }) {
  const [tab, setTab] = useState(defaultTab);

  useEffect(() => { if (open) setTab(defaultTab); }, [open, defaultTab]);

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      label={t('מדריך מידות', 'Size guide')}
      title={shirtName}
      className="w-[min(96vw,44rem)]"
    >
      <SizeChartTabs value={tab} onChange={setTab} />
      {(tab === 'fan' || tab === 'player') && (
        <div className="mt-5">
          <SizeCalculator tab={tab} />
        </div>
      )}
      <div className="mt-5">
        <SizeChartTable tab={tab} />
      </div>
      <div className="mt-6 rounded-3xl bg-brand-mist p-5 sm:p-6">
        <SizeTips compact />
      </div>
      <p className="mt-5 text-[13px] text-brand-navy/55">
        {t('לא בטוחים?', 'Not sure?')} <Link to="/contact" className="shop-link">{t('כתבו לנו', 'Write to us')}</Link> {t('ונמליץ על מידה.', "and we'll recommend a size.")}
      </p>
    </SideDrawer>
  );
}
