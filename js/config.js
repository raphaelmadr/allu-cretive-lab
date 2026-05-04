// js/config.js

export const presets = {
    'ig-feed': { name: 'Instagram Feed', w: 1080, h: 1080 },
    'ig-carousel': { name: 'Instagram Carrossel', w: 1080, h: 1080, isCarousel: true },
    'ig-stories': { name: 'Instagram Stories', w: 1080, h: 1920 },
    'wa-feed': { name: 'WhatsApp Feed', w: 1080, h: 1350 },
    'li-post': { name: 'LinkedIn Post', w: 1200, h: 627 },
    'x-post': { name: 'X Post', w: 1200, h: 675 },
    'email-header': { name: 'Email Header', w: 600, h: 200 }
};

export const networkPresets = {
    'instagram': ['ig-feed', 'ig-carousel', 'ig-stories'],
    'facebook': ['ig-feed', 'ig-stories'],
    'whatsapp': ['wa-feed', 'ig-stories'],
    'linkedin': ['li-post'],
    'twitter': ['x-post'],
    'email': ['email-header']
};

export const templatesList = [
    { id: 'sig-clean', name: 'Assinatura Clean', network: 'email', icon: 'fa-signature' },
    { id: 'sig-modern', name: 'Assinatura Moderna', network: 'email', icon: 'fa-signature' },
    { id: 'ig-promo', name: 'Post Promoção', network: 'instagram', icon: 'fa-rectangle-ad' },
    { id: 'li-authority', name: 'Post Autoridade', network: 'linkedin', icon: 'fa-quote-left' }
];

export const colors = [
    '#0F190A', '#161617', '#1E8549', '#267AB3', '#27AE60', '#2E2F39', '#304D3C', '#3498DB', '#4BD184', '#565661', '#5C2D71', '#6F707E', '#828392', '#892E73', '#8D44AD', '#9BD3F9', '#A0EDC0', '#A8A9B8', '#A9AC39', '#C01A21', '#C59023', '#C5C5C5', '#C9621C', '#D85AB9', '#DDAFF1', '#DFDFD4', '#E4E773', '#E6E6E6', '#EFEFEF', '#F3F5A4', '#F45258', '#F4B2E4', '#F4F4EF', '#F78639', '#F7F7F9', '#FFAAAD', '#FFC49C', '#FFC857', '#FFE3AA'
];

// Paleta exclusiva para a aba de Fundo (Background)
export const backgroundColors = [
    { hex: '#27AE60', label: 'Verde Allu'      },
    { hex: '#0F190A', label: 'Verde Escuro'    },
    { hex: '#F4F4EF', label: 'Off-White'       },
    { hex: '#F7F7F9', label: 'Branco Suave'   },
    { hex: '#565661', label: 'Cinza Médio'     },
    { hex: '#2E2F39', label: 'Cinza Escuro'   },
];
