import React, { useState, useEffect } from 'react';
import { Mail, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ManageContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'new', 'handled'

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const loadMessages = async () => {
    setLoading(true);
    const query = filter === 'all' ? {} : { status: filter === 'new' ? 'new' : 'טופל' };
    const data = await base44.entities.ContactMessage.filter(query, '-created_date', 100);
    setMessages(data);
    setLoading(false);
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'new' ? 'טופל' : 'new';
    await base44.entities.ContactMessage.update(id, { status: newStatus });
    loadMessages();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('למחוק את הפנייה הזו? הפעולה בלתי הפיכה.')) return;
    await base44.entities.ContactMessage.delete(id);
    setMessages(p => p.filter(m => m.id !== id));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-black text-2xl text-turf mb-4">פניות צור קשר</h1>

        {/* Filter buttons */}
        <div className="flex gap-2 mb-4">
          {[
            { value: 'all', label: 'הכל' },
            { value: 'new', label: 'חדשות' },
            { value: 'handled', label: 'טופלו' },
          ].map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-4 py-2 text-sm font-bold border-2 transition-colors ${
                filter === btn.value
                  ? 'bg-turf text-pitch border-turf'
                  : 'bg-white/5 text-varnish border-white/10 hover:border-turf'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 mx-auto text-varnish/30 mb-3" />
          <p className="text-varnish text-sm">אין פניות להצגה</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className="border border-white/10 bg-white/5 p-4 space-y-2"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm text-chalk">{msg.name}</p>
                  <p className="text-xs text-varnish font-mono" dir="ltr">
                    {msg.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs font-bold px-2 py-1 ${
                      msg.status === 'new'
                        ? 'bg-turf/20 text-turf'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {msg.status === 'new' ? 'חדשה' : 'טופלה'}
                  </span>
                  <button
                    onClick={() => toggleStatus(msg.id, msg.status)}
                    className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 transition-colors border border-white/10 text-chalk"
                  >
                    {msg.status === 'new' ? 'סמן כטופלה' : 'סמן כחדשה'}
                  </button>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    aria-label="מחק פנייה"
                    className="p-1.5 bg-white/10 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-white/10 text-chalk"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Contact details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-varnish">
                {msg.phone && (
                  <div>
                    <p className="text-white/50">טלפון</p>
                    <p className="font-mono text-chalk" dir="ltr">
                      {msg.phone}
                    </p>
                  </div>
                )}
                {msg.subject && (
                  <div>
                    <p className="text-white/50">נושא</p>
                    <p className="text-chalk truncate">{msg.subject}</p>
                  </div>
                )}
                <div>
                  <p className="text-white/50">תאריך</p>
                  <p className="text-chalk">{formatDate(msg.created_date)}</p>
                </div>
              </div>

              {/* Message */}
              <div className="bg-white/5 border border-white/5 p-3 rounded">
                <p className="text-sm text-chalk leading-relaxed">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}