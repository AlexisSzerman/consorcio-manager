import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAppData() {
  const [servicios, setServicios] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [consorcios, setConsorcios] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [pagosParciales, setPagosParciales] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [libroDiarioPeriodos, setLibroDiarioPeriodos] = useState([]);
  const [libroDiarioMovimientosPorPeriodo, setLibroDiarioMovimientosPorPeriodo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [libroDiarioParaReconciliar, setLibroDiarioParaReconciliar] = useState([]);

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
  { data: serviciosData, error: eServicios },
  { data: proveedoresData, error: eProveedores },
  { data: consorciosData, error: eConsorcios },
  { data: consServData, error: eConsServ },
  { data: consProvData, error: eConsProv },
  { data: movimientosData, error: eMovimientos },
  { data: pagosParcialesData, error: ePagos },
  { data: unidadesData, error: eUnidades },
  { data: periodosData, error: ePeriodos },
  { data: ldReconciliarData, error: eLdReconciliar },
] = await Promise.all([
  supabase.from('servicios').select('*').order('nombre'),
  supabase.from('proveedores').select('*').order('nombre'),
  supabase.from('consorcios').select('*').order('nombre'),
  supabase.from('consorcio_servicios').select('*'),
  supabase.from('consorcio_proveedores').select('*'),
  supabase.from('movimientos').select('*').order('vencimiento'),
  supabase.from('pagos_parciales').select('*').order('fecha'),
  supabase.from('unidades').select('*').order('numero_unidad'),
  supabase.from('libro_diario_periodos').select('*').order('periodo', { ascending: false }),
  supabase
    .from('libro_diario_movimientos')
    .select('*')
    .eq('categoria', 'proveedor')
    .eq('tipo', 'egreso'),
]);

const firstError = eServicios || eProveedores || eConsorcios || eConsServ || eConsProv || eMovimientos || ePagos || eUnidades || ePeriodos || eLdReconciliar;
if (firstError) throw firstError;

      const consorciosConRelaciones = (consorciosData || []).map((c) => ({
        ...c,
        serviciosCuentas: (consServData || [])
          .filter((r) => r.consorcio_id === c.id)
          .map((r) => {
            const s = (serviciosData || []).find((serv) => serv.id === r.servicio_id);
            return {
              id: r.id,
              servicio_id: r.servicio_id,
              alias: r.alias || '',
              nombre: s?.nombre || '(servicio eliminado)',
              link: s?.link || '',
            };
          }),
        proveedoresCuentas: (consProvData || [])
          .filter((r) => r.consorcio_id === c.id)
          .map((r) => {
            const p = (proveedoresData || []).find((prov) => prov.id === r.proveedor_id);
            return {
              id: r.id,
              proveedor_id: r.proveedor_id,
              alias: r.alias || '',
              nombre: p?.nombre || '(proveedor eliminado)',
              mail: p?.mail || '',
            };
          }),
        unidades: (unidadesData || [])
          .filter((u) => u.consorcio_id === c.id)
          .map((u) => ({
            id: u.id,
            numero_unidad: u.numero_unidad,
            propietario_nombre: u.propietario_nombre,
            alias_reconocimiento: u.alias_reconocimiento || '',
          })),
      }));

      setServicios(serviciosData || []);
      setProveedores(proveedoresData || []);
      setConsorcios(consorciosConRelaciones);
      setMovimientos(movimientosData || []);
      setPagosParciales(pagosParcialesData || []);
      setUnidades(unidadesData || []);
      setLibroDiarioPeriodos(periodosData || []);
      setLibroDiarioParaReconciliar(ldReconciliarData || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  // La "última actualización" global es el máximo estado_actualizado_en entre todos los movimientos
  const ultimaActualizacionGlobal = useMemo(() => {
    if (!movimientos.length) return null;
    return movimientos.reduce((max, m) => {
      if (!m.estado_actualizado_en) return max;
      return !max || m.estado_actualizado_en > max ? m.estado_actualizado_en : max;
    }, null);
  }, [movimientos]);

  // ---------- Servicios ----------
  const addServicio = useCallback(async (nombre, link) => {
    const { data, error } = await supabase
      .from('servicios')
      .insert({ nombre, link })
      .select()
      .single();
    if (error) throw error;
    setServicios((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return data;
  }, []);

  const deleteServicio = useCallback(async (id) => {
    const { error } = await supabase.from('servicios').delete().eq('id', id);
    if (error) throw error;
    setServicios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateServicio = useCallback(async (id, campos) => {
    const { data, error } = await supabase
      .from('servicios')
      .update(campos)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setServicios((prev) =>
      prev.map((s) => (s.id === id ? data : s)).sort((a, b) => a.nombre.localeCompare(b.nombre))
    );
    return data;
  }, []);

  // ---------- Proveedores ----------
  const addProveedor = useCallback(async (nombre, mail, nota) => {
    const { data, error } = await supabase
      .from('proveedores')
      .insert({ nombre, mail, nota })
      .select()
      .single();
    if (error) throw error;
    setProveedores((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return data;
  }, []);

  const deleteProveedor = useCallback(async (id) => {
    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (error) throw error;
    setProveedores((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateProveedor = useCallback(async (id, campos) => {
    const { data, error } = await supabase
      .from('proveedores')
      .update(campos)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setProveedores((prev) =>
      prev.map((p) => (p.id === id ? data : p)).sort((a, b) => a.nombre.localeCompare(b.nombre))
    );
    return data;
  }, []);

  // ---------- Consorcios ----------
  const addConsorcio = useCallback(async (nombre) => {
    const { data, error } = await supabase
      .from('consorcios')
      .insert({ nombre })
      .select()
      .single();
    if (error) throw error;
    const nuevo = { ...data, serviciosCuentas: [], proveedoresCuentas: [], unidades: [] };
    setConsorcios((prev) => [...prev, nuevo]);
    return nuevo;
  }, []);

  const updateConsorcio = useCallback(async (id, campos) => {
    const { error } = await supabase.from('consorcios').update(campos).eq('id', id);
    if (error) throw error;
    setConsorcios((prev) => prev.map((c) => (c.id === id ? { ...c, ...campos } : c)));
  }, []);

  // ---------- Unidades / Propietarios ----------
  const addUnidad = useCallback(async (consorcioId, numeroUnidad, propietarioNombre, aliasReconocimiento) => {
    const { data, error } = await supabase
      .from('unidades')
      .insert({
        consorcio_id: consorcioId,
        numero_unidad: numeroUnidad,
        propietario_nombre: propietarioNombre,
        alias_reconocimiento: aliasReconocimiento || null,
      })
      .select()
      .single();
    if (error) throw error;

    const nuevaUnidad = {
      id: data.id,
      numero_unidad: data.numero_unidad,
      propietario_nombre: data.propietario_nombre,
      alias_reconocimiento: data.alias_reconocimiento || '',
    };
    setConsorcios((prev) =>
      prev.map((c) =>
        c.id === consorcioId ? { ...c, unidades: [...c.unidades, nuevaUnidad] } : c
      )
    );
    setUnidades((prev) => [...prev, data]);
    return nuevaUnidad;
  }, []);

  const updateUnidad = useCallback(async (consorcioId, unidadId, campos) => {
    const camposDb = {
      numero_unidad: campos.numero_unidad,
      propietario_nombre: campos.propietario_nombre,
      alias_reconocimiento: campos.alias_reconocimiento || null,
    };
    const { data, error } = await supabase
      .from('unidades')
      .update(camposDb)
      .eq('id', unidadId)
      .select()
      .single();
    if (error) throw error;

    const unidadActualizada = {
      id: data.id,
      numero_unidad: data.numero_unidad,
      propietario_nombre: data.propietario_nombre,
      alias_reconocimiento: data.alias_reconocimiento || '',
    };
    setConsorcios((prev) =>
      prev.map((c) =>
        c.id === consorcioId
          ? { ...c, unidades: c.unidades.map((u) => (u.id === unidadId ? unidadActualizada : u)) }
          : c
      )
    );
    setUnidades((prev) => prev.map((u) => (u.id === unidadId ? data : u)));
    return unidadActualizada;
  }, []);

  const deleteUnidad = useCallback(async (consorcioId, unidadId) => {
    const { error } = await supabase.from('unidades').delete().eq('id', unidadId);
    if (error) throw error;
    setConsorcios((prev) =>
      prev.map((c) =>
        c.id === consorcioId ? { ...c, unidades: c.unidades.filter((u) => u.id !== unidadId) } : c
      )
    );
    setUnidades((prev) => prev.filter((u) => u.id !== unidadId));
  }, []);

  // ---------- Libro Diario ----------
  const addPeriodoLibroDiario = useCallback(async (consorcioId, periodo, cuenta, banco) => {
    const { data, error } = await supabase
      .from('libro_diario_periodos')
      .insert({ consorcio_id: consorcioId, periodo, cuenta: cuenta || 'Banco', banco: banco || null })
      .select()
      .single();
    if (error) throw error;
    setLibroDiarioPeriodos((prev) => [data, ...prev]);
    return data;
  }, []);

  const updatePeriodoLibroDiario = useCallback(async (periodoId, campos) => {
    const { data, error } = await supabase
      .from('libro_diario_periodos')
      .update(campos)
      .eq('id', periodoId)
      .select()
      .single();
    if (error) throw error;
    setLibroDiarioPeriodos((prev) => prev.map((p) => (p.id === periodoId ? data : p)));
    return data;
  }, []);

  const deletePeriodoLibroDiario = useCallback(async (periodoId) => {
    const { error } = await supabase.from('libro_diario_periodos').delete().eq('id', periodoId);
    if (error) throw error;
    setLibroDiarioPeriodos((prev) => prev.filter((p) => p.id !== periodoId));
    setLibroDiarioMovimientosPorPeriodo((prev) => {
      const nuevo = { ...prev };
      delete nuevo[periodoId];
      return nuevo;
    });
  }, []);

  const cargarMovimientosLibroDiario = useCallback(async (periodoId) => {
    const { data, error } = await supabase
      .from('libro_diario_movimientos')
      .select('*')
      .eq('periodo_id', periodoId)
      .order('fecha')
      .order('orden_original');
    if (error) throw error;
    setLibroDiarioMovimientosPorPeriodo((prev) => ({ ...prev, [periodoId]: data || [] }));
    return data || [];
  }, []);

  const addMovimientoLibroDiario = useCallback(async (periodoId, campos) => {
    const { data, error } = await supabase
      .from('libro_diario_movimientos')
      .insert({ periodo_id: periodoId, ...campos })
      .select()
      .single();
    if (error) throw error;
    setLibroDiarioMovimientosPorPeriodo((prev) => ({
      ...prev,
      [periodoId]: [...(prev[periodoId] || []), data],
    }));
    return data;
  }, []);

  const updateMovimientoLibroDiario = useCallback(async (periodoId, movId, campos) => {
    const { data, error } = await supabase
      .from('libro_diario_movimientos')
      .update(campos)
      .eq('id', movId)
      .select()
      .single();
    if (error) throw error;
    setLibroDiarioMovimientosPorPeriodo((prev) => ({
      ...prev,
      [periodoId]: (prev[periodoId] || []).map((m) => (m.id === movId ? data : m)),
    }));
    return data;
  }, []);

  const deleteMovimientoLibroDiario = useCallback(async (periodoId, movId) => {
    const { error } = await supabase.from('libro_diario_movimientos').delete().eq('id', movId);
    if (error) throw error;
    setLibroDiarioMovimientosPorPeriodo((prev) => ({
      ...prev,
      [periodoId]: (prev[periodoId] || []).filter((m) => m.id !== movId),
    }));
  }, []);

  // Inserción masiva, usada por el importador de bancos
  const addMovimientosLibroDiarioBulk = useCallback(async (periodoId, movimientosArray) => {
    if (movimientosArray.length === 0) return [];
    const payload = movimientosArray.map((m) => ({ periodo_id: periodoId, ...m }));
    const { data, error } = await supabase.from('libro_diario_movimientos').insert(payload).select();
    if (error) throw error;
    setLibroDiarioMovimientosPorPeriodo((prev) => ({
      ...prev,
      [periodoId]: [...(prev[periodoId] || []), ...data],
    }));
    return data;
  }, []);

  const addCuentaServicio = useCallback(async (consorcioId, servicioId, alias) => {
    const { data, error } = await supabase
      .from('consorcio_servicios')
      .insert({ consorcio_id: consorcioId, servicio_id: servicioId, alias: alias || null })
      .select()
      .single();
    if (error) throw error;
    const servicio = servicios.find((s) => s.id === servicioId);
    const cuenta = {
      id: data.id,
      servicio_id: servicioId,
      alias: data.alias || '',
      nombre: servicio?.nombre || '',
      link: servicio?.link || '',
    };
    setConsorcios((prev) =>
      prev.map((c) =>
        c.id === consorcioId ? { ...c, serviciosCuentas: [...c.serviciosCuentas, cuenta] } : c
      )
    );
    return cuenta;
  }, [servicios]);

  const deleteCuentaServicio = useCallback(async (consorcioId, cuentaId) => {
    const { error } = await supabase.from('consorcio_servicios').delete().eq('id', cuentaId);
    if (error) throw error;
    setConsorcios((prev) =>
      prev.map((c) =>
        c.id === consorcioId
          ? { ...c, serviciosCuentas: c.serviciosCuentas.filter((cu) => cu.id !== cuentaId) }
          : c
      )
    );
  }, []);

  const addCuentaProveedor = useCallback(async (consorcioId, proveedorId, alias) => {
    const { data, error } = await supabase
      .from('consorcio_proveedores')
      .insert({ consorcio_id: consorcioId, proveedor_id: proveedorId, alias: alias || null })
      .select()
      .single();
    if (error) throw error;
    const proveedor = proveedores.find((p) => p.id === proveedorId);
    const cuenta = {
      id: data.id,
      proveedor_id: proveedorId,
      alias: data.alias || '',
      nombre: proveedor?.nombre || '',
      mail: proveedor?.mail || '',
    };
    setConsorcios((prev) =>
      prev.map((c) =>
        c.id === consorcioId ? { ...c, proveedoresCuentas: [...c.proveedoresCuentas, cuenta] } : c
      )
    );
    return cuenta;
  }, [proveedores]);

  const deleteCuentaProveedor = useCallback(async (consorcioId, cuentaId) => {
    const { error } = await supabase.from('consorcio_proveedores').delete().eq('id', cuentaId);
    if (error) throw error;
    setConsorcios((prev) =>
      prev.map((c) =>
        c.id === consorcioId
          ? { ...c, proveedoresCuentas: c.proveedoresCuentas.filter((cu) => cu.id !== cuentaId) }
          : c
      )
    );
  }, []);

  // ---------- Movimientos ----------
  // Crea un movimiento puntual eligiendo consorcio + servicio o proveedor directo
  // del catálogo, sin necesidad de una "cuenta" registrada en el consorcio.
  const addMovimientoManual = useCallback(async (consorcioId, tipo, itemId) => {
    let itemNombre = '';
    let mailOrLink = '';

    if (tipo === 'servicio') {
      const s = servicios.find((serv) => serv.id === itemId);
      if (!s) throw new Error('Servicio no encontrado');
      itemNombre = s.nombre;
      mailOrLink = s.link || '';
    } else {
      const p = proveedores.find((prov) => prov.id === itemId);
      if (!p) throw new Error('Proveedor no encontrado');
      itemNombre = p.nombre;
      mailOrLink = p.mail || '';
    }

    const { data, error } = await supabase
      .from('movimientos')
      .insert({
        consorcio_id: consorcioId,
        servicio_id: tipo === 'servicio' ? itemId : null,
        proveedor_id: tipo === 'proveedor' ? itemId : null,
        item_nombre: itemNombre,
        tipo,
        num_factura: '',
        monto: 0,
        estado: 'PENDIENTE',
        vencimiento: null,
        fecha_pago: null,
        mail_or_link: mailOrLink,
        notas: '',
      })
      .select()
      .single();
    if (error) throw error;
    setMovimientos((prev) => [...prev, data]);
    return data;
  }, [servicios, proveedores]);

  // Recalcula y persiste el estado del movimiento según la suma de pagos parciales
  const recalcularEstadoPorPagos = useCallback(async (movimientoId, pagosDeEsteMovimiento) => {
    const movimiento = movimientos.find((m) => m.id === movimientoId);
    if (!movimiento) return;

    const totalPagado = pagosDeEsteMovimiento.reduce((sum, p) => sum + Number(p.monto), 0);

    let nuevoEstado = movimiento.estado;
    let nuevaFechaPago = movimiento.fecha_pago;

    if (totalPagado <= 0) {
      nuevoEstado = 'PENDIENTE';
      nuevaFechaPago = null;
    } else if (totalPagado < Number(movimiento.monto)) {
      nuevoEstado = 'PARCIAL';
      nuevaFechaPago = null;
    } else {
      nuevoEstado = 'PAGADO';
      nuevaFechaPago = pagosDeEsteMovimiento.reduce(
        (max, p) => (!max || p.fecha > max ? p.fecha : max),
        null
      );
    }

    if (nuevoEstado !== movimiento.estado || nuevaFechaPago !== movimiento.fecha_pago) {
      const { data: movActualizado, error } = await supabase
        .from('movimientos')
        .update({ estado: nuevoEstado, fecha_pago: nuevaFechaPago })
        .eq('id', movimientoId)
        .select()
        .single();
      if (error) throw error;
      setMovimientos((prev) => prev.map((m) => (m.id === movimientoId ? movActualizado : m)));
    }
  }, [movimientos]);

  const addPagoParcial = useCallback(async (movimientoId, monto, fecha, nota, libroDiarioMovimientoId = null) => {
  const { data: nuevoPago, error } = await supabase
    .from('pagos_parciales')
    .insert({
      movimiento_id: movimientoId,
      monto,
      fecha,
      nota: nota || null,
      libro_diario_movimiento_id: libroDiarioMovimientoId,
    })
    .select()
    .single();
  if (error) throw error;

  const pagosActualizados = [...pagosParciales, nuevoPago];
  setPagosParciales(pagosActualizados);

  const pagosDeEsteMovimiento = pagosActualizados.filter((p) => p.movimiento_id === movimientoId);
  await recalcularEstadoPorPagos(movimientoId, pagosDeEsteMovimiento);

  return nuevoPago;
}, [pagosParciales, recalcularEstadoPorPagos]);

  const deletePagoParcial = useCallback(async (pagoId, movimientoId) => {
    const { error } = await supabase.from('pagos_parciales').delete().eq('id', pagoId);
    if (error) throw error;

    const pagosActualizados = pagosParciales.filter((p) => p.id !== pagoId);
    setPagosParciales(pagosActualizados);

    const pagosDeEsteMovimiento = pagosActualizados.filter((p) => p.movimiento_id === movimientoId);
    await recalcularEstadoPorPagos(movimientoId, pagosDeEsteMovimiento);
  }, [pagosParciales, recalcularEstadoPorPagos]);

  const updateMovimiento = useCallback(async (id, campos) => {
    const { data, error } = await supabase
      .from('movimientos')
      .update(campos)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setMovimientos((prev) => prev.map((m) => (m.id === id ? data : m)));
    return data;
  }, []);

  // Actualiza sólo la nota de un movimiento (no toca estado_actualizado_en)
  const updateNotaMovimiento = useCallback(async (id, notas) => {
    return updateMovimiento(id, { notas });
  }, [updateMovimiento]);

  const deleteMovimiento = useCallback(async (id) => {
    const { error } = await supabase.from('movimientos').delete().eq('id', id);
    if (error) throw error;
    setMovimientos((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // Genera el borrador de vencimientos del mes seleccionado (YYYY-MM)
  const generarMes = useCallback(async (mesSeleccionado) => {
    const nuevos = [];

    consorcios.forEach((consorcio) => {
      consorcio.serviciosCuentas.forEach((cuenta) => {
        const nombreConAlias = cuenta.alias ? `${cuenta.nombre} - ${cuenta.alias}` : cuenta.nombre;
        const existe = movimientos.some(
          (m) =>
            m.vencimiento &&
            m.vencimiento.startsWith(mesSeleccionado) &&
            (m.consorcio_servicio_id === cuenta.id ||
              (m.consorcio_id === consorcio.id && m.item_nombre === nombreConAlias))
        );
        if (!existe) {
          nuevos.push({
            consorcio_id: consorcio.id,
            consorcio_servicio_id: cuenta.id,
            servicio_id: cuenta.servicio_id,
            item_nombre: nombreConAlias,
            tipo: 'servicio',
            num_factura: '',
            monto: 0,
            estado: 'PENDIENTE',
            vencimiento: `${mesSeleccionado}-10`,
            fecha_pago: null,
            mail_or_link: cuenta.link,
            notas: '',
          });
        }
      });

      consorcio.proveedoresCuentas.forEach((cuenta) => {
        const nombreConAlias = cuenta.alias ? `${cuenta.nombre} - ${cuenta.alias}` : cuenta.nombre;
        const existe = movimientos.some(
          (m) =>
            m.vencimiento &&
            m.vencimiento.startsWith(mesSeleccionado) &&
            (m.consorcio_proveedor_id === cuenta.id ||
              (m.consorcio_id === consorcio.id && m.item_nombre === nombreConAlias))
        );
        if (!existe) {
          nuevos.push({
            consorcio_id: consorcio.id,
            consorcio_proveedor_id: cuenta.id,
            proveedor_id: cuenta.proveedor_id,
            item_nombre: nombreConAlias,
            tipo: 'proveedor',
            num_factura: '',
            monto: 0,
            estado: 'PENDIENTE',
            vencimiento: `${mesSeleccionado}-15`,
            fecha_pago: null,
            mail_or_link: cuenta.mail,
            notas: '',
          });
        }
      });
    });

    if (nuevos.length === 0) return 0;

    const { data, error } = await supabase.from('movimientos').insert(nuevos).select();
    if (error) throw error;
    setMovimientos((prev) => [...prev, ...data]);
    return data.length;
  }, [consorcios, movimientos]);

  return {
    loading,
    error,
    servicios,
    proveedores,
    consorcios,
    movimientos,
    pagosParciales,
    unidades,
    libroDiarioPeriodos,
    libroDiarioMovimientosPorPeriodo,
    ultimaActualizacionGlobal,
    libroDiarioParaReconciliar,
    recargar: cargarTodo,
    addServicio,
    deleteServicio,
    updateServicio,
    addProveedor,
    deleteProveedor,
    updateProveedor,
    addConsorcio,
    updateConsorcio,
    addUnidad,
    updateUnidad,
    deleteUnidad,
    addPeriodoLibroDiario,
    updatePeriodoLibroDiario,
    deletePeriodoLibroDiario,
    cargarMovimientosLibroDiario,
    addMovimientoLibroDiario,
    addMovimientosLibroDiarioBulk,
    updateMovimientoLibroDiario,
    deleteMovimientoLibroDiario,
    addCuentaServicio,
    deleteCuentaServicio,
    addCuentaProveedor,
    deleteCuentaProveedor,
    updateMovimiento,
    addMovimientoManual,
    addPagoParcial,
    deletePagoParcial,
    updateNotaMovimiento,
    deleteMovimiento,
    generarMes,
  };
}