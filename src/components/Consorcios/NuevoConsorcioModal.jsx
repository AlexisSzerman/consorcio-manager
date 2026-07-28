import { useState } from 'react';

export default function NuevoConsorcioModal({ onCrear, onClose }) {
  const [nombre, setNombre] = useState('');
  const [creando, setCreando] = useState(false);

  async function handleCrear() {
    if (!nombre.trim()) return;
    setCreando(true);
    try {
      await onCrear(nombre.trim());
      onClose();
    } catch (err) {
      alert('Error al crear el consorcio: ' + err.message);
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-slate-900 text-lg">Nuevo Consorcio</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Nombre del Consorcio</label>
          <input
            type="text"
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCrear()}
            placeholder="Ej: Camarones"
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            onClick={handleCrear}
            disabled={!nombre.trim() || creando}
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
          >
            {creando ? 'Creando...' : 'Crear consorcio'}
          </button>
        </div>
      </div>
    </div>
  );
}
