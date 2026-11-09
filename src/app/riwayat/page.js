'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { sb, rp, lb } from '../../lib/supabase';

const tgl = (s) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function Riwayat() {
  const [r, setR] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await sb.from('kas_transaksi').select('id,jenis,jumlah,keterangan,tanggal,iuran_id')
        .order('tanggal', { ascending: false }).order('created_at', { ascending: false }).limit(50);
      const rows = data || [];
      const ids = rows.map((x) => x.iuran_id).filter(Boolean);
      const info = {};
      if (ids.length) {
        const { data: iu } = await sb.from('iuran').select('id,anggota_id,bulan').in('id', ids);
        const aids = [...new Set((iu || []).map((x) => x.anggota_id))];
        const { data: pp } = aids.length ? await sb.from('profiles').select('id,nama').in('id', aids) : { data: [] };
        const nama = Object.fromEntries((pp || []).map((p) => [p.id, p.nama]));
        (iu || []).forEach((x) => { info[x.id] = { nama: nama[x.anggota_id] || '?', bulan: x.bulan }; });
      }
      setR(rows.map((x) => ({ ...x, iu: info[x.iuran_id] })));
    })();
  }, []);
  if (!r) return <p className="mut">Memuat…</p>;
  if (!r.length) return <p className="mut">Belum ada transaksi.</p>;
  return r.map((x) => (
    <div className="card row" key={x.id}>
      <div style={{ flex: 1 }}>
        <b style={{ display: 'block' }}>{x.iu ? x.iu.nama : (x.keterangan || (x.jenis === 'masuk' ? 'Kas masuk' : 'Kas keluar'))}</b>
        <small>{x.iu ? 'Iuran ' + lb(x.iu.bulan) + ' ' + x.iu.bulan.slice(0, 4) + ' · ' : ''}{tgl(x.tanggal)}</small>
      </div>
      <b className={x.jenis === 'masuk' ? 'plus' : 'minus'} style={{ flex: 'none' }}>{x.jenis === 'masuk' ? '+' : '-'}{rp(x.jumlah)}</b>
    </div>
  ));
}

export default function Page() {
  return <Shell title="Riwayat">{() => <Riwayat />}</Shell>;
}
