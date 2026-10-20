'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { sb, rp } from '../../lib/supabase';

function Riwayat() {
  const [r, setR] = useState(null);
  useEffect(() => {
    sb.from('kas_transaksi').select('id,jenis,jumlah,keterangan,tanggal')
      .order('tanggal', { ascending: false }).order('created_at', { ascending: false }).limit(50)
      .then((x) => setR(x.data || []));
  }, []);
  if (!r) return <p className="mut">Memuat…</p>;
  if (!r.length) return <p className="mut">Belum ada transaksi.</p>;
  return r.map((x) => (
    <div className="card row" key={x.id}>
      <div style={{ flex: 1 }}><b style={{ display: 'block' }}>{x.keterangan || (x.jenis === 'masuk' ? 'Kas masuk' : 'Kas keluar')}</b><small>{x.tanggal}</small></div>
      <b className={x.jenis === 'masuk' ? 'plus' : 'minus'} style={{ flex: 'none' }}>{x.jenis === 'masuk' ? '+' : '-'}{rp(x.jumlah)}</b>
    </div>
  ));
}

export default function Page() {
  return <Shell title="Riwayat">{() => <Riwayat />}</Shell>;
}
