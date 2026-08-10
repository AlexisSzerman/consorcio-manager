import { useState } from 'react';

export default function EditarMovimientoLibroModal({
  movimiento,
  servicios,
  proveedores,
  unidades,
  onGuardar,
  onClose,
}) {
  const [fecha, setFecha] = useState(movimiento.fecha);
  const [detalle, setDetalle] = useState(movimiento.detalle);
  const [tipo, setTipo] = useState(movimiento.tipo);
  const [monto, setMonto] = useState(movimiento.monto);
  const [categoria, setCategoria] = useState(movimiento.categoria);
  const [servicioId, setServicioId] = useState(movimiento.servicio_id || '');
  const [proveedorId, setProveedorId] = useState(movimiento.proveedor_id || '');
  const [unidadId, setUnidadId] = useState(movimiento.unidad_id || '');
  const [textoLibre, setTextoLibre] = useState(
    movimiento.texto_original_banco || ''
  );
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    const montoNum = parseFloat(monto);

    if (!fecha || !detalle.trim() || !montoNum || montoNum <= 0) return;

    setGuardando(true);

    try {
      await onGuardar(movimiento.id, {
        fecha,
        detalle: detalle.trim(),
        tipo,
        monto: montoNum,
        categoria,

        servicio_id:
          categoria === 'servicio' ? servicioId || null : null,

        proveedor_id:
          categoria === 'proveedor' ? proveedorId || null : null,

        unidad_id:
          categoria === 'unidad' ? unidadId || null : null,

        texto_original_banco:
          categoria === 'sin_clasificar'
            ? textoLibre.trim() || null
            : movimiento.texto_original_banco,

        confirmado: true,
      });

      onClose();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
      <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-3 max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-lg font-bold text-slate-800">
        Editar movimiento
      </h2>

      {movimiento.texto_original_banco && (
        <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-2">
          Nombre original del banco:{' '}
          <span className="font-semibold">
            {movimiento.texto_original_banco}
          </span>
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setTipo('ingreso')}
          className={`flex-1 text-sm px-3 py-2 rounded-lg border ${
            tipo === 'ingreso'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-600 border-slate-300'
          }`}
        >
          Ingreso
        </button>

        <button
          onClick={() => setTipo('egreso')}
          className={`flex-1 text-sm px-3 py-2 rounded-lg border ${
            tipo === 'egreso'
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-slate-600 border-slate-300'
          }`}
        >
          Egreso
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Fecha
          </label>

          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Monto
          </label>

          <input
            type="number"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">
          Detalle
        </label>

        <input
          type="text"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          className="w-full border rounded-lg p-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">
          Categoría
        </label>

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full border rounded-lg p-2 text-sm bg-white"
        >
          <option value="sin_clasificar">
            Sin clasificar / otro
          </option>

          <option value="servicio">
            Servicio
          </option>

          <option value="proveedor">
            Proveedor
          </option>

          <option value="unidad">
            Unidad
          </option>

          <option value="gastos_bancarios">
            Gastos Bancarios / Impuestos
          </option>
        </select>
      </div>

      {categoria === 'servicio' && (
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Servicio
          </label>

          <select
            value={servicioId}
            onChange={(e) => setServicioId(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">
              Elegir servicio...
            </option>

            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {categoria === 'proveedor' && (
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Proveedor
          </label>

          <select
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">
              Elegir proveedor...
            </option>

            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {categoria === 'unidad' && (
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Unidad
          </label>

          <select
            value={unidadId}
            onChange={(e) => setUnidadId(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">
              Elegir unidad...
            </option>

            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.numero_unidad} - {u.propietario_nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {categoria === 'sin_clasificar' && (
        <input
          type="text"
          value={textoLibre}
          onChange={(e) => setTextoLibre(e.target.value)}
          placeholder="Texto libre (opcional)"
          className="w-full border rounded-lg p-2 text-sm"
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="text-sm px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>

        <button
          onClick={guardar}
          disabled={
            guardando ||
            !fecha ||
            !detalle.trim() ||
            !monto
          }
          className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
      </div>

  );
}