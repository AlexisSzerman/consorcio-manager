import { useState } from 'react';
import {
  esHoy,
  esEstaSemana,
  esVencido,
  formatMonto,
  formatFechaDDMMYYYY,
  formatFactura,
  hoyStr,
} from '../../utils/dateHelpers';
import NotaIconButton from './NotaIconButton';

const ESTADO_BADGE = {
  PAGADO: 'bg-emerald-100 text-emerald-800',
  PENDIENTE: 'bg-amber-100 text-amber-800',
  CARGADA: 'bg-blue-100 text-blue-800',
  REVISAR: 'bg-purple-100 text-purple-800',
  DEBITO_AUTOMATICO: 'bg-cyan-100 text-cyan-800',
};

const ESTADO_LABEL = {
  PAGADO: 'PAGADO',
  PENDIENTE: 'PENDIENTE',
  CARGADA: 'CARGADA',
  REVISAR: 'REVISAR',
  DEBITO_AUTOMATICO: 'DÉBITO AUTOMÁTICO',
};

function gmailUrl(mail) {
  const q = encodeURIComponent(`${mail} has:attachment`);
  return `https://mail.google.com/mail/u/0/#search/${q}`;
}

export default function MovimientoRow({ movimiento, consorcioNombre, servicios, proveedores, onGuardar, onEliminar, onAbrirNota }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(null);

  function iniciarEdicion() {
    setForm({
      num_factura: movimiento.num_factura || '',
      vencimiento: movimiento.vencimiento || '',
      monto: movimiento.monto,
      estado: movimiento.estado,
      fecha_pago: movimiento.fecha_pago || '',
    });
    setEditando(true);
  }

  async function guardar() {
    const campos = {
      ...form,
      monto: parseFloat(form.monto) || 0,
      vencimiento: form.vencimiento || null,
    };
    if (campos.estado === 'PAGADO' && !campos.fecha_pago) {
      campos.fecha_pago = hoyStr();
    }
    if (!campos.fecha_pago) campos.fecha_pago = null;
    await onGuardar(movimiento.id, campos);
    setEditando(false);
  }

  // Resuelve el link/mail SIEMPRE en vivo desde el catálogo actual,
  // usando la referencia guardada (servicio_id / proveedor_id).
  // mail_or_link queda solo como respaldo para filas muy viejas
  // que no tengan esa referencia (antes de esta migración).
  const servicioActual = movimiento.servicio_id
    ? servicios.find((s) => s.id === movimiento.servicio_id)
    : null;
  const proveedorActual = movimiento.proveedor_id
    ? proveedores.find((p) => p.id === movimiento.proveedor_id)
    : null;
  const linkOMailActual =
    servicioActual?.link || proveedorActual?.mail || movimiento.mail_or_link;

  const linkBtn =
    movimiento.tipo === 'proveedor' ? (
      <a
        href={gmailUrl(linkOMailActual)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-xs bg-red-50 text-red-600 font-medium px-2 py-1 rounded border border-red-200 hover:bg-red-100"
      >
        <i className="fa-solid fa-envelope mr-1"></i> Gmail
      </a>
    ) : (
      <a
        href={linkOMailActual}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-xs bg-blue-50 text-blue-600 font-medium px-2 py-1 rounded border border-blue-200 hover:bg-blue-100"
      >
        <i className="fa-solid fa-globe mr-1"></i> Web
      </a>
    );

  let avisoVencimiento = null;
  if (movimiento.estado !== 'PAGADO' && movimiento.estado !== 'DEBITO_AUTOMATICO') {
    if (esVencido(movimiento.vencimiento)) {
      avisoVencimiento = (
        <span className="text-[10px] bg-red-800 text-white font-bold px-1.5 py-0.5 rounded">VENCIDO</span>
      );
    } else if (esHoy(movimiento.vencimiento)) {
      avisoVencimiento = (
        <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded animate-pulse">
          HOY
        </span>
      );
    } else if (esEstaSemana(movimiento.vencimiento)) {
      avisoVencimiento = (
        <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded">SEMANA</span>
      );
    }
  }

  const tooltipEstado =
    movimiento.estado === 'PAGADO' && movimiento.fecha_pago
      ? `Pagado el ${formatFechaDDMMYYYY(movimiento.fecha_pago)}`
      : undefined;

  if (editando) {
    return (
      <tr className="border-b border-slate-100 bg-indigo-50/30">
        <td className="p-3 font-semibold text-slate-800">{consorcioNombre}</td>
        <td className="p-3">{movimiento.item_nombre}</td>
        <td className="p-3">
          <input
            type="text"
            value={form.num_factura}
            onChange={(e) => setForm({ ...form, num_factura: e.target.value })}
            placeholder="Nº Factura"
            className="w-20 border rounded p-1 text-xs"
          />
        </td>
        <td className="p-3">{linkBtn}</td>
        <td className="p-3">
          <div className="flex flex-col gap-1">
            <input
              type="date"
              value={form.vencimiento}
              onChange={(e) => setForm({ ...form, vencimiento: e.target.value })}
              className="border rounded p-1 text-xs"
            />
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              className="border rounded p-1 text-xs bg-white"
            >
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="CARGADA">CARGADA</option>
              <option value="REVISAR">REVISAR</option>
              <option value="PAGADO">PAGADO</option>
              <option value="DEBITO_AUTOMATICO">DÉBITO AUTOMÁTICO</option>
            </select>
            <input
              type="date"
              value={form.fecha_pago}
              onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })}
              title="Fecha de pago"
              className="border rounded p-1 text-xs"
            />
          </div>
        </td>
        <td className="p-3">
          <input
            type="number"
            step="0.01"
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: e.target.value })}
            className="w-20 border rounded p-1 text-xs font-mono"
          />
        </td>
        <td className="p-3 text-center">
          <div className="inline-flex items-center gap-1">
            <NotaIconButton tieneNota={!!movimiento.notas} onClick={() => onAbrirNota(movimiento)} />
            <button onClick={guardar} className="bg-emerald-600 text-white p-1.5 rounded hover:bg-emerald-700 text-xs">
              <i className="fa-solid fa-check"></i>
            </button>
            <button
              onClick={() => setEditando(false)}
              className="bg-slate-300 text-slate-700 p-1.5 rounded hover:bg-slate-400 text-xs"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50 border-b border-slate-100">
      <td className="p-4 font-semibold text-slate-800">{consorcioNombre}</td>
      <td className="p-4">{movimiento.item_nombre}</td>
      <td className="p-4 font-mono text-xs whitespace-nowrap">
        {formatFactura(movimiento.num_factura) || <span className="text-slate-300">-</span>}
      </td>
      <td className="p-4">{linkBtn}</td>
      <td className="p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-medium text-sm whitespace-nowrap">
              {formatFechaDDMMYYYY(movimiento.vencimiento) || <span className="text-slate-300">Sin fecha</span>}
            </span>
            <span
              title={tooltipEstado}
              className={`text-xs px-2 py-1 rounded font-bold whitespace-nowrap ${ESTADO_BADGE[movimiento.estado]}`}
            >
              {ESTADO_LABEL[movimiento.estado] || movimiento.estado}
            </span>
          </div>
          {avisoVencimiento && <div>{avisoVencimiento}</div>}
        </div>
      </td>
      <td className="p-4 font-mono font-medium whitespace-nowrap">{formatMonto(movimiento.monto)}</td>
      <td className="p-4 text-center">
        <div className="inline-flex items-center gap-1">
          <NotaIconButton tieneNota={!!movimiento.notas} onClick={() => onAbrirNota(movimiento)} />
          <button
            onClick={iniciarEdicion}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 w-8 h-8 rounded-lg border border-slate-200"
          >
            <i className="fa-solid fa-pen"></i>
          </button>
          <button
            onClick={() => onEliminar(movimiento.id)}
            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 w-8 h-8 rounded-lg border border-red-200"
          >
            <i className="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  );
}