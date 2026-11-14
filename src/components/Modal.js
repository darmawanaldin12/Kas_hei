'use client';
import { Dialog } from 'radix-ui';

// Modal bersama. Radix mengurus fokus, Esc, scroll lock, dan pembacaan layar;
// tampilan tetap memakai kelas CSS yang sudah ada.
export default function Modal({ judul, onTutup, children, lebar = 420 }) {
  return (
    <Dialog.Root open onOpenChange={(o) => { if (!o) onTutup(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-latar" />
        <Dialog.Content
          className="card modal-isi"
          style={{ maxWidth: lebar }}
          aria-describedby={undefined}
        >
          <Dialog.Title className="modal-judul">{judul}</Dialog.Title>
          <Dialog.Close asChild>
            <button className="modal-x" aria-label="Tutup dialog">&times;</button>
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
