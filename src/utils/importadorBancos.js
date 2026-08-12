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
  'COM ',
  'I V A'
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
  'COM ',
  'I V A'
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

  GALICIA: {
    nombre: 'Banco Galicia',
    parser: parseBancoGalicia,
  },

  ROELA: {
    nombre: 'Banco Roela',
    parser: parseBancoRoela,
  },
};

// utils/importadorBancos.js (o donde prefieras, es independiente del parser)

export function marcarAnteriorAlSaldoInicial(movimientosOrdenCronologico, saldoInicialDeclarado) {
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

const PALABRAS_GASTOS_BANCARIOS_GALICIA = [
  'COM. GESTION',
  'COMISION',
  'MANTENIMIENTO',
  'SELLADO',
  'IVA',
  'IMP. DEB',
  'IMP. CRED',
  'LEY 25413',
  'PERCEP',
  'I V A',
];

export function parseBancoGalicia(textoCSV) {
  const lineas = textoCSV
    .split(/\r?\n/)
    .filter((l) => l.trim());

  // La primera línea es el encabezado.
  // El CSV de Galicia puede tener una columna vacía adicional
  // al final de cada fila.
  const filas = lineas.slice(1);

  const movimientos = filas
    .map((linea) => {
      // Galicia usa ; como separador y los campos vienen entre comillas.
      // Para mantener compatibilidad con el resto del importador,
      // usamos split respetando el formato actual.
      const cols = linea.split(';').map((c) =>
        c.replace(/^"|"$/g, '').trim()
      );

      const fechaStr = cols[0];
      const descripcion = cols[1];

      const debitoStr = cols[3];
      const creditoStr = cols[4];

      const grupoConcepto = cols[5];
      const concepto = cols[6];

      const numeroComprobante = cols[9];

      // En Galicia el nombre del tercero suele estar acá.
      const nombre = cols[10];

      // CUIT / CUIL del tercero.
      const identificacion = cols[11];

      const leyenda3 = cols[12];
      const leyenda4 = cols[13];

      const saldoStr = cols[15];

      const debito = parseMontoArg(debitoStr);
      const credito = parseMontoArg(creditoStr);

      const tipo =
        credito > 0
          ? 'ingreso'
          : 'egreso';

      const monto =
        credito > 0
          ? credito
          : Math.abs(debito);

      const saldo =
        saldoStr && saldoStr.trim()
          ? parseMontoArg(saldoStr)
          : null;

      const fecha = parseFechaArg(fechaStr);

      const descripcionLimpia =
        (descripcion || '').trim();

      const grupoConceptoLimpio =
        (grupoConcepto || '').trim();

      const conceptoLimpio =
        (concepto || '').trim();

      const nombreLimpio =
        (nombre || '').trim();

      const identificacionLimpia =
        (identificacion || '').trim();

      const leyenda3Limpia =
        (leyenda3 || '').trim();

      const leyenda4Limpia =
        (leyenda4 || '').trim();


      const partesDetalle = [
        descripcionLimpia,
        conceptoLimpio,
      ].filter(Boolean);

      if (nombreLimpio) {
        partesDetalle.push(nombreLimpio);
      }

      if (leyenda3Limpia) {
        partesDetalle.push(leyenda3Limpia);
      }

      if (leyenda4Limpia) {
        partesDetalle.push(leyenda4Limpia);
      }

      const detalle = partesDetalle.join(' - ');


      const textoGastoBancario = [
        descripcionLimpia,
        conceptoLimpio,
        grupoConceptoLimpio,
      ]
        .join(' ')
        .toUpperCase();

      const esGastoBancario =
        PALABRAS_GASTOS_BANCARIOS_GALICIA.some((p) =>
          textoGastoBancario.includes(p)
        );

      return {
        fecha,
        detalle,

        tipo,
        monto,

        saldo_informado_banco: saldo,

        texto_original_banco: nombreLimpio,

        categoriaSugerida: esGastoBancario
          ? 'gastos_bancarios'
          : 'sin_clasificar',

        comprobante_banco:
          numeroComprobante || '',

        identificacion_banco:
          identificacionLimpia,

        grupo_concepto_banco:
          grupoConceptoLimpio,

        concepto_banco:
          conceptoLimpio,
      };
    })
    .filter((m) =>
      m.fecha &&
      m.monto > 0
    );

  movimientos.forEach((m, i) => {
    m.orden_original = i;
  });

  return movimientos;
}

const PALABRAS_GASTOS_BANCARIOS_ROELA = [
  'IMPUESTO LEY 25413',
  'LEY 25413',
  'COMISION',
  'COM.',
  'MANTENIMIENTO',
  'SELLADO',
  'I.V.A.',
  'IVA',
  'PERCEP',
];

function extraerNombreBancoRoela(descripcion) {
  const texto = (descripcion || '').trim();

  if (!texto) return '';

  /*
   * Ejemplos del Banco Roela:
   *
   * TRA D T 23272161739-ARCE,JUAN FRANC
   * TRA D T 27254123456-PEREZ,JUAN
   *
   * Nos quedamos con todo lo que aparece después
   * del CUIT/CUIL.
   */
  const match = texto.match(
    /^TRA\s+D\s+T\s+\d{8,11}-(.+)$/i
  );

  if (match) {
    return match[1].trim();
  }

  /*
   * Algunas transferencias pueden venir con otra
   * descripción pero manteniendo el patrón:
   *
   * ... CUIT-NOMBRE
   */
  const matchGenerico = texto.match(
    /(?:^|\s)\d{8,11}-(.+)$/i
  );

  if (matchGenerico) {
    const nombre = matchGenerico[1].trim();

    if (/[A-ZÁÉÍÓÚÑ]/i.test(nombre)) {
      return nombre;
    }
  }

  return '';
}

export function parseBancoRoela(textoCSV) {
  const lineas = textoCSV
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // La primera línea contiene los encabezados.
  const filas = lineas.slice(1);

  const movimientos = filas
    .map((linea) => {
      const cols = linea.split(';').map((c) =>
        c
          .replace(/^"|"$/g, '')
          .trim()
      );

      const cuenta = cols[0];
      const cuitCuenta = cols[1];
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
        extraerNombreBancoRoela(
          descripcionLimpia
        );

      const textoGastoBancario =
        descripcionLimpia.toUpperCase();

      const esGastoBancario =
        PALABRAS_GASTOS_BANCARIOS_ROELA.some(
          (p) =>
            textoGastoBancario.includes(p)
        );

      return {
        fecha: parseFechaArg(fechaStr),

        detalle: descripcionLimpia,

        tipo,

        monto,

        saldo_informado_banco: saldo,

        texto_original_banco:
          nombreLimpio,

        categoriaSugerida:
          esGastoBancario
            ? 'gastos_bancarios'
            : 'sin_clasificar',

        comprobante_banco:
          (comprobante || '').trim(),

        cuenta_banco:
          (cuenta || '').trim(),

        cuit_cuenta_banco:
          (cuitCuenta || '').trim(),
      };
    })
    .filter(
      (m) =>
        m.fecha &&
        m.monto > 0
    );

  movimientos.forEach((m, i) => {
    m.orden_original = i;
  });

  return movimientos;
}