import { useState } from 'react';
import { PERFILES_BANCO, buscarCandidatos } from '../../utils/importadorBancos';
import { formatMonto, formatFechaDDMMYYYY } from '../../utils/dateHelpers';

export default function ImportarBancoModal({ periodo, movimientosExistentes, proveedores, unidades, onImportar, onClose }) {
  const [filas, setFilas] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);

  const bancoNormalizado = (periodo.banco || '')
  .toString()
  .trim()
  .toUpperCase();

const perfil =
  PERFILES_BANCO[periodo.banco] ||
  PERFILES_BANCO[bancoNormalizado] ||
  PERFILES_BANCO[
    bancoNormalizado.replace(/\s+/g, '_')
  ] ||
  (
    bancoNormalizado.includes('CIUDAD')
      ? PERFILES_BANCO.CIUDAD
      : null
  );

  function handleArchivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
reader.onload = (evt) => {
  try {
    const parseadas = perfil.parser(evt.target.result);

    const enOrdenCronologico = [...parseadas].sort((a, b) => a.orden_original - b.orden_original);
    const marcadas = marcarAnteriorAlSaldoInicial(enOrdenCronologico, periodo.saldo_inicial_declarado);

    const conSugerencias = marcadas.map((m) => {
      let categoria = m.categoriaSugerida;
      let candidatoId = null;
      let candidatos = [];
      if (categoria !== 'gastos_bancarios' && m.texto_original_banco) {
        candidatos = buscarCandidatos(m.texto_original_banco, proveedores, unidades);
        if (candidatos[0] && candidatos[0].score >= 0.7) {
          categoria = candidatos[0].tipo;
          candidatoId = candidatos[0].id;
        }
      }
      const duplicado = movimientosExistentes.some(
        (ex) => ex.fecha === m.fecha && Number(ex.monto) === m.monto && ex.tipo === m.tipo && ex.detalle === m.detalle
      );
      return {
        ...m,
        categoria,
        candidatoId,
        candidatos,
        incluir: !duplicado && !m.anteriorAlSaldoInicial,
        duplicado,
      };
    });
    setFilas(conSugerencias);
  } catch (err) {
    setError('No se pudo leer el archivo: ' + err.message);
  }
};
    reader.readAsText(file, 'utf-8');
  }

  function actualizarFila(idx, campos) {
    setFilas((prev) => prev.map((f, i) => (i === idx ? { ...f, ...campos } : f)));
  }

  async function confirmarImportacion() {
    setProcesando(true);
    try {
      const aInsertar = filas
        .filter((f) => f.incluir)
        .map((f) => ({
          fecha: f.fecha,
          detalle: f.detalle,
          tipo: f.tipo,
          monto: f.monto,
          saldo_informado_banco: f.saldo_informado_banco,
          categoria: f.categoria,
          proveedor_id: f.categoria === 'proveedor' ? f.candidatoId : null,
          unidad_id: f.categoria === 'unidad' ? f.candidatoId : null,
          texto_original_banco: f.texto_original_banco,
          confirmado: f.categoria !== 'sin_clasificar',
          orden_original: f.orden_original,
        }));

      const conSaldo = filas.filter((f) => f.incluir && f.saldo_informado_banco != null);
      let sugerenciaSaldos = null;
      if (conSaldo.length > 0) {
        const primera = conSaldo[0];
        const ultima = conSaldo[conSaldo.length - 1];
        const deltaPrimera = primera.tipo === 'ingreso' ? primera.monto : -primera.monto;
        sugerenciaSaldos = {
          inicial: Number((primera.saldo_informado_banco - deltaPrimera).toFixed(2)),
          final: ultima.saldo_informado_banco,
        };
      }

      await onImportar(aInsertar, sugerenciaSaldos);
      onClose();
    } catch (err) {
      alert('Error al importar: ' + err.message);
    } finally {
      setProcesando(false);
    }
  }

  if (!perfil) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-slate-600">
            Todavía no armamos el perfil de importación para{' '}
            <strong>{periodo.banco || 'este banco'}</strong>. Por ahora este período solo acepta carga manual con
            "Agregar movimiento", o cambiá el banco del período a ICBC si corresponde.
          </p>
          <button onClick={onClose} className="w-full bg-slate-200 text-slate-700 text-sm py-2 rounded-lg font-semibold">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Importar movimientos — {periodo.banco}</h3>
            <p className="text-xs text-slate-400">Subí el archivo tal cual lo exportaste del home banking</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {!filas && (
          <div>
            <input type="file" accept=".csv" onChange={handleArchivo} className="text-sm" />
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </div>
        )}

        {filas && (
          <>
            <p className="text-xs text-slate-500">
              {filas.length} movimientos encontrados. Revisá la clasificación sugerida antes de confirmar — las
              filas grises parecen estar ya cargadas y no se van a importar de nuevo (podés tildarlas igual si
              querés forzarlo).
            </p>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="p-2 text-center">Incluir</th>
                    <th className="p-2">Fecha</th>
                    <th className="p-2">Detalle / Nombre banco</th>
                    <th className="p-2">Clasificación</th>
                    <th className="p-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filas.map((f, idx) => (
                    <tr key={idx} className={f.duplicado ? 'bg-slate-50 text-slate-400' : ''}>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={f.incluir}
                          onChange={(e) => actualizarFila(idx, { incluir: e.target.checked })}
                        />
                      </td>
                      <td className="p-2 whitespace-nowrap">{formatFechaDDMMYYYY(f.fecha)}</td>
                      <td className="p-2">
                        <div>{f.detalle}</div>
                        {f.texto_original_banco && <div className="text-slate-400">{f.texto_original_banco}</div>}
                        {f.duplicado && <div className="text-amber-600 font-semibold">Posible duplicado</div>}
{f.anteriorAlSaldoInicial && (
  <div className="text-purple-600 font-semibold">Anterior al saldo inicial del período</div>
)}
                      </td>
                      <td className="p-2">
                        <select
                          value={
                            f.categoria === 'proveedor' || f.categoria === 'unidad'
                              ? `${f.categoria}:${f.candidatoId}`
                              : f.categoria
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'sin_clasificar' || val === 'gastos_bancarios') {
                              actualizarFila(idx, { categoria: val, candidatoId: null });
                            } else {
                              const [tipoSel, id] = val.split(':');
                              actualizarFila(idx, { categoria: tipoSel, candidatoId: id });
                            }
                          }}
                          className="border rounded p-1 text-xs bg-white w-full"
                        >
                          <option value="sin_clasificar">Sin clasificar</option>
                          <option value="gastos_bancarios">Gastos Bancarios</option>

                          {f.candidatos.length > 0 && (
                            <optgroup label="Sugeridos">
                              {f.candidatos.map((c) => (
                                <option key={`sug-${c.tipo}:${c.id}`} value={`${c.tipo}:${c.id}`}>
                                  {c.tipo === 'proveedor' ? 'Prov: ' : 'Unidad: '}
                                  {c.nombre} ({Math.round(c.score * 100)}%)
                                </option>
                              ))}
                            </optgroup>
                          )}

                          <optgroup label="Todos los proveedores">
                            {proveedores.map((p) => (
                              <option key={`prov-${p.id}`} value={`proveedor:${p.id}`}>
                                {p.nombre}
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="Todas las unidades">
                            {unidades.map((u) => (
                              <option key={`unid-${u.id}`} value={`unidad:${u.id}`}>
                                {u.numero_unidad} - {u.propietario_nombre}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </td>
                      <td
                        className={`p-2 text-right font-mono whitespace-nowrap ${
                          f.tipo === 'ingreso' ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {formatMonto(f.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <p className="text-xs text-slate-500">
                {filas.filter((f) => f.incluir).length} de {filas.length} se van a importar
              </p>
              <div className="flex gap-2">
                <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">
                  Cancelar
                </button>
                <button
                  onClick={confirmarImportacion}
                  disabled={procesando || filas.filter((f) => f.incluir).length === 0}
                  className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
                >
                  {procesando ? 'Importando...' : 'Confirmar importación'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}