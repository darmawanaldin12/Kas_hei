'use client';
import { useEffect } from 'react';

const SEL = '.btn, .seg button, .av:not(.s), nav a, [role="button"]';

// Efek "tekan lalu kembali" untuk semua tombol di semua halaman dan semua peran.
export default function EfekTekan() {
  useEffect(() => {
    const mulai = (e) => {
      const el = e.target && e.target.closest ? e.target.closest(SEL) : null;
      if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
      const kls = getComputedStyle(el).boxShadow !== 'none' ? 'tekan' : 'tekan-flat';
      el.classList.remove('tekan', 'tekan-flat');
      void el.offsetWidth;
      el.classList.add(kls);
    };
    const tombol = (e) => { if (e.key === 'Enter' || e.key === ' ') mulai(e); };
    const selesai = (e) => { if (e.target && e.target.classList) e.target.classList.remove('tekan', 'tekan-flat'); };
    document.addEventListener('pointerdown', mulai, { passive: true });
    document.addEventListener('keydown', tombol);
    document.addEventListener('animationend', selesai);
    return () => {
      document.removeEventListener('pointerdown', mulai);
      document.removeEventListener('keydown', tombol);
      document.removeEventListener('animationend', selesai);
    };
  }, []);
  return null;
}
