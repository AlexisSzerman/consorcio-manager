import { useState, useEffect } from 'react';

export default function ConsorcioEditor({ consorcio, servicios, proveedores, onGuardar, onToggleAsignacion }) {
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (consorcio) {
      setForm({
        nombre: consorcio.nombre,
        direccion: consorcio.direccion || '',
        banco: consorcio.banco || '',
        notas: consorcio.notas || '',
      });
    }
  }, [consorcio]);

  if (!consorcio || !form) {
    return (
      <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-400 text-center py-10">
          Selecciona un consorcio de la izquierda para ver y editar sus datos.
        </p>
      </div>
    );
  }

  async function handleGuardar() {
    setGuardando(true);
    try {
      await onGuardar(consorcio.id, form);
      alert('Datos del consorcio actualizados correctamente.');
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Editar Consorcio: {consorcio.nombre}</h3>
            <p className="text-xs text-slate-400">Configuración general y notas operativas</p>
          </div>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-lg font-bold disabled:opacity-50"
          >
            <i className="fa-solid fa-floppy-disk mr-1"></i>
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Nombre del Consorcio</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Dirección</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1">Banco / Cta Cte</label>
            <input
              type="text"
              value={form.banco}
              onChange={(e) => setForm({ ...form, banco: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1">
              <i className="fa-regular fa-note-sticky text-amber-500 mr-1"></i> Notas del Consorcio (Encargado, clave portón, particularidades)
            </label>
            <textarea
              rows={3}
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Ej: Encargado Roberto (tel: 11-xxxx). CUIT del consorcio, etc."
              className="w-full border rounded-lg p-2 text-sm bg-amber-50/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="font-bold text-sm text-slate-700 mb-3">
              <i className="fa-solid fa-bolt mr-1"></i> Servicios Habilitados
            </h4>
            <div className="space-y-2">
              {servicios.map((s) => (
                <label key={s.id} className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consorcio.serviciosIds.includes(s.id)}
                    onChange={() => onToggleAsignacion(consorcio.id, 'servicios', s.id)}
                    className="rounded text-indigo-600"
                  />
                  <span>{s.nombre}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="font-bold text-sm text-slate-700 mb-3">
              <i className="fa-solid fa-truck-field mr-1"></i> Proveedores Mensuales
            </h4>
            <div className="space-y-2">
              {proveedores.map((p) => (
                <label key={p.id} className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consorcio.proveedoresIds.includes(p.id)}
                    onChange={() => onToggleAsignacion(consorcio.id, 'proveedores', p.id)}
                    className="rounded text-indigo-600"
                  />
                  <span>{p.nombre}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
