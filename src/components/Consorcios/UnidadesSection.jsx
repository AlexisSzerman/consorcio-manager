import { useState } from 'react';
import * as XLSX from 'xlsx';

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

// ---------- Importación desde Excel ----------

// Intenta mapear encabezados variados a los 3 campos que necesitamos.
function detectarColumnas(headerRow) {
  const norm = (s) =>
    String(s || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // saca acentos

  const idx = { unidad: -1, propietario: -1, alias: -1 };

  headerRow.forEach((cell, i) => {
    const c = norm(cell);
    if (idx.unidad === -1 && /(unidad|depto|departamento|piso)/.test(c)) idx.unidad = i;
    if (idx.propietario === -1 && /(propietari|nombre|titular|dueñ|dueno)/.test(c)) idx.propietario = i;
    if (idx.alias === -1 && /(alias|variante|reconocimiento)/.test(c)) idx.alias = i;
  });

  return idx;
}

function ImportarExcelUnidades({ consorcio, onAddUnidad }) {
  const [archivo, setArchivo] = useState(null);
  const [filas, setFilas] = useState([]); // [{numero_unidad, propietario_nombre, alias_reconocimiento, duplicada, incluir}]
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null); // {ok, error}
  const [error, setError] = useState('');

  const numerosExistentes = new Set(
    consorcio.unidades.map((u) => u.numero_unidad.trim().toLowerCase())
  );

  function resetear() {
    setArchivo(null);
    setFilas([]);
    setResultado(null);
    setError('');
  }

  async function manejarArchivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setResultado(null);
    setArchivo(file);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (rows.length === 0) {
        setError('El archivo está vacío.');
        return;
      }

      const cols = detectarColumnas(rows[0]);
      if (cols.unidad === -1 || cols.propietario === -1) {
        setError(
          'No pude identificar las columnas de "Unidad" y "Propietario" en la primera fila. Revisá que el Excel tenga encabezados como "Unidad" y "Propietario".'
        );
        return;
      }

      const dataRows = rows.slice(1).filter((r) => r.some((c) => String(c).trim() !== ''));

      const parseadas = dataRows.map((r) => {
        const numero_unidad = String(r[cols.unidad] ?? '').trim();
        const propietario_nombre = String(r[cols.propietario] ?? '').trim();
        const alias_reconocimiento = cols.alias !== -1 ? String(r[cols.alias] ?? '').trim() : '';
        return {
          numero_unidad,
          propietario_nombre,
          alias_reconocimiento,
          duplicada: numero_unidad && numerosExistentes.has(numero_unidad.toLowerCase()),
          incluir: !!(numero_unidad && propietario_nombre),
        };
      });

      setFilas(parseadas);
    } catch (err) {
      setError('No pude leer el archivo: ' + err.message);
    }
  }

  function actualizarFila(i, campo, valor) {
    setFilas((prev) =>
      prev.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f))
    );
  }

  function quitarFila(i) {
    setFilas((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function confirmarImportacion() {
    const aImportar = filas.filter((f) => f.incluir && f.numero_unidad.trim() && f.propietario_nombre.trim());
    if (aImportar.length === 0) return;

    setProcesando(true);
    let ok = 0;
    const errores = [];

    // Secuencial para evitar condiciones de carrera / duplicados al insertar de a una.
    for (const f of aImportar) {
      try {
        await onAddUnidad(consorcio.id, f.numero_unidad.trim(), f.propietario_nombre.trim(), f.alias_reconocimiento.trim());
        ok++;
      } catch (err) {
        errores.push(`${f.numero_unidad} (${f.propietario_nombre}): ${err.message}`);
      }
    }

    setProcesando(false);
    setResultado({ ok, errores });
    if (errores.length === 0) {
      resetear();
      setResultado({ ok, errores: [] });
    } else {
      setFilas([]);
    }
  }

  const incluidas = filas.filter((f) => f.incluir).length;
  const duplicadas = filas.filter((f) => f.duplicada).length;

  return (
    <div className="bg-indigo-50/50 border border-indigo-200 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold text-indigo-800">
          <i className="fa-solid fa-file-excel mr-1"></i> Importar unidades desde Excel
        </h5>
        {(archivo || filas.length > 0 || resultado) && (
          <button onClick={resetear} className="text-[11px] text-slate-500 hover:text-slate-700">
            Empezar de nuevo
          </button>
        )}
      </div>

      {!archivo && !resultado && (
        <div className="space-y-1">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={manejarArchivo}
            className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white file:text-xs hover:file:bg-indigo-700"
          />
          <p className="text-[11px] text-slate-400">
            El archivo debe tener columnas con encabezados como "Unidad", "Propietario" y, opcionalmente, "Alias".
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          <i className="fa-solid fa-triangle-exclamation mr-1"></i> {error}
        </p>
      )}

      {filas.length > 0 && (
        <>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>{filas.length} filas detectadas · {incluidas} se van a importar</span>
            {duplicadas > 0 && (
              <span className="text-amber-600 font-medium">
                <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                {duplicadas} coinciden con unidades ya cargadas
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {filas.map((f, i) => (
              <div
                key={i}
                className={`grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-1.5 items-center bg-white rounded-md border p-1.5 ${
                  f.duplicada ? 'border-amber-300' : 'border-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={f.incluir}
                  onChange={(e) => actualizarFila(i, 'incluir', e.target.checked)}
                  title="Incluir en la importación"
                />
                <input
                  type="text"
                  value={f.numero_unidad}
                  onChange={(e) => actualizarFila(i, 'numero_unidad', e.target.value)}
                  className="border rounded p-1 text-xs"
                  placeholder="Unidad"
                />
                <input
                  type="text"
                  value={f.propietario_nombre}
                  onChange={(e) => actualizarFila(i, 'propietario_nombre', e.target.value)}
                  className="border rounded p-1 text-xs"
                  placeholder="Propietario"
                />
                <input
                  type="text"
                  value={f.alias_reconocimiento}
                  onChange={(e) => actualizarFila(i, 'alias_reconocimiento', e.target.value)}
                  className="border rounded p-1 text-xs"
                  placeholder="Alias"
                />
                <button
                  onClick={() => quitarFila(i)}
                  className="text-red-400 hover:text-red-600 text-xs px-1"
                  title="Quitar esta fila"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={confirmarImportacion}
            disabled={procesando || incluidas === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40"
          >
            {procesando ? 'Importando...' : `Importar ${incluidas} unidad${incluidas === 1 ? '' : 'es'}`}
          </button>
        </>
      )}

      {resultado && (
        <div className="text-xs space-y-1">
          <p className="text-emerald-700 font-medium">
            <i className="fa-solid fa-circle-check mr-1"></i> {resultado.ok} unidad{resultado.ok === 1 ? '' : 'es'} importada{resultado.ok === 1 ? '' : 's'} correctamente.
          </p>
          {resultado.errores.length > 0 && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-md p-2 space-y-0.5">
              <p className="font-medium">{resultado.errores.length} con error:</p>
              {resultado.errores.map((e, i) => (
                <p key={i}>• {e}</p>
              ))}
            </div>
          )}
        </div>
      )}
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

      <ImportarExcelUnidades consorcio={consorcio} onAddUnidad={onAddUnidad} />

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