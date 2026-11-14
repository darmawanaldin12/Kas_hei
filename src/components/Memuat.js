'use client';

const CSS = `
.mm{display:flex;flex-direction:column;align-items:center;gap:16px;padding:48px 0}
.mm-s{gap:10px;padding:14px 0}
.mm-row{display:flex;gap:12px;height:44px;align-items:flex-end}
.mm-s .mm-row{height:34px}
.mm-sq{display:block;width:22px;height:22px;border:3px solid var(--ink);border-radius:6px;box-shadow:3px 3px 0 var(--ink);animation:mm-jp .9s infinite ease-in-out}
.mm-sq:nth-child(2){animation-delay:.15s}
.mm-sq:nth-child(3){animation-delay:.3s}
.mm-tx{margin:0;color:var(--ink);font-weight:700;font-size:15px}
.mm-tx span{display:inline-block;animation:mm-bl 1.2s infinite}
.mm-tx span:nth-child(2){animation-delay:.2s}
.mm-tx span:nth-child(3){animation-delay:.4s}
@keyframes mm-jp{0%,100%{transform:translateY(0)}40%{transform:translateY(-18px)}}
@keyframes mm-bl{0%,60%,100%{opacity:.2}30%{opacity:1}}
@media (prefers-reduced-motion:reduce){.mm-sq,.mm-tx span{animation:none}.mm-tx span{opacity:1}}
`;

export default function Memuat({ kecil = false }) {
  return (
    <div className={'mm' + (kecil ? ' mm-s' : '')} role="status" aria-live="polite">
      <style>{CSS}</style>
      <div className="mm-row">
        <span className="mm-sq" style={{ background: 'var(--warning)' }} />
        <span className="mm-sq" style={{ background: 'var(--peach)' }} />
        <span className="mm-sq" style={{ background: 'var(--success)' }} />
      </div>
      <p className="mm-tx">Memuat<span>.</span><span>.</span><span>.</span></p>
    </div>
  );
}
