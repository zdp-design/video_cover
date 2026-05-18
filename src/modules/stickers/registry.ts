export interface StickerAsset {
  id: string;
  name: string;
  category: string;
  svgSource: string;
}

export const STICKER_REGISTRY: StickerAsset[] = [
  {
    id: 'price_tag_1',
    name: '价格标签 1',
    category: '价格标签',
    svgSource: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    <linearGradient id="tagGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff4d4f" />
      <stop offset="100%" stop-color="#f5222d" />
    </linearGradient>
  </defs>
  <path d="M10 30 C 10 15, 15 10, 30 10 L 80 10 C 95 10, 95 15, 95 30 L 95 70 C 95 85, 95 90, 80 90 L 30 90 C 15 90, 10 85, 10 70 Z" fill="url(#tagGrad1)"/>
  <circle cx="25" cy="50" r="8" fill="#ffffff" />
  <text x="60" y="58" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="22" text-anchor="middle">SALE</text>
</svg>`,
  },
  {
    id: 'price_tag_2',
    name: '价格标签 2',
    category: '价格标签',
    svgSource: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    <linearGradient id="tagGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fa8c16" />
      <stop offset="100%" stop-color="#d46b08" />
    </linearGradient>
  </defs>
  <path d="M10 20 L90 20 L80 50 L90 80 L10 80 L20 50 Z" fill="url(#tagGrad2)"/>
  <text x="50" y="57" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="20" text-anchor="middle">HOT</text>
</svg>`,
  },
  {
    id: 'arrow_1',
    name: '箭头 1',
    category: '箭头',
    svgSource: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    <linearGradient id="arrowGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1890ff" />
      <stop offset="100%" stop-color="#096dd9" />
    </linearGradient>
  </defs>
  <path d="M10 35 H60 L45 15 H65 L95 50 L65 85 H45 L60 65 H10 Z" fill="url(#arrowGrad1)" />
</svg>`,
  },
  {
    id: 'arrow_2',
    name: '箭头 2',
    category: '箭头',
    svgSource: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    <linearGradient id="arrowGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#52c41a" />
      <stop offset="100%" stop-color="#389e0d" />
    </linearGradient>
  </defs>
  <path d="M20 70 C 20 40, 40 20, 70 20" fill="none" stroke="url(#arrowGrad2)" stroke-width="12" stroke-linecap="round" />
  <path d="M55 5 L85 20 L55 35 Z" fill="url(#arrowGrad2)" />
</svg>`,
  },
  {
    id: 'star_1',
    name: '星标 1',
    category: '星标',
    svgSource: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fadb14" />
      <stop offset="100%" stop-color="#d4b106" />
    </linearGradient>
  </defs>
  <path d="M50 10 L62 35 L89 38 L68 57 L74 84 L50 70 L26 84 L32 57 L11 38 L38 35 Z" fill="url(#starGrad)" />
</svg>`,
  },
  {
    id: 'badge_1',
    name: '推荐章 1',
    category: '推荐章',
    svgSource: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eb2f96" />
      <stop offset="100%" stop-color="#c41d7f" />
    </linearGradient>
  </defs>
  <path d="M50 10 L58 18 L68 14 L73 24 L84 24 L83 34 L91 42 L85 50 L89 60 L79 63 L74 73 L64 72 L58 80 L50 74 L42 80 L36 72 L26 73 L21 63 L11 60 L15 50 L9 42 L17 34 L16 24 L27 24 L32 14 L42 18 Z" fill="url(#badgeGrad)" />
  <circle cx="50" cy="46" r="24" fill="#ffffff" opacity="0.2" />
  <text x="50" y="52" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle">推荐</text>
</svg>`,
  },
];
