function normalizarTexto(str) {
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function esSubsecuencia(corta, larga) {
  let i = 0;

  for (let j = 0; j < larga.length && i < corta.length; j++) {
    if (larga[j] === corta[i]) i++;
  }

  return i === corta.length;
}

function puntajeMatch(nombreBanco, nombreCandidato) {
  const a = normalizarTexto(nombreBanco);
  const b = normalizarTexto(nombreCandidato);

  if (!a || !b) return 0;

  const [corta, larga] =
    a.length <= b.length ? [a, b] : [b, a];

  if (corta.length < 3) return 0;
  if (!esSubsecuencia(corta, larga)) return 0;

  return corta.length / larga.length;
}

export function buscarCandidatos(nombreBanco, proveedores, unidades) {
  const candidatos = [];

  proveedores.forEach((p) => {
    const score = puntajeMatch(nombreBanco, p.nombre);

    if (score >= 0.55) {
      candidatos.push({
        tipo: 'proveedor',
        id: p.id,
        nombre: p.nombre,
        score,
      });
    }
  });

  unidades.forEach((u) => {
    const variantes = [
      u.propietario_nombre,
      ...(u.alias_reconocimiento || '').split(';'),
    ]
      .map((v) => v.trim())
      .filter(Boolean);

    const mejorScore = Math.max(
      0,
      ...variantes.map((v) =>
        puntajeMatch(nombreBanco, v)
      )
    );

    if (mejorScore >= 0.55) {
      candidatos.push({
        tipo: 'unidad',
        id: u.id,
        nombre: `${u.numero_unidad} - ${u.propietario_nombre}`,
        score: mejorScore,
      });
    }
  });

  return candidatos
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function parseMontoArg(str) {
  if (!str) return 0;

  const limpio = str
    .toString()
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');

  const num = parseFloat(limpio);

  return isNaN(num) ? 0 : num;
}

function parseFechaArg(str) {
  const [d, m, y] = (str || '').trim().split('/');

  if (!d || !m || !y) return null;

  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

const PALABRAS_GASTOS_BANCARIOS = [
  'IMP S/CRED',
  'IMP S/DEB',
  'COMISION',
  'MANTENIMIENTO',
  'SELLADO',
  'IVA',
  'PERCEP',
];

export function parseICBC(textoCSV) {
  const lineas = textoCSV
    .split(/\r?\n/)
    .filter((l) => l.trim());

  const filas = lineas.slice(2);

  const movimientos = filas
    .map((linea) => {
      const cols = linea.split(';');

      const fechaStr = cols[0];
      const concepto = cols[2];
      const debitoStr = cols[3];
      const creditoStr = cols[4];
      const saldoStr = cols[5];
      const infoComplementaria = cols[6];
      const nombre = cols[14];

      const debito = parseMontoArg(debitoStr);
      const credito = parseMontoArg(creditoStr);

      const tipo = credito > 0 ? 'ingreso' : 'egreso';
      const monto = credito > 0 ? credito : Math.abs(debito);

      const saldo =
        saldoStr && saldoStr.trim()
          ? parseMontoArg(saldoStr)
          : null;

      const nombreLimpio = (nombre || '').trim();
      const conceptoLimpio = (concepto || '').trim();

      const esGastoBancario =
        !nombreLimpio &&
        PALABRAS_GASTOS_BANCARIOS.some((p) =>
          conceptoLimpio.toUpperCase().includes(p)
        );

      return {
        fecha: parseFechaArg(fechaStr),
        detalle:
          conceptoLimpio +
          (infoComplementaria && infoComplementaria.trim()
            ? ` (${infoComplementaria.trim()})`
            : ''),
        tipo,
        monto,
        saldo_informado_banco: saldo,
        texto_original_banco: nombreLimpio,
        categoriaSugerida: esGastoBancario
          ? 'gastos_bancarios'
          : 'sin_clasificar',
      };
    })
    .filter((m) => m.fecha && m.monto > 0);

  movimientos.reverse();

  movimientos.forEach((m, i) => {
    m.orden_original = i;
  });

  return movimientos;
}

const PALABRAS_GASTOS_BANCARIOS_CIUDAD = [
  'L25413CRED',
  'L25413DEBI',
  'LEY 25413',
  'COMISION',
  'MANTENIMIENTO',
  'SELLADO',
  'IVA',
  'PERCEP',
];

function extraerNombreBancoCiudad(descripcion) {
  const texto = (descripcion || '').trim();

  if (!texto) return '';

  const match = texto.match(
    /^TRANSFER(?:ENCIA|\.)\s*\d{8,11}[-\s]*(.*)$/i
  );

  if (!match) return '';

  let nombre = match[1].trim();

  nombre = nombre
    .replace(/\s+-VAR\s*$/i, '')
    .trim();

  if (!/[A-ZÁÉÍÓÚÑ]/i.test(nombre)) {
    return '';
  }

  return nombre;
}

export function parseBancoCiudad(textoCSV) {
  const lineas = textoCSV
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const filas = lineas.slice(1);

  const movimientos = filas
    .map((linea) => {
      const cols = linea.split(';');

      const fechaStr = cols[2];
      const montoStr = cols[3];
      const comprobante = cols[4];
      const descripcion = cols[5];
      const saldoStr = cols[6];

      const montoOriginal = parseMontoArg(montoStr);

      const tipo =
        montoOriginal >= 0
          ? 'ingreso'
          : 'egreso';

      const monto = Math.abs(montoOriginal);

      const saldo =
        saldoStr && saldoStr.trim()
          ? parseMontoArg(saldoStr)
          : null;

      const descripcionLimpia =
        (descripcion || '').trim();

      const nombreLimpio =
        extraerNombreBancoCiudad(descripcionLimpia);

      const esGastoBancario =
        PALABRAS_GASTOS_BANCARIOS_CIUDAD.some((p) =>
          descripcionLimpia.toUpperCase().includes(p)
        );

      return {
        fecha: parseFechaArg(fechaStr),
        detalle: descripcionLimpia,
        tipo,
        monto,
        saldo_informado_banco: saldo,
        texto_original_banco: nombreLimpio,
        categoriaSugerida: esGastoBancario
          ? 'gastos_bancarios'
          : 'sin_clasificar',
        comprobante_banco: (comprobante || '').trim(),
      };
    })
    .filter((m) => m.fecha && m.monto > 0);

  movimientos.forEach((m, i) => {
    m.orden_original = i;
  });

  return movimientos;
}

export const PERFILES_BANCO = {
  ICBC: {
    nombre: 'ICBC',
    parser: parseICBC,
  },

  CIUDAD: {
    nombre: 'Banco Ciudad',
    parser: parseBancoCiudad,
  },
};

// utils/importadorBancos.js (o donde prefieras, es independiente del parser)

function marcarAnteriorAlSaldoInicial(movimientosOrdenCronologico, saldoInicialDeclarado) {
  if (saldoInicialDeclarado == null) {
    return movimientosOrdenCronologico.map((m) => ({ ...m, anteriorAlSaldoInicial: false }));
  }

  let indiceCorte = -1;

  for (let i = 0; i < movimientosOrdenCronologico.length; i++) {
    const m = movimientosOrdenCronologico[i];
    if (m.saldo_informado_banco == null) continue;

    const delta = m.tipo === 'ingreso' ? m.monto : -m.monto;
    const saldoAntes = m.saldo_informado_banco - delta;

    if (Math.abs(saldoAntes - saldoInicialDeclarado) < 0.5) {
      indiceCorte = i;
      break;
    }
  }

  // Si no encontramos ningún punto de coincidencia, no filtramos nada
  // automáticamente (mejor no tocar que descartar mal).
  if (indiceCorte === -1) {
    return movimientosOrdenCronologico.map((m) => ({ ...m, anteriorAlSaldoInicial: false }));
  }

  return movimientosOrdenCronologico.map((m, i) => ({
    ...m,
    anteriorAlSaldoInicial: i < indiceCorte,
  }));
}