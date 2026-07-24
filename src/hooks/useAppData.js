import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAppData() {
  const [servicios, setServicios] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [consorcios, setConsorcios] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      ] = await Promise.all([
        supabase.from('servicios').select('*').order('nombre'),
        supabase.from('proveedores').select('*').order('nombre'),
        supabase.from('consorcios').select('*').order('nombre'),
        supabase.from('consorcio_servicios').select('*'),
        supabase.from('consorcio_proveedores').select('*'),
        supabase.from('movimientos').select('*').order('vencimiento'),
      ]);

      const firstError = eServicios || eProveedores || eConsorcios || eConsServ || eConsProv || eMovimientos;
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
      }));

      setServicios(serviciosData || []);
      setProveedores(proveedoresData || []);
      setConsorcios(consorciosConRelaciones);
      setMovimientos(movimientosData || []);
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
    const nuevo = { ...data, serviciosCuentas: [], proveedoresCuentas: [] };
    setConsorcios((prev) => [...prev, nuevo]);
    return nuevo;
  }, []);

  const updateConsorcio = useCallback(async (id, campos) => {
    const { error } = await supabase.from('consorcios').update(campos).eq('id', id);
    if (error) throw error;
    setConsorcios((prev) => prev.map((c) => (c.id === id ? { ...c, ...campos } : c)));
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
        const existe = movimientos.some(
          (m) =>
            m.consorcio_servicio_id === cuenta.id &&
            m.vencimiento &&
            m.vencimiento.startsWith(mesSeleccionado)
        );
        if (!existe) {
          const nombreConAlias = cuenta.alias ? `${cuenta.nombre} - ${cuenta.alias}` : cuenta.nombre;
          nuevos.push({
            consorcio_id: consorcio.id,
            consorcio_servicio_id: cuenta.id,
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
        const existe = movimientos.some(
          (m) =>
            m.consorcio_proveedor_id === cuenta.id &&
            m.vencimiento &&
            m.vencimiento.startsWith(mesSeleccionado)
        );
        if (!existe) {
          const nombreConAlias = cuenta.alias ? `${cuenta.nombre} - ${cuenta.alias}` : cuenta.nombre;
          nuevos.push({
            consorcio_id: consorcio.id,
            consorcio_proveedor_id: cuenta.id,
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
    ultimaActualizacionGlobal,
    recargar: cargarTodo,
    addServicio,
    deleteServicio,
    updateServicio,
    addProveedor,
    deleteProveedor,
    updateProveedor,
    addConsorcio,
    updateConsorcio,
    addCuentaServicio,
    deleteCuentaServicio,
    addCuentaProveedor,
    deleteCuentaProveedor,
    updateMovimiento,
    addMovimientoManual,
    updateNotaMovimiento,
    deleteMovimiento,
    generarMes,
  };
}