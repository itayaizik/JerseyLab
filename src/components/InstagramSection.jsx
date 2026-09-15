import React, { useState, useEffect } from 'react';
import { Instagram, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionHeader from '@/components/shop/SectionHeader';
import { t } from '@/lib/i18n';

// Posts from the shop's Instagram, managed from ניהול > אינסטגרם. Hidden when
// there are none.
export default function InstagramSection({ title, instagramHandle = 'Jerseylabil' }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.InstagramPost.filter({ active: true }, 'sort_order', 6)
      .then(data => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) return null;

  const profileUrl = `https://instagram.com/${instagramHandle}`;

  return (
    <section className="shop-container mt-16 sm:mt-24" aria-labelledby="instagram-heading">
      <SectionHeader
        id="instagram-heading"
        title={title || t('עקבו אחרינו באינסטגרם', 'Follow us on Instagram')}
        subtitle={<a href={profileUrl} target="_blank" rel="noopener noreferrer" className="shop-link" dir="ltr">@{instagramHandle}</a>}
      />

      <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="aspect-square rounded-3xl skeleton" />
          ))
          : posts.map(post => (
            <li key={post.id}>
              <a href={post.post_url} target="_blank" rel="noopener noreferrer"
                aria-label={post.caption ? t(`פוסט באינסטגרם: ${post.caption}`, `Instagram post: ${post.caption}`) : t('פוסט באינסטגרם', 'Instagram post')}
                className="group relative block aspect-square overflow-hidden rounded-3xl bg-brand-mist">
                <img src={post.image_url} alt="" loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 flex flex-col items-center justify-center bg-brand-navy/75 p-3 text-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {post.caption && <span className="mb-2 line-clamp-3 text-xs leading-snug text-white">{post.caption}</span>}
                  <ExternalLink className="h-4 w-4 text-white" aria-hidden="true" />
                </span>
              </a>
            </li>
          ))}
      </ul>

      <div className="mt-8 text-center">
        <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="shop-btn-secondary rounded-full px-8">
          <Instagram className="h-5 w-5" aria-hidden="true" />
          {t('לעמוד שלנו באינסטגרם', 'See us on Instagram')}
        </a>
      </div>
    </section>
  );
}
