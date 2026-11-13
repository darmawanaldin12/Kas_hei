'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import Memuat from '../../components/Memuat';
import { sb, lb, rp } from '../../lib/supabase';
import { fotoUrl } from '../../lib/foto';

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

function Detail({ x, onClose }) {
  const [foto, setFoto] = useState(null);

  useEffect(() => {
    if (!x) return;
    if (!x.bukti_path) { setFoto({ s: 'tanpa' }); return; }
    setFoto({ s: 'muat' });
    fotoUrl(x.bukti_path).then((url) => {
      setFoto({ s: url ? 'ok' : 'gagal', url });
    });
  }, [x]);

  if (!x) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,43,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', margin: 0 }}>
        <b style={{ display: 'block', fontSize: 18 }}>{x.nama || '-'}</b>
        <small>Iuran {lb(x.bulan)} {x.bulan.slice(0, 4)}</small>
        <div style={{ marginTop: 8 }}>
          {x.status === 'lunas' ? <span className="tag g">Lunas ✓</span>
            : x.status === 'ditolak' ? <span className="tag" style={{ background: '#E5484D', color: '#fff' }}>Ditolak !</span>
            : <span className="tag" style={{ background: '#FDE068' }}>Menunggu verifikasi …</span>}
        </div>
        <div style={{ marginTop: 10 }}><small>Nominal</small><b style={{ display: 'block' }}>{rp(x.nominal)}{x.metode ? ' · ' + x.metode : ''}</b></div>
        {x.dikirim_at && <div style={{ marginTop: 10 }}><small>Dikirim</small><b style={{ display: 'block' }}>{tgl(x.dikirim_at)}</b></div>}
        {x.diverifikasi_at && <div style={{ marginTop: 10 }}><small>{x.status === 'ditolak' ? 'Ditolak' : 'Disetujui'}</small><b style={{ display: 'block' }}>{tgl(x.diverifikasi_at)}</b></div>}
        {x.catatan && <div style={{ marginTop: 10 }}><small>{x.status === 'ditolak' ? 'Alasan penolakan' : 'Catatan'}</small><b style={{ display: 'block' }}>{x.catatan}</b></div>}
        <div style={{ marginTop: 12 }}>
          <small>Foto bukti</small>
          {!foto || foto.s === 'muat' ? <Memuat kecil />
            : foto.s === 'ok' ? <img src={foto.url} alt="Bukti" style={{ width: '100%', borderRadius: 12, marginTop: 6 }} />
            : foto.s === 'tanpa' ? <p className="mut">Tidak ada foto.</p>
            : <p className="mut">Foto tidak bisa dimuat.</p>}
        </div>
        <button className="btn y s" style={{ marginTop: 14 }} onClick={onClose}>Tutup</button>
      </div>
    </div>
  );
}

function Notifikasi({ me }) {
  const [items, setItems] = useState(null);
  const [dibacaAt, setDibacaAt] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    setDibacaAt(v ? new Date(v) : null);
  }, []);

  useEffect(() => {
    if (!me) return;
    (async () => {
      let notifs = [];

      if (me.role === 'anggota') {
        const { data } = await sb
          .from('iuran')
          .select('id,bulan,status,catatan,diverifikasi_at,dikirim_at,nominal,metode,bukti_path')
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
                : `Iuran ${lb(x.bulan)} lunas`,
            sub:
              x.status === 'ditolak'
                ? x.catatan
                  ? 'Alasan: ' + x.catatan
                  : 'Silakan kirim ulang bukti'
                : rp(x.nominal) + ' tercatat masuk kas',
            waktu: x.diverifikasi_at,
            detail: { ...x, nama: me.nama },
          });
        });
      } else {
        const { data } = await sb
          .from('iuran')
          .select('id,bulan,status,catatan,diverifikasi_at,dikirim_at,nominal,metode,bukti_path,anggota_id')
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
                : `Iuran ${lb(x.bulan)} lunas`,
            sub:
              x.status === 'ditolak'
                ? x.catatan
                  ? 'Alasan: ' + x.catatan
                  : 'Silakan kirim ulang bukti'
                : rp(x.nominal) + ' tercatat masuk kas',
            waktu: x.diverifikasi_at,
            detail: { ...x, nama: me.nama },
          });
        });

        const { data: tunggu } = await sb
          .from('iuran')
          .select('id,bulan,anggota_id,dikirim_at,nominal,metode,bukti_path,status')
          .eq('status', 'menunggu_verifikasi')
          .order('dikirim_at', { ascending: false })
          .limit(20);

        const ids = [...new Set((tunggu || []).map((x) => x.anggota_id))];
        const namaMap = {};
        if (ids.length) {
          const { data: pp } = await sb.from('profiles').select('id,nama').in('id', ids);
          (pp || []).forEach((p) => { namaMap[p.id] = p.nama; });
        }

        (tunggu || []).forEach((x) => {
          notifs.push({
            id: 'w-' + x.id,
            tipe: 'tunggu',
            judul: `Bukti dari ${namaMap[x.anggota_id] || '?'}`,
            sub: `Iuran ${lb(x.bulan)} · ${rp(x.nominal)} — menunggu verifikasi`,
            waktu: x.dikirim_at,
            detail: { ...x, nama: namaMap[x.anggota_id] || '?' },
          });
        });

        const batas = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: baru } = await sb
          .from('iuran')
          .select('id,bulan,anggota_id,diverifikasi_at,dikirim_at,nominal,metode,bukti_path,status')
          .eq('status', 'lunas')
          .gte('diverifikasi_at', batas)
          .order('diverifikasi_at', { ascending: false })
          .limit(20);

        const ids2 = [...new Set((baru || []).map((x) => x.anggota_id))];
        const namaMap2 = {};
        if (ids2.length) {
          const { data: pp2 } = await sb.from('profiles').select('id,nama').in('id', ids2);
          (pp2 || []).forEach((p) => { namaMap2[p.id] = p.nama; });
        }

        (baru || []).forEach((x) => {
          notifs.push({
            id: 'l-' + x.id,
            tipe: 'lunas',
            judul: `${namaMap2[x.anggota_id] || '?'} lunas ${lb(x.bulan)}`,
            sub: rp(x.nominal) + ' masuk kas',
            waktu: x.diverifikasi_at,
            detail: { ...x, nama: namaMap2[x.anggota_id] || '?' },
          });
        });
      }

      notifs.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));
      setItems(notifs);

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
        <p className="mut">Belum ada notifikasi.</p>
      </div>
    );

  return (
    <>
      <small style={{ display: 'block', marginBottom: 12 }}>
        {items.length} notifikasi · ketuk untuk lihat detail
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
            role="button"
            tabIndex={0}
            onClick={() => setDetail(x.detail)}
            onKeyDown={(e) => { if (e.key === 'Enter') setDetail(x.detail); }}
            style={{
              background: bg,
              position: 'relative',
              cursor: 'pointer',
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
              <span className="av s" style={{ background: '#fff', boxShadow: '2px 2px 0 var(--ink)' }}>
                {ikon}
              </span>
              <div style={{ flex: 1 }}>
                <b style={{ display: 'block', fontSize: 15 }}>{x.judul}</b>
                {x.sub && (
                  <small style={{ display: 'block', marginTop: 2, fontWeight: 600 }}>
                    {x.sub}
                  </small>
                )}
                <small style={{ display: 'block', marginTop: 6, opacity: 0.7, fontWeight: 700 }}>
                  {waktuRelatif(x.waktu)} · {tgl(x.waktu)}
                </small>
              </div>
            </div>
          </div>
        );
      })}

      <Detail x={detail} onClose={() => setDetail(null)} />
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
