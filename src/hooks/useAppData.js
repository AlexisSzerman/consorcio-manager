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
        serviciosIds: (consServData || [])
          .filter((r) => r.consorcio_id === c.id)
          .map((r) => r.servicio_id),
        proveedoresIds: (consProvData || [])
          .filter((r) => r.consorcio_id === c.id)
          .map((r) => r.proveedor_id),
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
    const nuevo = { ...data, serviciosIds: [], proveedoresIds: [] };
    setConsorcios((prev) => [...prev, nuevo]);
    return nuevo;
  }, []);

  const updateConsorcio = useCallback(async (id, campos) => {
    const { error } = await supabase.from('consorcios').update(campos).eq('id', id);
    if (error) throw error;
    setConsorcios((prev) => prev.map((c) => (c.id === id ? { ...c, ...campos } : c)));
  }, []);

  const toggleAsignacion = useCallback(async (consorcioId, tipo, itemId) => {
    const tabla = tipo === 'servicios' ? 'consorcio_servicios' : 'consorcio_proveedores';
    const columnaItem = tipo === 'servicios' ? 'servicio_id' : 'proveedor_id';
    const key = tipo === 'servicios' ? 'serviciosIds' : 'proveedoresIds';

    const consorcio = consorcios.find((c) => c.id === consorcioId);
    const yaAsignado = consorcio ? consorcio[key].includes(itemId) : false;

    if (yaAsignado) {
      const { error } = await supabase
        .from(tabla)
        .delete()
        .eq('consorcio_id', consorcioId)
        .eq(columnaItem, itemId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from(tabla)
        .insert({ consorcio_id: consorcioId, [columnaItem]: itemId });
      if (error) throw error;
    }

    setConsorcios((prev) =>
      prev.map((c) => {
        if (c.id !== consorcioId) return c;
        const actual = c[key];
        const actualizado = yaAsignado
          ? actual.filter((x) => x !== itemId)
          : [...actual, itemId];
        return { ...c, [key]: actualizado };
      })
    );
  }, [consorcios]);

  // ---------- Movimientos ----------
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
      consorcio.serviciosIds.forEach((sId) => {
        const s = servicios.find((serv) => serv.id === sId);
        if (!s) return;
        const existe = movimientos.some(
          (m) =>
            m.consorcio_id === consorcio.id &&
            m.item_nombre === s.nombre &&
            m.vencimiento.startsWith(mesSeleccionado)
        );
        if (!existe) {
          nuevos.push({
            consorcio_id: consorcio.id,
            item_nombre: s.nombre,
            tipo: 'servicio',
            num_factura: '',
            monto: 0,
            estado: 'PENDIENTE',
            vencimiento: `${mesSeleccionado}-10`,
            fecha_pago: null,
            mail_or_link: s.link,
            notas: '',
          });
        }
      });

      consorcio.proveedoresIds.forEach((pId) => {
        const p = proveedores.find((prov) => prov.id === pId);
        if (!p) return;
        const existe = movimientos.some(
          (m) =>
            m.consorcio_id === consorcio.id &&
            m.item_nombre === p.nombre &&
            m.vencimiento.startsWith(mesSeleccionado)
        );
        if (!existe) {
          nuevos.push({
            consorcio_id: consorcio.id,
            item_nombre: p.nombre,
            tipo: 'proveedor',
            num_factura: '',
            monto: 0,
            estado: 'PENDIENTE',
            vencimiento: `${mesSeleccionado}-15`,
            fecha_pago: null,
            mail_or_link: p.mail,
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
  }, [consorcios, servicios, proveedores, movimientos]);

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
    toggleAsignacion,
    updateMovimiento,
    updateNotaMovimiento,
    deleteMovimiento,
    generarMes,
  };
}
