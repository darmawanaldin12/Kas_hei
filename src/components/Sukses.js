'use client';

const CSS = `
.sk{position:fixed;inset:0;z-index:100;background:var(--bg);overflow-y:auto;display:flex;justify-content:center;padding:32px 20px;animation:sk-in .25s ease-out}
.sk-in{width:100%;max-width:400px;margin:auto;text-align:center}
.sk-ic{position:relative;width:104px;height:104px;margin:0 auto 24px}
.sk-c{width:104px;height:104px;border-radius:50%;border:4px solid var(--ink);box-shadow:6px 6px 0 var(--ink);display:flex;align-items:center;justify-content:center;animation:sk-pop .55s cubic-bezier(.2,1.6,.4,1) both}
.sk-c svg{width:56px;height:56px}
.sk-c path{stroke-dasharray:48;stroke-dashoffset:48;animation:sk-draw .4s .35s ease-out forwards}
.sk-d{position:absolute;width:16px;height:16px;border:3px solid var(--ink);border-radius:5px;animation:sk-pop .5s cubic-bezier(.2,1.6,.4,1) both}
.sk h2{font-size:34px;font-weight:800;letter-spacing:-1px;line-height:1;margin:0 0 8px}
.sk-sub{font-weight:700;font-size:14px;margin:0 0 22px}
.sk-t{background:var(--surface);border:3px solid var(--ink);border-radius:20px;box-shadow:5px 5px 0 var(--ink);padding:4px 16px;text-align:left;margin-bottom:22px;animation:sk-up .4s .2s ease-out both}
.sk-r{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:11px 0;border-bottom:2px dashed var(--ink)}
.sk-r:last-child{border-bottom:0}
.sk-r small{flex:none}
.sk-r b{text-align:right;font-weight:800;font-size:15px}
.sk-r.sk-big b{font-size:22px}
.sk-w{font-size:12px;font-weight:700;margin:-8px 0 20px}
.sk .btn{margin-bottom:12px}
@keyframes sk-in{from{opacity:0}to{opacity:1}}
@keyframes sk-pop{from{transform:scale(0)}to{transform:scale(1)}}
@keyframes sk-draw{to{stroke-dashoffset:0}}
@keyframes sk-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.sk,.sk-c,.sk-d,.sk-t{animation:none}.sk-c path{animation:none;stroke-dashoffset:0}}
`;

const tglWib = () => new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) + ' WIB';

// Layar notifikasi sukses / ditolak (satu layar penuh).
// props: judul, sub, rincian [[label, nilai, besar?]], tombol [{teks, klik, kelas}], tipe 'ok' | 'tolak'
export default function Sukses({ judul, sub, rincian = [], tombol = [], tipe = 'ok' }) {
  const ok = tipe === 'ok';
  return (
    <div className="sk" role="dialog" aria-modal="true" aria-label={judul}>
      <style>{CSS}</style>
      <div className="sk-in">
        <div className="sk-ic">
          <span className="sk-d" style={{ top: -8, right: -14, background: 'var(--warning)', animationDelay: '.45s' }} />
          <span className="sk-d" style={{ bottom: 6, left: -18, background: 'var(--peach)', animationDelay: '.55s' }} />
          <span className="sk-d" style={{ top: 18, left: -22, background: 'var(--info)', animationDelay: '.65s', width: 12, height: 12 }} />
          <span className="sk-d" style={{ bottom: -6, right: -8, background: 'var(--surface)', animationDelay: '.6s', width: 12, height: 12 }} />
          <div className="sk-c" style={{ background: ok ? 'var(--success)' : 'var(--peach)' }}>
            <svg viewBox="0 0 56 56" fill="none" stroke="var(--ink)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {ok ? <path d="M12 29l11 11 21-23" /> : <><path d="M16 16l24 24" /><path d="M40 16L16 40" /></>}
            </svg>
          </div>
        </div>
        <h2>{judul}</h2>
        {sub && <p className="sk-sub">{sub}</p>}
        {rincian.length > 0 && (
          <div className="sk-t">
            {rincian.filter((x) => x[1]).map(([k, v, besar]) => (
              <div className={'sk-r' + (besar ? ' sk-big' : '')} key={k}><small>{k}</small><b>{v}</b></div>
            ))}
            <div className="sk-r"><small>Waktu</small><b>{tglWib()}</b></div>
          </div>
        )}
        {tombol.map((t) => (
          <button key={t.teks} className={'btn ' + (t.kelas || '')} onClick={t.klik}>{t.teks}</button>
        ))}
      </div>
    </div>
  );
}
