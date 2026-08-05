import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ManageFAQ() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [editId, setEditId] = useState(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await base44.entities.FAQ.list('sort_order', 100);
    setFaqs(data);
    setLoading(false);
  }

  const handleAdd = async () => {
    if (!newQ.trim() || !newA.trim()) return;
    await base44.entities.FAQ.create({ question: newQ, answer: newA, sort_order: faqs.length, active: true });
    setNewQ(''); setNewA(''); setShowAdd(false);
    load();
  };

  const handleEdit = async (id) => {
    if (!editQ.trim() || !editA.trim()) return;
    await base44.entities.FAQ.update(id, { question: editQ, answer: editA });
    setEditId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('למחוק את השאלה הזו? הפעולה בלתי הפיכה.')) return;
    await base44.entities.FAQ.delete(id);
    setFaqs(p => p.filter(f => f.id !== id));
  };

  const toggleActive = async (id, active) => {
    await base44.entities.FAQ.update(id, { active: !active });
    setFaqs(p => p.map(f => f.id === id ? { ...f, active: !active } : f));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-black text-2xl text-turf">ניהול שאלות ותשובות</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 bg-turf text-pitch px-4 py-2 text-sm font-bold">
          <Plus className="w-4 h-4" /> הוסף שאלה
        </button>
      </div>

      {showAdd && (
        <div className="border border-turf/30 bg-white/5 p-4 mb-6 space-y-3">
          <input value={newQ} onChange={e => setNewQ(e.target.value)} placeholder="שאלה"
            className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
          <textarea value={newA} onChange={e => setNewA(e.target.value)} placeholder="תשובה" rows={3}
            className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none resize-none" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-turf text-pitch px-4 py-2 text-sm font-bold">שמור</button>
            <button onClick={() => setShowAdd(false)} className="text-varnish text-sm">ביטול</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {faqs.map(f => (
          <div key={f.id} className="border border-white/10 bg-white/5 p-4">
            {editId === f.id ? (
              <div className="space-y-3">
                <input value={editQ} onChange={e => setEditQ(e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:outline-none" />
                <textarea value={editA} onChange={e => setEditA(e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:outline-none resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(f.id)} className="text-turf text-sm flex items-center gap-1"><Check className="w-3 h-3" /> שמור</button>
                  <button onClick={() => setEditId(null)} className="text-varnish text-sm">ביטול</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(f.id, f.active)} className={`w-2 h-2 rounded-full ${f.active ? 'bg-turf' : 'bg-varnish'}`} />
                    <h3 className="font-heading font-bold text-sm">{f.question}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditId(f.id); setEditQ(f.question); setEditA(f.answer); }} className="text-varnish hover:text-turf"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(f.id)} className="text-varnish hover:text-redcard"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-sm text-varnish whitespace-pre-wrap">{f.answer}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {faqs.length === 0 && <p className="text-center py-8 text-varnish">אין שאלות ותשובות</p>}
    </div>
  );
}