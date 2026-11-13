'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '../components/Shell';
import Memuat from '../components/Memuat';
import { sb, rp, ym, lb } from '../lib/supabase';

function Home({ me }) {
  const [d, setD] = useState(null);

  useEffect(() => {
    (async () => {
      const b = ym();
      const [s, p, set, iur, t, my, tunggu] = await Promise.all([
        sb.from('kas_saldo').select('*').single(),
        sb.from('profiles').select('id', { count: 'exact', head: true }).eq('aktif', true),
        sb.from('pengaturan').select('iuran_nominal').single(),
        sb.from('iuran').select('anggota_id,status,nominal').eq('bulan', b),
        sb.from('tunggakan').select('anggota_id,nama').eq('bulan', b),
        sb.from('iuran').select('id,bulan,status,catatan,nominal').eq('anggota_id', me.id)
          .in('status', ['ditolak', 'lunas']).order('diverifikasi_at', { ascending: false }).limit(3),
        sb.from('iuran').select('id', { count: 'exact', head: true }).eq('status', 'menunggu_verifikasi'),
      ]);

      const nom = set.data?.iuran_nominal || 20000;
      const bulanIni = iur.data || [];
      const lunas = bulanIni.filter((x) => x.status === 'lunas');
      const nunggu = bulanIni.filter((x) => x.status === 'menunggu_verifikasi');
      const n = p.count || 0;
      const belum = (t.data || []).length;

      setD({
        s: s.data || {},
        n,
        nom,
        lunas: lunas.length,
        nunggu: nunggu.length,
        belum: belum,
        tunggakan: belum * nom,
        daftar: t.data || [],
        my: my.data || [],
        verifikasi: tunggu.count || 0,
      });
    })();
  }, []);

  if (!d) return <Memuat />;
  const pct = d.n ? Math.round((d.lunas / d.n) * 100) : 0;
  const sayaBelum = d.daftar.some((x) => x.anggota_id === me.id);

  return (
    <>
      <div className="salam">
        <h2>Halo, {me.nama.split(' ')[0]}</h2>
        <small>Periode {lb(ym())} {ym().slice(0, 4)}</small>
      </div>

      <div className="card hero">
        <small>Total Saldo Kas</small>
        <div className="big">{rp(d.s.saldo)}</div>
        <div className="two">
          <div className="card w"><small>Kas Masuk</small><b className="plus">+{rp(d.s.total_masuk)}</b></div>
          <div className="card w"><small>Kas Keluar</small><b className="minus">-{rp(d.s.total_keluar)}</b></div>
        </div>
      </div>

      {me.role === 'bendahara' && d.verifikasi > 0 && (
        <Link className="tugas" href="/verifikasi">
          <div>
            <b>{d.verifikasi} bukti menunggu verifikasi</b>
            <small>Periksa bukti yang baru masuk</small>
          </div>
          <span className="pipa">Periksa</span>
        </Link>
      )}

      {(me.role === 'anggota' || me.role === 'ketua') && sayaBelum && (
        <Link className="tugas y" href="/bukti">
          <div>
            <b>Kamu belum bayar {lb(ym())}</b>
            <small>Iuran {rp(d.nom)} · jatuh tempo bulan ini</small>
          </div>
          <span className="pipa">Bayar</span>
        </Link>
      )}

      <div className="stats">
        <div className="stat"><small>Anggota</small><b>{d.n}</b></div>
        <div className="stat g"><small>Lunas</small><b>{d.lunas}</b></div>
        <div className="stat p"><small>Tunggakan</small><b>{rp(d.tunggakan)}</b></div>
      </div>

      <div className="card">
        <div className="spread">
          <small>Target iuran {lb(ym())}</small>
          <b>{d.lunas} / {d.n} lunas ({pct}%)</b>
        </div>
        <div className="bar"><i style={{ width: pct + '%' }} /></div>
        {d.nunggu > 0 && (
          <small style={{ display: 'block', marginTop: 8 }}>
            {d.nunggu} bukti sedang menunggu verifikasi
          </small>
        )}
      </div>

      {me.role === 'anggota' ? (
        <>
          <small className="h">Riwayat pribadi</small>
          {!d.my.length && <p className="mut">Belum ada riwayat pembayaran.</p>}
          {d.my.map((x) => (
            <div className={'riwayat' + (x.status === 'ditolak' ? ' bad' : '')} key={x.id}>
              <span className="av s" style={{ background: x.status === 'lunas' ? 'var(--mint)' : 'var(--peach)' }}>
                {x.status === 'lunas' ? '✓' : '!'}
              </span>
              <div className="isi">
                <b>Iuran {lb(x.bulan)} {x.bulan.slice(0, 4)}</b>
                <small>{x.status === 'lunas' ? 'Disetujui' : 'Ditolak' + (x.catatan ? ': ' + x.catatan : '')}</small>
              </div>
              <span className="nominal">{rp(x.nominal)}</span>
            </div>
          ))}
        </>
      ) : (
        <>
          <small className="h">Belum bayar ({d.belum})</small>
          {!d.belum && <p className="mut">Semua anggota sudah lunas bulan ini.</p>}
          {d.daftar.map((x) => (
            <div className="card row" key={x.anggota_id}>
              <span className="av s">{x.nama[0]}</span>
              <b>{x.nama}</b>
              <Link className="btn pink s" href="/catat">Catat</Link>
            </div>
          ))}
        </>
      )}
    </>
  );
}

export default function Page() {
  return <Shell title="Kas Kantor">{(me) => <Home me={me} />}</Shell>;
}
