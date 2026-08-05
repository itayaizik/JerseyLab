import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await base44.entities.Category.list('sort_order', 100);
    setCategories(data);
    setLoading(false);
  }

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await base44.entities.Category.create({ name: newName, slug: newName.replace(/\s+/g, '-'), active: true, sort_order: categories.length });
    setNewName('');
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('למחוק את הקטגוריה הזו? הפעולה בלתי הפיכה.')) return;
    await base44.entities.Category.delete(id);
    setCategories(p => p.filter(c => c.id !== id));
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) return;
    await base44.entities.Category.update(id, { name: editName, slug: editName.replace(/\s+/g, '-') });
    setEditId(null);
    load();
  };

  const toggleActive = async (id, active) => {
    await base44.entities.Category.update(id, { active: !active });
    setCategories(p => p.map(c => c.id === id ? { ...c, active: !active } : c));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="font-heading font-black text-2xl mb-6 text-turf">ניהול קטגוריות</h1>

      <div className="flex gap-2 mb-6">
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="שם קטגוריה חדשה..."
          className="flex-1 bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
        <button onClick={handleAdd} className="bg-turf text-pitch px-4 py-2.5 text-sm font-bold flex items-center gap-1">
          <Plus className="w-4 h-4" /> הוסף
        </button>
      </div>

      <div className="space-y-2">
        {categories.map(c => (
          <div key={c.id} className="border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
            {editId === c.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 bg-white/5 border border-white/10 px-2 py-1 text-sm text-chalk focus:outline-none" />
                <button onClick={() => handleEdit(c.id)} className="text-turf"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditId(null)} className="text-varnish"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleActive(c.id, c.active)}
                    className={`w-2 h-2 rounded-full ${c.active ? 'bg-turf' : 'bg-varnish'}`} />
                  <span className="text-sm">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditId(c.id); setEditName(c.name); }} className="text-varnish hover:text-turf"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-varnish hover:text-redcard"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && <p className="text-center py-8 text-varnish">אין קטגוריות</p>}
    </div>
  );
}