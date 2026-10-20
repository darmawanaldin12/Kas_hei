import { createClient } from '@supabase/supabase-js';

export const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon'
);

export const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
export const ym = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
export const addM = (s, n) => { const [y, m] = s.split('-').map(Number); return ym(new Date(y, m - 1 + n, 1)); };
const NM = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
export const lb = (s) => NM[+s.slice(5, 7) - 1];
