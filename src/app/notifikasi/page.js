'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import Memuat from '../../components/Memuat';
import { sb, lb, rp } from '../../lib/supabase';

const tgl = (s) =>
  s
    ? new Date(s).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta',
      }) + ' WIB'
    : '-';

const STORAGE_KEY = 'notif_dibaca_at';

function waktuRelatif(s) {
  if (!s) return '';
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return m + ' menit lalu';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' jam lalu';
  const d = Math.floor(h / 24);
  return d + ' hari lalu';
}

function Notifikasi({ me }) {
  const [items, setItems] = useState(null);
  const [dibacaAt, setDibacaAt] = useState(null);

  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    setDibacaAt(v ? new Date(v) : null);
  }, []);

  useEffect(() => {
    if (!me) return;
    (async () => {
      let notifs = [];

      if (me.role === 'anggota' || me.role === 'ketua') {
        // Tampilkan iuran yg ditolak atau baru lunas milik sendiri
        const { data } = await sb
          .from('iuran')
          .select('id,bulan,status,catatan,diverifikasi_at,nominal')
          .eq('anggota_id', me.id)
          .in('status', ['ditolak', 'lunas'])
          .order('diverifikasi_at', { ascending: false })
          .limit(30);

        (data || []).forEach((x) => {
          notifs.push({
            id: x.id,
            tipe: x.status === 'ditolak' ? 'tolak' : 'lunas',
            judul:
              x.status === 'ditolak'
                ? `Bukti ${lb(x.bulan)} ditolak`
                : `Iuran ${lb(x.bulan)} lunas ✓`,
            sub:
              x.status === 'ditolak'
                ? x.catatan
                  ? 'Alasan: ' + x.catatan
                  : 'Silakan kirim ulang bukti'
                : rp(x.nominal) + ' tercatat masuk kas',
            waktu: x.diverifikasi_at,
          });
        });
      }

      if (me.role === 'bendahara' || me.role === 'ketua') {
        // Bukti menunggu verifikasi
        const { data: tunggu } = await sb
          .from('iuran')
          .select('id,bulan,anggota_id,dikirim_at,nominal')
          .eq('status', 'menunggu_verifikasi')
          .order('dikirim_at', { ascending: false })
          .limit(20);

        const ids = [...new Set((tunggu || []).map((x) => x.anggota_id))];
        const namaMap = {};
        if (ids.length) {
          const { data: pp } = await sb
            .from('profiles')
            .select('id,nama')
            .in('id', ids);
          (pp || []).forEach((p) => { namaMap[p.id] = p.nama; });
        }

        (tunggu || []).forEach((x) => {
          notifs.push({
            id: 'w-' + x.id,
            tipe: 'tunggu',
            judul: `Bukti dari ${namaMap[x.anggota_id] || '?'}`,
            sub: `Iuran ${lb(x.bulan)} · ${rp(x.nominal)} — menunggu verifikasi`,
            waktu: x.dikirim_at,
          });
        });

        // Iuran baru lunas (7 hari terakhir)
        const batas = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: baru } = await sb
          .from('iuran')
          .select('id,bulan,anggota_id,diverifikasi_at,nominal')
          .eq('status', 'lunas')
          .gte('diverifikasi_at', batas)
          .order('diverifikasi_at', { ascending: false })
          .limit(20);

        const ids2 = [...new Set((baru || []).map((x) => x.anggota_id))];
        const namaMap2 = {};
        if (ids2.length) {
          const { data: pp2 } = await sb
            .from('profiles')
            .select('id,nama')
            .in('id', ids2);
          (pp2 || []).forEach((p) => { namaMap2[p.id] = p.nama; });
        }

        (baru || []).forEach((x) => {
          notifs.push({
            id: 'l-' + x.id,
            tipe: 'lunas',
            judul: `${namaMap2[x.anggota_id] || '?'} lunas ${lb(x.bulan)} ✓`,
            sub: rp(x.nominal) + ' masuk kas',
            waktu: x.diverifikasi_at,
          });
        });
      }

      // Urutkan berdasarkan waktu terbaru
      notifs.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));
      setItems(notifs);

      // Tandai sudah dibaca
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, now);
      setDibacaAt(new Date(now));
      window.dispatchEvent(new Event('notif-dibaca'));
    })();
  }, [me]);

  if (!items) return <Memuat />;
  if (!items.length)
    return (
      <div style={{ textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
        <p className="mut">Belum ada notifikasi.</p>
      </div>
    );

  return (
    <>
      <small style={{ display: 'block', marginBottom: 12 }}>
        {items.length} notifikasi
      </small>
      {items.map((x) => {
        const baru = dibacaAt ? new Date(x.waktu) > dibacaAt : false;
        const bg =
          x.tipe === 'tolak'
            ? 'var(--peach)'
            : x.tipe === 'tunggu'
            ? '#FDE068'
            : 'var(--mint)';
        const ikon =
          x.tipe === 'tolak' ? '✕' : x.tipe === 'tunggu' ? '…' : '✓';
        return (
          <div
            key={x.id}
            className="card"
            style={{
              background: bg,
              borderWidth: baru ? 3 : 3,
              position: 'relative',
            }}
          >
            {baru && (
              <span
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 12,
                  background: '#E5484D',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 8px',
                  border: '2px solid var(--ink)',
                }}
              >
                BARU
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span
                style={{
                  width: 38,
                  height: 38,
                  flexShrink: 0,
                  border: '3px solid var(--ink)',
                  borderRadius: '50%',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 16,
                  boxShadow: '2px 2px 0 var(--ink)',
                }}
              >
                {ikon}
              </span>
              <div style={{ flex: 1 }}>
                <b style={{ display: 'block', fontSize: 15 }}>{x.judul}</b>
                {x.sub && (
                  <small style={{ display: 'block', marginTop: 2, fontWeight: 600 }}>
                    {x.sub}
                  </small>
                )}
                <small
                  style={{
                    display: 'block',
                    marginTop: 6,
                    opacity: 0.7,
                    fontWeight: 700,
                  }}
                >
                  {waktuRelatif(x.waktu)} · {tgl(x.waktu)}
                </small>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function Page() {
  return (
    <Shell title="Notifikasi">
      {(me) => <Notifikasi me={me} />}
    </Shell>
  );
}
