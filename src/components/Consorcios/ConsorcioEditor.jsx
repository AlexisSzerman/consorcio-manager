import { useState, useEffect } from 'react';

function SelectorNuevaCuenta({ catalogo, placeholder, onAgregar }) {
  const [itemId, setItemId] = useState('');
  const [alias, setAlias] = useState('');
  const [agregando, setAgregando] = useState(false);

  async function agregar() {
    if (!itemId) return;
    setAgregando(true);
    try {
      await onAgregar(itemId, alias.trim());
      setItemId('');
      setAlias('');
    } catch (err) {
      alert('Error al agregar: ' + err.message);
    } finally {
      setAgregando(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <select
        value={itemId}
        onChange={(e) => setItemId(e.target.value)}
        className="flex-1 border rounded-lg p-2 text-sm bg-white"
      >
        <option value="">Elegir del catálogo...</option>
        {catalogo.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nombre}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        placeholder={placeholder}
        className="flex-1 border rounded-lg p-2 text-sm"
      />
      <button
        onClick={agregar}
        disabled={!itemId || agregando}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40 whitespace-nowrap"
      >
        <i className="fa-solid fa-plus mr-1"></i> Agregar cuenta
      </button>
    </div>
  );
}

function CuentaRow({ cuenta, subtitulo, onEliminar }) {
  return (
    <div className="flex justify-between items-center bg-white rounded-lg border border-slate-200 px-3 py-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">{cuenta.nombre}</p>
        {cuenta.alias ? (
          <p className="text-xs text-indigo-600">{cuenta.alias}</p>
        ) : (
          <p className="text-xs text-slate-400">{subtitulo}</p>
        )}
      </div>
      <button onClick={onEliminar} className="text-red-500 hover:text-red-700 text-xs px-2 py-1">
        <i className="fa-solid fa-trash"></i>
      </button>
    </div>
  );
}

export default function ConsorcioEditor({
  consorcio,
  servicios,
  proveedores,
  onGuardar,
  onAddCuentaServicio,
  onDeleteCuentaServicio,
  onAddCuentaProveedor,
  onDeleteCuentaProveedor,
}) {
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
          {/* SERVICIOS */}
          <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
            <h4 className="font-bold text-sm text-slate-700">
              <i className="fa-solid fa-bolt mr-1"></i> Cuentas de Servicios
            </h4>
            <p className="text-[11px] text-slate-400 -mt-2">
              Podés agregar más de una cuenta del mismo servicio (ej: dos cuentas de AySA) usando un alias para distinguirlas.
            </p>

            <SelectorNuevaCuenta
              catalogo={servicios}
              placeholder="Alias (ej: Cliente 321321)"
              onAgregar={(servicioId, alias) => onAddCuentaServicio(consorcio.id, servicioId, alias)}
            />

            <div className="space-y-2">
              {consorcio.serviciosCuentas.length === 0 && (
                <p className="text-xs text-slate-400 italic">Todavía no hay cuentas de servicio cargadas.</p>
              )}
              {consorcio.serviciosCuentas.map((cuenta) => (
                <CuentaRow
                  key={cuenta.id}
                  cuenta={cuenta}
                  subtitulo="Sin alias"
                  onEliminar={() => onDeleteCuentaServicio(consorcio.id, cuenta.id)}
                />
              ))}
            </div>
          </div>

          {/* PROVEEDORES */}
          <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
            <h4 className="font-bold text-sm text-slate-700">
              <i className="fa-solid fa-truck-field mr-1"></i> Cuentas / Trabajos de Proveedores
            </h4>
            <p className="text-[11px] text-slate-400 -mt-2">
              Podés agregar más de un trabajo con el mismo proveedor (ej: dos facturas distintas) usando un alias.
            </p>

            <SelectorNuevaCuenta
              catalogo={proveedores}
              placeholder="Alias (ej: Reparación ascensor 3)"
              onAgregar={(proveedorId, alias) => onAddCuentaProveedor(consorcio.id, proveedorId, alias)}
            />

            <div className="space-y-2">
              {consorcio.proveedoresCuentas.length === 0 && (
                <p className="text-xs text-slate-400 italic">Todavía no hay cuentas de proveedor cargadas.</p>
              )}
              {consorcio.proveedoresCuentas.map((cuenta) => (
                <CuentaRow
                  key={cuenta.id}
                  cuenta={cuenta}
                  subtitulo="Sin alias"
                  onEliminar={() => onDeleteCuentaProveedor(consorcio.id, cuenta.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
