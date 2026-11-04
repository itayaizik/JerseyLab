import React from 'react';
import ShirtCard from '@/components/ShirtCard';
import ScrollRow from '@/components/shop/ScrollRow';
import { IMAGE_SIZES } from '@/components/ui/ProductImage';

// A sideways row of product cards: "אולי יעניין אתכם גם" on the product page,
// the picks on the home page.
export default function ProductRail({ shirts, user, wishlistIds = [], onToggleWishlist, label }) {
  return (
    <ScrollRow label={label} itemClassName="w-[72%] sm:w-[42%] md:w-[31%] lg:w-[23.5%] xl:w-[19%]">
      {shirts.map((shirt, i) => (
        <ShirtCard
          key={shirt.id}
          shirt={shirt}
          user={user}
          eager={i < 2}
          sizes={IMAGE_SIZES.rail}
          isWishlisted={wishlistIds.includes(shirt.id)}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </ScrollRow>
  );
}
