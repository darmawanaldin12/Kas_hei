'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '../components/Shell';
import Memuat from '../components/Memuat';
import { sb, rp, ym, lb, addM } from '../lib/supabase';

function Home({ me }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    (async () => {
      const b = ym();
      const [s, p, l, t, my, trans] = await Promise.all([
        sb.from('kas_saldo').select('*').single(),
        sb.from('profiles').select('id', { count: 'exact', head: true }).eq('aktif', true),
        sb.from('iuran').select('id,nominal', { count: 'exact' }).eq('bulan', b).eq('status', 'lunas'),
        sb.from('tunggakan').select('anggota_id,nama').eq('bulan', b),
        sb.from('iuran').select('id,bulan,status,catatan,diverifikasi_at,nominal').eq('anggota_id', me.id).in('status', ['ditolak', 'lunas']).order('diverifikasi_at', { ascending: false }).limit(3),
        sb.from('kas_transaksi').select('jenis,jumlah').order('tanggal', { ascending: false }).limit(6),
      ]);
      
      const lunasCount = l.count || 0;
      const totalLunas = (l.data || []).reduce((a, x) => a + Number(x.nominal || 0), 0);
      const tunggakanData = t.data || [];
      const tunggakanNominal = tunggakanData.length * (tunggakanData[0]?.nominal || 20000); // estimasi

      setD({ 
        s: s.data || {}, 
        n: p.count || 0, 
        l: lunasCount, 
        t: tunggakanData, 
        my: my.data || [],
        trans: trans.data || [],
        totalLunas,
        tunggakanNominal
      });
    })();
  }, []);

  if (!d) return <Memuat />;
  const pct = d.n ? Math.round((d.l / d.n) * 100) : 0;
  const belumBayar = d.t.find(x => x.anggota_id === me.id);

  return (
    <>
      <div className="hero-salam" style={{marginBottom: 12}}>
        <h2 style={{fontSize: 20, fontWeight: 800}}>Halo, {me.nama.split(' ')[0]}</h2>
        <small style={{color: '#444'}}>Periode {lb(ym())} {ym().slice(0,4)}</small>
      </div>

      <div className="card hero">
        <small>Total Saldo Kas</small>
        <div className="big">{rp(d.s.saldo)}</div>
        <div className="two">
          <div className="card w"><small>Kas Masuk</small><b className="plus">+{rp(d.s.total_masuk)}</b></div>
          <div className="card w"><small>Kas Keluar</small><b className="minus">-{rp(d.s.total_keluar)}</b></div>
        </div>
      </div>

      {me.role === 'bendahara' && (
        <a className="tugas" href="/verifikasi" style={{display:'flex', alignItems:'center', gap:10, border:'3px solid var(--ink)', borderRadius:18, boxShadow:'4px 4px 0 var(--ink)', padding:'12px 14px', marginBottom:14, textDecoration:'none', color:'var(--ink)', background:'#fff'}}>
          <div style={{flex:1}}><b>Bukti menunggu verifikasi</b><small>Periksa bukti yang masuk</small></div>
          <span className="pipa" style={{fontSize:12, fontWeight:800, border:'3px solid var(--ink)', borderRadius:999, padding:'6px 12px', background:'#fff'}}>Periksa</span>
        </a>
      )}

      {belumBayar && (
        <a className="tugas" href="/bukti" style={{display:'flex', alignItems:'center', gap:10, border:'3px solid var(--ink)', borderRadius:18, boxShadow:'4px 4px 0 var(--ink)', padding:'12px 14px', marginBottom:14, textDecoration:'none', color:'var(--ink)', background:'var(--sun)'}}>
          <div style={{flex:1}}><b>Kamu belum bayar {lb(ym())}</b><small>Iuran Rp 20.000</small></div>
          <span className="pipa" style={{fontSize:12, fontWeight:800, border:'3px solid var(--ink)', borderRadius:999, padding:'6px 12px', background:'#fff'}}>Bayar</span>
        </a>
      )}

      <div className="mini-stats" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14}}>
        <div className="stat-box" style={{border:'3px solid var(--ink)', borderRadius:16, background:'#fff', padding:10, textAlign:'center', boxShadow:'3px 3px 0 var(--ink)'}}><small>Anggota</small><b>{d.n}</b></div>
        <div className="stat-box" style={{border:'3px solid var(--ink)', borderRadius:16, background:'#E8F8F0', padding:10, textAlign:'center', boxShadow:'3px 3px 0 var(--ink)'}}><small>Lunas</small><b style={{color:'#0a6b32'}}>{d.l}</b></div>
        <div className="stat-box" style={{border:'3px solid var(--ink)', borderRadius:16, background:'#FFF0F0', padding:10, textAlign:'center', boxShadow:'3px 3px 0 var(--ink)'}}><small>Tunggakan</small><b style={{color:'#b3123f'}}>{rp(d.tunggakanNominal)}</b></div>
      </div>

      <div className="card">
        <div className="spread"><small>Target Iuran {lb(ym())}</small><b>{d.l} / {d.n} Lunas ({pct}%)</b></div>
        <div className="bar"><i style={{ width: pct + '%' }} /></div>
      </div>

      <small className="h">{me.role === 'anggota' ? 'Riwayat Pribadi' : 'Belum Bayar (' + d.t.length + ')'}</small>
      {me.role === 'anggota' ? d.my.map(x => (
        <div className="card row" key={x.id} style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
          <span className={'av s ' + (x.status === 'lunas' ? 'g' : 'pink')} style={{background: x.status === 'lunas' ? 'var(--mint)' : 'var(--peach)'}}>{x.status === 'lunas' ? '✓' : '!'}</span>
          <div style={{flex:1}}><b>Iuran {lb(x.bulan)}</b><small>{x.status === 'lunas' ? 'Disetujui' : 'Ditolak: ' + x.catatan}</small></div>
          <b>{rp(x.nominal)}</b>
        </div>
      )) : d.t.map((x) => (
        <div className="card row" key={x.anggota_id} style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
          <span className="av s">{x.nama[0]}</span><b style={{flex:1}}>{x.nama}</b>
          <Link className="btn pink s" href="/catat">Catat</Link>
        </div>
      ))}
    </>
  );
}

export default function Page() {
  return <Shell title="Kas Kantor">{(me) => <Home me={me} />}</Shell>;
}
