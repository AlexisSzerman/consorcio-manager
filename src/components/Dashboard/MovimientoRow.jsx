import { useState } from 'react';
import { esHoy, esEstaSemana, esVencido, formatMonto } from '../../utils/dateHelpers';
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

export default function MovimientoRow({ movimiento, consorcioNombre, onGuardar, onEliminar, onAbrirNota }) {
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
      campos.fecha_pago = new Date().toISOString().split('T')[0];
    }
    if (!campos.fecha_pago) campos.fecha_pago = null;
    await onGuardar(movimiento.id, campos);
    setEditando(false);
  }

  const linkBtn =
    movimiento.tipo === 'proveedor' ? (
      <a
        href={gmailUrl(movimiento.mail_or_link)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center text-xs bg-red-50 text-red-600 font-medium px-2 py-1 rounded border border-red-200 hover:bg-red-100"
      >
        <i className="fa-solid fa-envelope mr-1"></i> Gmail
      </a>
    ) : (
      <a
        href={movimiento.mail_or_link}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center text-xs bg-blue-50 text-blue-600 font-medium px-2 py-1 rounded border border-blue-200 hover:bg-blue-100"
      >
        <i className="fa-solid fa-globe mr-1"></i> Web
      </a>
    );

  let avisoVencimiento = null;
  if (movimiento.estado !== 'PAGADO') {
    if (esVencido(movimiento.vencimiento)) {
      avisoVencimiento = (
        <span className="ml-2 text-[10px] bg-red-800 text-white font-bold px-1.5 py-0.5 rounded">
          VENCIDO
        </span>
      );
    } else if (esHoy(movimiento.vencimiento)) {
      avisoVencimiento = (
        <span className="ml-2 text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded animate-pulse">
          HOY
        </span>
      );
    } else if (esEstaSemana(movimiento.vencimiento)) {
      avisoVencimiento = (
        <span className="ml-2 text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded">
          SEMANA
        </span>
      );
    }
  }

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
            className="w-24 border rounded p-1 text-xs"
          />
        </td>
        <td className="p-3">{linkBtn}</td>
        <td className="p-3">
          <input
            type="date"
            value={form.vencimiento}
            onChange={(e) => setForm({ ...form, vencimiento: e.target.value })}
            className="border rounded p-1 text-xs"
          />
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
        <td className="p-3">
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
        </td>
        <td className="p-3 text-center">
          <NotaIconButton tieneNota={!!movimiento.notas} onClick={() => onAbrirNota(movimiento)} />
        </td>
        <td className="p-3">
          <input
            type="date"
            value={form.fecha_pago}
            onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })}
            className="border rounded p-1 text-xs"
          />
        </td>
        <td className="p-3 text-center flex justify-center gap-1">
          <button
            onClick={guardar}
            className="bg-emerald-600 text-white p-1.5 rounded hover:bg-emerald-700 text-xs"
          >
            <i className="fa-solid fa-check"></i>
          </button>
          <button
            onClick={() => setEditando(false)}
            className="bg-slate-300 text-slate-700 p-1.5 rounded hover:bg-slate-400 text-xs"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50 border-b border-slate-100">
      <td className="p-4 font-semibold text-slate-800">{consorcioNombre}</td>
      <td className="p-4">{movimiento.item_nombre}</td>
      <td className="p-4 font-mono text-xs">
        {movimiento.num_factura || <span className="text-slate-300">-</span>}
      </td>
      <td className="p-4">{linkBtn}</td>
      <td className="p-4 text-slate-700 font-medium">
        {movimiento.vencimiento || <span className="text-slate-300">Sin fecha</span>} {avisoVencimiento}
      </td>
      <td className="p-4 font-mono font-medium">{formatMonto(movimiento.monto)}</td>
      <td className="p-4">
        <span className={`text-xs px-2 py-1 rounded font-bold ${ESTADO_BADGE[movimiento.estado]}`}>
          {ESTADO_LABEL[movimiento.estado] || movimiento.estado}
        </span>
      </td>
      <td className="p-4 text-center">
        <NotaIconButton tieneNota={!!movimiento.notas} onClick={() => onAbrirNota(movimiento)} />
      </td>
      <td className="p-4 text-slate-500 text-xs">{movimiento.fecha_pago || '-'}</td>
      <td className="p-4 text-center">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={iniciarEdicion}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-l border border-slate-300"
          >
            <i className="fa-solid fa-pen"></i>
          </button>
          <button
            onClick={() => onEliminar(movimiento.id)}
            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-r border border-slate-300 border-l-0"
          >
            <i className="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  );
}
