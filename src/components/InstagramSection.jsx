import React, { useState, useEffect } from 'react';
import { Instagram, Heart, MessageCircle, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

export default function InstagramSection({ title, instagramHandle = 'Jerseylabil' }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.InstagramPost.filter({ active: true }, 'sort_order', 6)
      .then(data => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="bg-[#F2ECD9] py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045)' }}>
              <Instagram className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-heading font-bold text-xl text-[#1B2A4A] uppercase tracking-wide">
              {title || 'עקבו אותנו באינסטגרם'}
            </h2>
          </div>
          <a
            href={`https://instagram.com/${instagramHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#E8622A] font-body font-medium hover:underline"
          >
            @{instagramHandle}
          </a>
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square skeleton" />
              ))
            : posts.map(post => (
                <a
                  key={post.id}
                  href={post.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square overflow-hidden bg-white group"
                  style={{ border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #1B2A4A' }}
                >
                  <img
                    src={post.image_url}
                    alt={post.caption || 'Instagram post'}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-[#1B2A4A]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-3 text-center">
                    {post.caption && (
                      <p className="text-white text-[10px] md:text-xs font-body line-clamp-3 mb-2 leading-snug">{post.caption}</p>
                    )}
                    <ExternalLink className="w-4 h-4 text-[#E8622A]" />
                  </div>
                  {/* Instagram icon badge */}
                  <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-0">
                    <Instagram className="w-3 h-3 text-white" />
                  </div>
                </a>
              ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-6">
          <a
            href={`https://instagram.com/${instagramHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#1B2A4A] text-white px-6 py-3 text-sm font-heading font-bold uppercase tracking-wider hover:bg-[#2a3f6b] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
            style={{ boxShadow: '3px 3px 0 #E8622A' }}
          >
            <Instagram className="w-4 h-4" />
            עקבו אותנו
          </a>
        </div>
      </div>
    </section>
  );
}