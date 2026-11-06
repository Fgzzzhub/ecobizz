import React from 'react';

interface IllustrationProps {
  className?: string;
}

/**
 * Hand-crafted line SVG illustration: Baskom Adonan (Dough Basin & Ladle)
 */
export function BaskomIllustration({ className = 'w-14 h-14' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Ladle handle sticking out */}
      <path
        d="M42 24L53 11C54.2 9.6 56.2 10.8 55 12.4L45 25"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dough wave inside basin */}
      <path
        d="M14 26C19 23 24 27 30 25C36 23 41 27 50 25"
        stroke="#E0A526"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Basin rim */}
      <ellipse
        cx="32"
        cy="26"
        rx="22"
        ry="5.5"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      {/* Basin body */}
      <path
        d="M10 26C11.5 42 18 50 32 50C46 50 52.5 42 54 26"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Cross-hatch ink shading lines on left of basin */}
      <path
        d="M14 33L19 35M16 38L22 40M19 43L25 45"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Basin foot ring */}
      <path
        d="M22 50H42"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Measurement ticks on side */}
      <path
        d="M36 35H41M35 41H42"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

/**
 * Hand-crafted line SVG illustration: Jeriken Minyak Jelantah (Used Cooking Oil Jerrycan)
 */
export function JerikenIllustration({ className = 'w-14 h-14' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cap */}
      <rect
        x="20"
        y="9"
        width="11"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      {/* Jerrycan body */}
      <path
        d="M19 14H33L47 22V51C47 53.2 45.2 55 43 55H21C18.8 55 17 53.2 17 51V16C17 14.9 17.9 14 19 14Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Handle cut-out */}
      <path
        d="M35 21L42 25V32H35V21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Oil level wave inside */}
      <path
        d="M20 41C25 39 29 43 34 41C38 39.5 41 42 44 41"
        stroke="#E0A526"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      {/* Volume graduation marks */}
      <path
        d="M17 30H21M17 38H21M17 46H21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Oil droplet */}
      <path
        d="M28 29C28 29 25 32.5 25 34.2C25 35.9 26.3 37.2 28 37.2C29.7 37.2 31 35.9 31 34.2C31 32.5 28 29 28 29Z"
        stroke="#C4572F"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/**
 * Hand-crafted line SVG illustration: Kantong Kemasan & Kertas Bungkus
 */
export function KantongPlastikIllustration({
  className = 'w-14 h-14',
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left handle & right handle */}
      <path
        d="M19 24V15C19 12.8 20.8 11 23 11H26V24H38V11H41C43.2 11 45 12.8 45 15V24"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bag body */}
      <path
        d="M17 24H47L49 51C49 53.2 47.2 55 45 55H19C16.8 55 15 53.2 15 51L17 24Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Leaf / Reuse emblem inside bag */}
      <path
        d="M26 42C26 36 32 32 38 32C38 38 34 44 28 44"
        stroke="#4F8A4B"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M26 44L33 37"
        stroke="#4F8A4B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Hand-crafted line SVG illustration: Gerobak Warung Kuliner (Street Food Cart)
 */
export function GerobakWarungIllustration({
  className = 'w-16 h-16',
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Awning roof with scalloped warung edge */}
      <path
        d="M12 22L18 13H54L60 22H12Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M12 22C14.5 25 17.5 25 20 22C22.5 25 25.5 25 28 22C30.5 25 33.5 25 36 22C38.5 25 41.5 25 44 22C46.5 25 49.5 25 52 22C54.5 25 57.5 25 60 22"
        stroke="#C4572F"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Cart pillars & window */}
      <path
        d="M16 24V38M56 24V38"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Wok / Penggorengan on counter */}
      <path
        d="M25 34C27 38 35 38 37 34"
        stroke="#E0A526"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Steam lines above wok */}
      <path
        d="M29 29C29 27 30.5 27 30.5 25M33 30C33 28 34.5 28 34.5 26"
        stroke="#E0A526"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Cart main wooden cabinet */}
      <rect
        x="14"
        y="38"
        width="44"
        height="16"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      {/* Wooden plank lines */}
      <path
        d="M28 38V54M44 38V54"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.45"
      />
      {/* Push handle */}
      <path
        d="M58 41H64V47"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Spoked cart wheel & support leg */}
      <circle
        cx="28"
        cy="57"
        r="6"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <circle cx="28" cy="57" r="1.5" fill="currentColor" />
      <path
        d="M48 54V62M44 62H52"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Hand-crafted Wire Paperclip (Klip Kertas Besi) to pin bon slips onto the ledger
 */
export function PaperClipIllustration({
  className = 'w-6 h-12',
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 28 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M19 14V39C19 44.5 14.5 49 9 49C3.5 49 2 44.5 2 39V11C2 6.5 5.5 3 10 3C14.5 3 18 6.5 18 11V36C18 38.8 15.8 41 13 41C10.2 41 8 38.8 8 36V15"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Hand-crafted Fountain / Dip Pen & Ledger Ink Illustration
 */
export function PenaTintaIllustration({
  className = 'w-12 h-12',
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Pen nib and barrel */}
      <path
        d="M48 10L54 16L26 44L14 48L18 36L48 10Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M42 16L48 22"
        stroke="#E0A526"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Nib slit */}
      <path
        d="M14 48L21 41"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Written ledger line */}
      <path
        d="M12 54H52"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 3"
      />
    </svg>
  );
}

/**
 * Hand-crafted Traditional Market Scale (Timbangan Bebek Pasar)
 */
export function TimbanganPasarIllustration({
  className = 'w-12 h-12',
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Pan on left */}
      <path
        d="M8 24H30L26 31H12L8 24Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Counterweights on right */}
      <rect
        x="43"
        y="25"
        width="10"
        height="8"
        stroke="#E0A526"
        strokeWidth="2.2"
      />
      {/* Balance beam & base */}
      <path
        d="M19 31V37H48V33"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 52L29 37H39L44 52H24Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M18 52H50"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
