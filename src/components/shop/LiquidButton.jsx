import React, { useRef, useEffect, useState, useId } from 'react';
import { Link } from 'react-router-dom';

// A button with a drop of navy that follows the cursor through the orange.
//
// Adapted from Originkit's Liquid Carve. Two things changed, both deliberate.
//
// The original replaces the button with a <div role="button"> wrapping SVG
// rectangles that draw its fill. That means re-implementing the gradient, the
// shadow, the radius, the focus ring and the disabled state in SVG - and it
// cannot be a submit button or a router link, which is what most of the big
// buttons on this site actually are. Here the button stays a real button (or a
// real Link) with its ordinary `shop-btn` styling, and the effect is an overlay
// that paints between the background and the label. Nothing about the button's
// behaviour changes; it only gains a decoration.
//
// The original also carves a hole out of the fill. Over a gradient that reads
// as a scratch rather than as liquid, so the blob is painted on instead: navy
// through orange, which is the pair the rest of the site is built from.
//
// `feGaussianBlur` into a steep `feColorMatrix` is the gooey part - it rounds
// the blob and lets it merge with itself as it stretches, the same trick the
// original uses.

// The goo blur has to scale with the drop. Fixed, it rounds a big blob nicely
// and erases a small one: feColorMatrix only keeps alpha above about 0.47, and a
// heavily blurred small circle never reaches it.
const GOO_BLUR_RATIO = 0.15;

// A drop has to be a colour the button is not, and it has to leave the label
// readable - it passes straight under it. So each button style gets its own:
// white through the orange, orange through the navy, and orange through the
// white one, where a navy drop would have fought the navy text the same way a
// white drop fights white text.
const VARIANTS = {
  primary: { base: 'shop-btn', color: '#ffffff', opacity: 0.38 },
  secondary: { base: 'shop-btn-secondary', color: 'var(--brand-orange)', opacity: 0.3 },
  dark: { base: 'shop-btn-dark', color: 'var(--brand-orange)', opacity: 0.5 },
};

// How hard the blob chases the cursor, and how much it stretches doing it.
const FOLLOW_TAU = 0.075;
const SQUASH_TAU = 0.09;
const SQUASH_PER_PX_PER_SEC = 0.0011;
const SQUASH_MAX = 1.5;

// Hover is the whole effect, and a phone has no hover - so on a touch screen
// this is simply a button, with none of the work set up. Same for anyone who
// has asked their system for less motion.
const wantsEffect = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export default function LiquidButton({
  children,
  to,
  href,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  variant = 'primary',
  blobColor,
  // The opacity goes on the filtered group rather than on the circle:
  // feColorMatrix drives alpha through 19x-9, so a see-through circle is pushed
  // to nothing before it is ever drawn.
  blobOpacity,
  // Null means size it from the button: a fixed blob swamps a small one and
  // is lost in a wide one.
  blobSize = null,
  ...rest
}) {
  const rootRef = useRef(null);
  const blobRef = useRef(null);
  const squashRef = useRef(null);
  const frame = useRef(0);
  const state = useRef({ x: 0, y: 0, tx: 0, ty: 0, squash: 1, angle: 0, scale: 0, on: false });
  const [enabled, setEnabled] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0, radius: 0 });

  const uid = useId().replace(/:/g, '');
  const filterId = `liquid-goo-${uid}`;
  const clipId = `liquid-clip-${uid}`;

  useEffect(() => { setEnabled(wantsEffect()); }, []);

  // The overlay is sized and rounded to match whatever the button actually is,
  // rather than assuming the class's radius.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !enabled) return undefined;
    const read = () => {
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      setBox(prev => (
        prev.w === el.offsetWidth && prev.h === el.offsetHeight && prev.radius === radius
          ? prev
          : { w: el.offsetWidth, h: el.offsetHeight, radius }
      ));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [enabled]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // The original runs its loop for the life of the page, on every button,
  // hovered or not. This one runs only while the cursor is inside and stops
  // itself once the blob has shrunk away.
  const tick = (last) => {
    const now = performance.now();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    const s = state.current;

    const k = 1 - Math.exp(-dt / FOLLOW_TAU);
    const dx = (s.tx - s.x) * k;
    const dy = (s.ty - s.y) * k;
    s.x += dx;
    s.y += dy;

    const speed = Math.hypot(dx, dy) / dt;
    const want = Math.min(SQUASH_MAX, 1 + speed * SQUASH_PER_PX_PER_SEC);
    s.squash += (want - s.squash) * (1 - Math.exp(-dt / SQUASH_TAU));
    if (speed > 8) s.angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    const target = s.on ? 1 : 0;
    s.scale += (target - s.scale) * (1 - Math.exp(-dt / 0.12));

    if (blobRef.current) {
      blobRef.current.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale})`;
    }
    if (squashRef.current) {
      squashRef.current.style.transform = `rotate(${s.angle}deg) scale(${s.squash}, ${1 / s.squash})`;
    }

    if (!s.on && s.scale < 0.01) {
      s.scale = 0;
      if (blobRef.current) blobRef.current.style.transform = 'scale(0)';
      frame.current = 0;
      return;
    }
    frame.current = requestAnimationFrame(() => tick(now));
  };

  const start = () => { if (!frame.current) frame.current = requestAnimationFrame(() => tick(0)); };

  const at = (e) => {
    const el = rootRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  };

  const onEnter = (e) => {
    if (!enabled || disabled) return;
    const p = at(e);
    if (!p) return;
    const s = state.current;
    s.on = true;
    s.tx = p.x; s.ty = p.y; s.x = p.x; s.y = p.y;
    start();
  };

  const onMove = (e) => {
    if (!enabled || disabled || !state.current.on) return;
    const p = at(e);
    if (!p) return;
    state.current.tx = p.x;
    state.current.ty = p.y;
  };

  const onLeave = () => {
    state.current.on = false;
    start();
  };

  // Sized from the button rather than fixed: the same drop swamps a small one
  // and is lost in a large one.
  const blobD = blobSize ?? Math.max(40, Math.min(96, box.h * 0.95));
  const blobR = blobD / 2;
  const style = VARIANTS[variant] || VARIANTS.primary;
  const dropColor = blobColor ?? style.color;
  const dropOpacity = blobOpacity ?? style.opacity;
  const gooBlur = Math.max(2.5, blobD * GOO_BLUR_RATIO);

  const overlay = enabled && box.w > 0 && !disabled ? (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ borderRadius: 'inherit' }}>
      <defs>
        {/* The region matters. A filter with none gets the blob's own box plus
            a tenth, and the blur spreads far past that - so its soft edge was
            being sliced off square, which is what made the drop look cornered
            rather than round. */}
        <filter id={filterId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={gooBlur} result="blur" />
          <feColorMatrix in="blur" mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" />
        </filter>
        {/* The button's own corner radius, read off the element. Assuming a
            pill here cut the blob along a curve the button does not have. */}
        <clipPath id={clipId}>
          <rect x="0" y="0" width={box.w} height={box.h} rx={box.radius} ry={box.radius} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <g filter={`url(#${filterId})`} opacity={dropOpacity}>
          <g ref={blobRef} style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: 'scale(0)' }}>
            <g ref={squashRef} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
              <circle cx="50%" cy="50%" r={blobR} fill={dropColor} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  ) : null;

  // The label has to sit above the overlay, so it gets its own stacking level.
  const body = (
    <>
      {overlay}
      <span className="relative z-[1] inline-flex items-center justify-center gap-2">{children}</span>
    </>
  );

  const shared = {
    ref: rootRef,
    onPointerEnter: onEnter,
    onPointerMove: onMove,
    onPointerLeave: onLeave,
    className: `${style.base} relative overflow-hidden ${className}`,
    ...rest,
  };

  if (to) return <Link to={to} {...shared}>{body}</Link>;
  if (href) return <a href={href} {...shared}>{body}</a>;
  return <button type={type} onClick={onClick} disabled={disabled} {...shared}>{body}</button>;
}
