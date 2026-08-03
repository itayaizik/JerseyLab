import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Instagram, GripVertical } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ManageInstagram() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ image_url: '', caption: '', post_url: '', sort_order: 0 });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.InstagramPost.list('sort_order', 50);
    setPosts(data);
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newPost.image_url || !newPost.post_url) return;
    setSaving(true);
    await base44.entities.InstagramPost.create({ ...newPost, sort_order: Number(newPost.sort_order) || 0, active: true });
    setNewPost({ image_url: '', caption: '', post_url: '', sort_order: 0 });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק פוסט זה?')) return;
    await base44.entities.InstagramPost.delete(id);
    load();
  };

  const toggleActive = async (post) => {
    await base44.entities.InstagramPost.update(post.id, { active: !post.active });
    load();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-black text-2xl text-turf">פוסטים באינסטגרם</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-turf text-pitch px-4 py-2 font-heading font-bold text-sm uppercase hover:bg-turf/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          הוסף פוסט
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white/5 border border-white/10 p-4 mb-6 space-y-3">
          <div>
            <label className="text-sm text-varnish block mb-1">קישור לתמונה (URL) *</label>
            <input
              value={newPost.image_url}
              onChange={e => setNewPost(p => ({ ...p, image_url: e.target.value }))}
              dir="ltr"
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-sm text-varnish block mb-1">קישור לפוסט באינסטגרם *</label>
            <input
              value={newPost.post_url}
              onChange={e => setNewPost(p => ({ ...p, post_url: e.target.value }))}
              dir="ltr"
              placeholder="https://instagram.com/p/..."
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-sm text-varnish block mb-1">כיתוב (אופציונלי)</label>
            <textarea
              value={newPost.caption}
              onChange={e => setNewPost(p => ({ ...p, caption: e.target.value }))}
              rows={2}
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-sm text-varnish block mb-1">סדר תצוגה</label>
            <input
              type="number"
              value={newPost.sort_order}
              onChange={e => setNewPost(p => ({ ...p, sort_order: e.target.value }))}
              className="w-32 bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none"
            />
          </div>
          <button type="submit" disabled={saving} className="bg-turf text-pitch px-5 py-2 font-heading font-bold text-sm uppercase hover:bg-turf/90 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            שמור
          </button>
        </form>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12 text-varnish">
          <Instagram className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>אין פוסטים עדיין. הוסף פוסט ראשון.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {posts.map(post => (
            <div key={post.id} className="bg-white/5 border border-white/10 overflow-hidden">
              <div className="aspect-square overflow-hidden bg-white/5">
                <img src={post.image_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                {post.caption && <p className="text-xs text-chalk/70 line-clamp-2 mb-2">{post.caption}</p>}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleActive(post)}
                    className={`text-xs px-2 py-1 font-heading font-bold uppercase ${post.active ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-varnish'}`}
                  >
                    {post.active ? 'פעיל' : 'מוסתר'}
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="text-varnish hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}