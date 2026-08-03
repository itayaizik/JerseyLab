import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, Truck, MapPin } from 'lucide-react';

const shippingTypes = [
  { Icon: Zap, title: 'משלוח מהיר', desc: 'הגעה עד 3 שבועות.', color: '#E8622A' },
  { Icon: Truck, title: 'מלאי בארץ', desc: 'זמין רק במידות שקיימות במלאי בארץ, הגעה עד שבוע או איסוף עצמי מקריית אונו.', color: '#1B2A4A' },
];

export default function ShippingInfoModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md text-right">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg uppercase text-[#1B2A4A]">פרטי משלוחים</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {shippingTypes.map((item, i) => {
            const Icon = item.Icon;
            return (
              <div key={i} className="flex gap-3 p-3 bg-[#F2ECD9]" style={{ border: '2px solid #1B2A4A' }}>
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: item.color }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-[#1B2A4A] uppercase">{item.title}</p>
                  <p className="text-xs text-[#1B2A4A]/70 font-body">{item.desc}</p>
                </div>
              </div>
            );
          })}
          <div className="p-3 bg-white" style={{ border: '2px solid #1B2A4A' }}>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#E8622A] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#1B2A4A]/80 font-body space-y-1">
                <p>משלוחים בתוספת תשלום זמינים רק לאזור המרכז.</p>
                <p>לאזורים אחרים כמו צפון ודרום אין משלוח כרגע.</p>
                <p>ניתן לבצע איסוף עצמי מקריית אונו בתיאום מראש.</p>
              </div>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-full bg-[#1B2A4A] text-white py-2.5 text-sm font-bold font-heading uppercase hover:bg-[#2a3f6b] transition-colors mt-2">
          סגור
        </button>
      </DialogContent>
    </Dialog>
  );
}