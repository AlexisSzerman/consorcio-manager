import { useState } from 'react';

function UnidadItem({ unidad, onGuardar, onEliminar }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    numero_unidad: unidad.numero_unidad,
    propietario_nombre: unidad.propietario_nombre,
    alias_reconocimiento: unidad.alias_reconocimiento || '',
  });
  const [guardando, setGuardando] = useState(false);

  function iniciarEdicion() {
    setForm({
      numero_unidad: unidad.numero_unidad,
      propietario_nombre: unidad.propietario_nombre,
      alias_reconocimiento: unidad.alias_reconocimiento || '',
    });
    setEditando(true);
  }

  async function guardar() {
    if (!form.numero_unidad.trim() || !form.propietario_nombre.trim()) return;
    setGuardando(true);
    try {
      await onGuardar(unidad.id, form);
      setEditando(false);
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (editando) {
    return (
      <div className="bg-white rounded-lg border border-indigo-200 p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={form.numero_unidad}
            onChange={(e) => setForm({ ...form, numero_unidad: e.target.value })}
            placeholder="Unidad (ej: 4B)"
            className="border rounded-lg p-2 text-sm"
          />
          <input
            type="text"
            value={form.propietario_nombre}
            onChange={(e) => setForm({ ...form, propietario_nombre: e.target.value })}
            placeholder="Propietario"
            className="border rounded-lg p-2 text-sm"
          />
        </div>
        <input
          type="text"
          value={form.alias_reconocimiento}
          onChange={(e) => setForm({ ...form, alias_reconocimiento: e.target.value })}
          placeholder="Alias para reconocer (variantes del nombre, separadas por ; — ej: SALGADO,MARIA ALEJANDR;SALGADO MARIA ALEJANDRA)"
          className="w-full border rounded-lg p-2 text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setEditando(false)}
            className="text-xs px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center bg-white rounded-lg border border-slate-200 px-3 py-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">
          {unidad.numero_unidad} <span className="text-slate-400 font-normal">·</span> {unidad.propietario_nombre}
        </p>
        {unidad.alias_reconocimiento && (
          <p className="text-xs text-indigo-600">{unidad.alias_reconocimiento}</p>
        )}
      </div>
      <div className="flex gap-1">
        <button onClick={iniciarEdicion} className="text-slate-500 hover:text-slate-700 text-xs px-2 py-1">
          <i className="fa-solid fa-pen"></i>
        </button>
        <button onClick={onEliminar} className="text-red-500 hover:text-red-700 text-xs px-2 py-1">
          <i className="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  );
}

function NuevaUnidadForm({ onAgregar }) {
  const [numeroUnidad, setNumeroUnidad] = useState('');
  const [propietario, setPropietario] = useState('');
  const [alias, setAlias] = useState('');
  const [agregando, setAgregando] = useState(false);

  async function agregar() {
    if (!numeroUnidad.trim() || !propietario.trim()) return;
    setAgregando(true);
    try {
      await onAgregar(numeroUnidad.trim(), propietario.trim(), alias.trim());
      setNumeroUnidad('');
      setPropietario('');
      setAlias('');
    } catch (err) {
      alert('Error al agregar: ' + err.message);
    } finally {
      setAgregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={numeroUnidad}
          onChange={(e) => setNumeroUnidad(e.target.value)}
          placeholder="Unidad (ej: 4B)"
          className="border rounded-lg p-2 text-sm"
        />
        <input
          type="text"
          value={propietario}
          onChange={(e) => setPropietario(e.target.value)}
          placeholder="Propietario"
          className="border rounded-lg p-2 text-sm"
        />
      </div>
      <input
        type="text"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        placeholder="Alias para reconocer (variantes del nombre, separadas por ; — ej: SALGADO,MARIA ALEJANDR;SALGADO MARIA ALEJANDRA)"
        className="w-full border rounded-lg p-2 text-sm"
      />
      <button
        onClick={agregar}
        disabled={!numeroUnidad.trim() || !propietario.trim() || agregando}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40"
      >
        <i className="fa-solid fa-plus mr-1"></i> Agregar unidad
      </button>
    </div>
  );
}

export default function UnidadesSection({ consorcio, onAddUnidad, onUpdateUnidad, onDeleteUnidad }) {
  async function eliminar(unidadId) {
    if (!confirm('¿Eliminar esta unidad?')) return;
    try {
      await onDeleteUnidad(consorcio.id, unidadId);
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  }

  return (
    <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
      <h4 className="font-bold text-sm text-slate-700">
        <i className="fa-solid fa-door-closed mr-1"></i> Unidades / Propietarios
      </h4>
      <p className="text-[11px] text-slate-400 -mt-2">
        Se usa para reconocer automáticamente los pagos de expensas en el Libro Diario. El alias
        sirve para tolerar variantes del nombre (mayúsculas, apellido primero, letras faltantes
        que a veces manda el banco).
      </p>

      <NuevaUnidadForm
        onAgregar={(numero, propietario, alias) => onAddUnidad(consorcio.id, numero, propietario, alias)}
      />

      <div className="space-y-2">
        {consorcio.unidades.length === 0 && (
          <p className="text-xs text-slate-400 italic">Todavía no hay unidades cargadas.</p>
        )}
        {consorcio.unidades.map((unidad) => (
          <UnidadItem
            key={unidad.id}
            unidad={unidad}
            onGuardar={(unidadId, campos) => onUpdateUnidad(consorcio.id, unidadId, campos)}
            onEliminar={() => eliminar(unidad.id)}
          />
        ))}
      </div>
    </div>
  );
}