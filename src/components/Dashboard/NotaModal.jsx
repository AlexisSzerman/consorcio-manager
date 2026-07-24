import { useState, useEffect } from 'react';

export default function NotaModal({ movimiento, onClose, onGuardar }) {
  const [texto, setTexto] = useState(movimiento.notas || '');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setTexto(movimiento.notas || '');
  }, [movimiento]);

  async function handleGuardar() {
    setGuardando(true);
    try {
      await onGuardar(movimiento.id, texto.trim());
      onClose();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Nota / Aclaración</h3>
            <p className="text-xs text-slate-400">{movimiento.item_nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <textarea
          autoFocus
          rows={5}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ej: Reclamar comprobante antes de autorizar el pago..."
          className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar nota'}
          </button>
        </div>
      </div>
    </div>
  );
}
