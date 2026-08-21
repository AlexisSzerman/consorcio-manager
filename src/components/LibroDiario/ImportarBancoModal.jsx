import { useState } from "react";
import {
  PERFILES_BANCO,
  buscarCandidatos,
  marcarAnteriorAlSaldoInicial,
} from "../../utils/importadorBancos";
import { formatMonto, formatFechaDDMMYYYY } from "../../utils/dateHelpers";

function calcularSaldoInicialSugerido(filas) {
  const conSaldo = filas.filter((f) => f.saldo_informado_banco != null);
  if (conSaldo.length === 0) return null;
  const primera = conSaldo[0];
  const delta = primera.tipo === "ingreso" ? primera.monto : -primera.monto;
  return Number((primera.saldo_informado_banco - delta).toFixed(2));
}

function calcularSaldoFinalSugerido(filas) {
  const conSaldo = filas.filter((f) => f.saldo_informado_banco != null);
  if (conSaldo.length === 0) return null;
  return conSaldo[conSaldo.length - 1].saldo_informado_banco;
}

// Fecha de HOY en formato YYYY-MM-DD, usando componentes locales (no
// toISOString(), que convierte a UTC y en Argentina —UTC-3— puede dar el
// día de ayer o mañana según la hora en que se confirme la importación).
function obtenerFechaHoyLocal() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Clave de duplicados: preferimos comprobante_banco (lo pone el banco, es
// inmutable) cuando está disponible en ambos lados. Si no, caemos a
// fecha+monto+tipo — a propósito NO usamos "detalle", porque es un campo que
// se puede editar a mano desde el modal de edición, y un movimiento editado
// (aunque sea solo la redacción, sin tocar fecha/monto) dejaría de matchear
// para siempre contra el original.
function esDuplicado(m, movimientosExistentes) {
  return movimientosExistentes.some((ex) => {
    if (m.comprobante_banco && ex.comprobante_banco) {
      return (
        ex.comprobante_banco === m.comprobante_banco && ex.fecha === m.fecha
      );
    }
    return (
      ex.fecha === m.fecha &&
      Number(ex.monto) === m.monto &&
      ex.tipo === m.tipo
    );
  });
}

export default function ImportarBancoModal({
  periodo,
  movimientosExistentes,
  proveedores,
  servicios,
  unidades,
  onImportar,
  onClose,
}) {
  const [filas, setFilas] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);
  const [avisoContinuidad, setAvisoContinuidad] = useState(null);

  const bancoNormalizado = (periodo.banco || "")
    .toString()
    .trim()
    .toUpperCase();

  const perfil =
    PERFILES_BANCO[periodo.banco] ||
    PERFILES_BANCO[bancoNormalizado] ||
    PERFILES_BANCO[bancoNormalizado.replace(/\s+/g, "_")] ||
    Object.entries(PERFILES_BANCO).find(([clave]) =>
      bancoNormalizado.includes(clave)
    )?.[1] ||
    null;

  function handleArchivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    setAvisoContinuidad(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parseadas = perfil.parser(evt.target.result);

        const enOrdenCronologico = [...parseadas].sort(
          (a, b) => a.orden_original - b.orden_original,
        );
        const marcadas = marcarAnteriorAlSaldoInicial(
          enOrdenCronologico,
          periodo.saldo_inicial_declarado,
        );

        const conSugerencias = marcadas.map((m) => {
          let categoria = m.categoriaSugerida;
          let candidatoId = null;
          let candidatos = [];
          if (categoria !== "gastos_bancarios" && m.texto_original_banco) {
            candidatos = buscarCandidatos(
              m.texto_original_banco,
              proveedores,
              unidades,
            );
            if (candidatos[0] && candidatos[0].score >= 0.7) {
              categoria = candidatos[0].tipo;
              candidatoId = candidatos[0].id;
            }
          }
          const duplicado = esDuplicado(m, movimientosExistentes);
          return {
            ...m,
            categoria,
            candidatoId,
            candidatos,
            incluir: !duplicado && !m.anteriorAlSaldoInicial,
            duplicado,
          };
        });

        // Chequeo de continuidad: comparamos el saldo final que ya tenías
        // guardado contra el saldo "antes del primer movimiento GENUINAMENTE
        // NUEVO" de este archivo (ignorando los que ya están duplicados).
        //
        // Esto es clave cuando el archivo nuevo se solapa a propósito con el
        // anterior (ej: volvés a bajar desde un día antes para no perderte
        // movimientos tardíos) — si comparásemos contra el primer movimiento
        // del archivo sin más, ese sería parte del solapamiento y el saldo
        // "antes" de ese movimiento no tiene por qué coincidir con nada.
        const noDuplicados = conSugerencias.filter((f) => !f.duplicado);
        const saldoInicialTramoNuevo = calcularSaldoInicialSugerido(noDuplicados);

        if (
          periodo.saldo_final_declarado != null &&
          saldoInicialTramoNuevo != null &&
          Math.abs(saldoInicialTramoNuevo - periodo.saldo_final_declarado) >= 0.01
        ) {
          setAvisoContinuidad({
            saldoEsperado: periodo.saldo_final_declarado,
            saldoArchivo: saldoInicialTramoNuevo,
            diferencia: saldoInicialTramoNuevo - periodo.saldo_final_declarado,
          });
        }

        setFilas(conSugerencias);
      } catch (err) {
        setError("No se pudo leer el archivo: " + err.message);
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function actualizarFila(idx, campos) {
    setFilas((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, ...campos } : f)),
    );
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
          proveedor_id: f.categoria === "proveedor" ? f.candidatoId : null,
          unidad_id: f.categoria === "unidad" ? f.candidatoId : null,
          servicio_id: f.categoria === "servicio" ? f.candidatoId : null,
          texto_original_banco: f.texto_original_banco,
          comprobante_banco: f.comprobante_banco || null,
          confirmado: f.categoria !== "sin_clasificar",
          orden_original: f.orden_original,
        }));

      const conSaldo = filas.filter(
        (f) => f.incluir && f.saldo_informado_banco != null,
      );
      const sugerenciaSaldos = {
        inicial: conSaldo.length > 0 ? calcularSaldoInicialSugerido(conSaldo) : null,
        final: conSaldo.length > 0 ? calcularSaldoFinalSugerido(conSaldo) : null,
        // La fecha en la que VOS hiciste esta importación, no una fecha
        // que traiga el archivo — por eso es la fecha de hoy, no del CSV.
        fechaVerificacion: obtenerFechaHoyLocal(),
      };

      await onImportar(aInsertar, sugerenciaSaldos);
      onClose();
    } catch (err) {
      alert("Error al importar: " + err.message);
    } finally {
      setProcesando(false);
    }
  }

  if (!perfil) {
    return (
      <div
        className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-slate-600">
            Todavía no armamos el perfil de importación para{" "}
            <strong>{periodo.banco || "este banco"}</strong>. Por ahora este
            período solo acepta carga manual con "Agregar movimiento", o cambiá
            el banco del período a ICBC si corresponde.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-slate-200 text-slate-700 text-sm py-2 rounded-lg font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              Importar movimientos — {periodo.banco}
            </h3>
            <p className="text-xs text-slate-400">
              Subí el archivo tal cual lo exportaste del home banking
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {!filas && (
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleArchivo}
              className="text-sm"
            />
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </div>
        )}

        {filas && (
          <>
            {avisoContinuidad && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-800 space-y-1">
                <p className="font-bold">
                  <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                  El saldo antes del primer movimiento nuevo de este archivo no
                  coincide con el saldo final guardado del período
                </p>
                <p>
                  Saldo final guardado: {formatMonto(avisoContinuidad.saldoEsperado)}
                  {" · "}
                  Saldo antes del primer movimiento nuevo: {formatMonto(avisoContinuidad.saldoArchivo)}
                  {" · "}
                  Diferencia: {formatMonto(Math.abs(avisoContinuidad.diferencia))}
                </p>
                <p>
                  Puede ser que falte un archivo intermedio (un rango de fechas
                  sin importar) o que algún movimiento del solapamiento no se
                  haya reconocido como duplicado. Revisá las filas marcadas como
                  "Posible duplicado" antes de confirmar — igual podés continuar
                  si estás seguro.
                </p>
              </div>
            )}

            <p className="text-xs text-slate-500">
              {filas.length} movimientos encontrados. Revisá la clasificación
              sugerida antes de confirmar — las filas grises parecen estar ya
              cargadas y no se van a importar de nuevo (podés tildarlas igual si
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
                    <tr
                      key={idx}
                      className={
                        f.duplicado || f.anteriorAlSaldoInicial
                          ? "bg-slate-50 text-slate-400"
                          : ""
                      }
                    >
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={f.incluir}
                          onChange={(e) =>
                            actualizarFila(idx, { incluir: e.target.checked })
                          }
                        />
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {formatFechaDDMMYYYY(f.fecha)}
                      </td>
                      <td className="p-2">
                        <div>{f.detalle}</div>
                        {f.texto_original_banco && (
                          <div className="text-slate-400">
                            {f.texto_original_banco}
                          </div>
                        )}
                        {f.duplicado && (
                          <div className="text-amber-600 font-semibold">
                            Posible duplicado
                          </div>
                        )}
                        {f.anteriorAlSaldoInicial && (
                          <div className="text-purple-600 font-semibold">
                            Anterior al saldo inicial del período
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <select
                          value={
                            f.categoria === "proveedor" ||
                            f.categoria === "unidad" ||
                            f.categoria === "servicio"
                              ? `${f.categoria}:${f.candidatoId}`
                              : f.categoria
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (
                              val === "sin_clasificar" ||
                              val === "gastos_bancarios"
                            ) {
                              actualizarFila(idx, {
                                categoria: val,
                                candidatoId: null,
                              });
                            } else {
                              const [tipoSel, id] = val.split(":");
                              actualizarFila(idx, {
                                categoria: tipoSel,
                                candidatoId: id,
                              });
                            }
                          }}
                          className="border rounded p-1 text-xs bg-white w-full"
                        >
                          <option value="sin_clasificar">Sin clasificar</option>
                          <option value="gastos_bancarios">
                            Gastos Bancarios
                          </option>

                          {f.candidatos.length > 0 && (
                            <optgroup label="Sugeridos">
                              {f.candidatos.map((c) => (
                                <option
                                  key={`sug-${c.tipo}:${c.id}`}
                                  value={`${c.tipo}:${c.id}`}
                                >
                                  {c.tipo === "proveedor"
                                    ? "Prov: "
                                    : "Unidad: "}
                                  {c.nombre} ({Math.round(c.score * 100)}%)
                                </option>
                              ))}
                            </optgroup>
                          )}

                          <optgroup label="Todos los proveedores">
                            {proveedores.map((p) => (
                              <option
                                key={`prov-${p.id}`}
                                value={`proveedor:${p.id}`}
                              >
                                {p.nombre}
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="Todos los servicios">
                            {servicios.map((s) => (
                              <option
                                key={`serv-${s.id}`}
                                value={`servicio:${s.id}`}
                              >
                                {s.nombre}
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="Todas las unidades">
                            {[...unidades]
                              .sort((a, b) =>
                                a.propietario_nombre.localeCompare(
                                  b.propietario_nombre,
                                  "es",
                                ),
                              )
                              .map((u) => (
                                <option
                                  key={`unid-${u.id}`}
                                  value={`unidad:${u.id}`}
                                >
                                  {u.numero_unidad} - {u.propietario_nombre}
                                </option>
                              ))}
                          </optgroup>
                        </select>
                      </td>
                      <td
                        className={`p-2 text-right font-mono whitespace-nowrap ${
                          f.tipo === "ingreso"
                            ? "text-emerald-700"
                            : "text-red-700"
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
                {filas.filter((f) => f.incluir).length} de {filas.length} se van
                a importar
                {filas.filter((f) => f.incluir).length === 0 && (
                  <span className="block text-slate-400">
                    No hay movimientos nuevos — igual podés confirmar para
                    dejar registrado que revisaste el banco hoy,{" "}
                    {formatFechaDDMMYYYY(obtenerFechaHoyLocal())}.
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="text-sm px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarImportacion}
                  disabled={procesando}
                  className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
                >
                  {procesando
                    ? "Importando..."
                    : filas.filter((f) => f.incluir).length === 0
                      ? "Confirmar revisión (sin novedades)"
                      : "Confirmar importación"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}