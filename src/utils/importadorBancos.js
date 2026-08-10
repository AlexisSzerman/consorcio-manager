// ============================================================
// Reconocimiento automático de proveedor/unidad
//
// El banco (ICBC confirmado) manda los nombres con letras faltantes
// pero en el orden correcto (ej: "A berto Miche  Anza"). Por eso el
// matching no busca coincidencia exacta ni por distancia de edición:
// verifica si el nombre corto es una SUBSECUENCIA del nombre largo
// (las letras aparecen en el mismo orden, aunque falten algunas).
// ============================================================

function normalizarTexto(str) {
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // solo letras/números, sin espacios ni puntuación
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
  const [corta, larga] = a.length <= b.length ? [a, b] : [b, a];
  if (corta.length < 3) return 0; // evita falsos positivos con nombres muy cortos
  if (!esSubsecuencia(corta, larga)) return 0;
  return corta.length / larga.length; // cobertura: 1.0 = coincide completo
}

// Busca los mejores candidatos (proveedores y unidades) para un nombre del banco.
// Devuelve hasta 3, ordenados por confianza.
export function buscarCandidatos(nombreBanco, proveedores, unidades) {
  const candidatos = [];

  proveedores.forEach((p) => {
    const score = puntajeMatch(nombreBanco, p.nombre);
    if (score >= 0.55) {
      candidatos.push({ tipo: 'proveedor', id: p.id, nombre: p.nombre, score });
    }
  });

  unidades.forEach((u) => {
    const variantes = [u.propietario_nombre, ...(u.alias_reconocimiento || '').split(';')]
      .map((v) => v.trim())
      .filter(Boolean);
    const mejorScore = Math.max(0, ...variantes.map((v) => puntajeMatch(nombreBanco, v)));
    if (mejorScore >= 0.55) {
      candidatos.push({
        tipo: 'unidad',
        id: u.id,
        nombre: `${u.numero_unidad} - ${u.propietario_nombre}`,
        score: mejorScore,
      });
    }
  });

  return candidatos.sort((a, b) => b.score - a.score).slice(0, 3);
}

// ============================================================
// Parser de ICBC (formato confirmado con archivo real)
// ============================================================

function parseMontoArg(str) {
  if (!str) return 0;
  const limpio = str.toString().trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(limpio);
  return isNaN(num) ? 0 : num;
}

function parseFechaArg(str) {
  const [d, m, y] = (str || '').trim().split('/');
  if (!d || !m || !y) return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// Conceptos que son gastos/impuestos del banco, sin contraparte real
const PALABRAS_GASTOS_BANCARIOS = ['IMP S/CRED', 'IMP S/DEB', 'COMISION', 'MANTENIMIENTO', 'SELLADO', 'IVA', 'PERCEP'];

export function parseICBC(textoCSV) {
  const lineas = textoCSV.split(/\r?\n/).filter((l) => l.trim());
  // Línea 1: título de la cuenta. Línea 2: encabezado. El resto: datos.
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
      const saldo = saldoStr && saldoStr.trim() ? parseMontoArg(saldoStr) : null;
      const nombreLimpio = (nombre || '').trim();
      const conceptoLimpio = (concepto || '').trim();

      const esGastoBancario =
        !nombreLimpio && PALABRAS_GASTOS_BANCARIOS.some((p) => conceptoLimpio.toUpperCase().includes(p));

      return {
        fecha: parseFechaArg(fechaStr),
        detalle: conceptoLimpio + (infoComplementaria && infoComplementaria.trim() ? ` (${infoComplementaria.trim()})` : ''),
        tipo,
        monto,
        saldo_informado_banco: saldo,
        texto_original_banco: nombreLimpio,
        categoriaSugerida: esGastoBancario ? 'gastos_bancarios' : 'sin_clasificar',
      };
    })
    .filter((m) => m.fecha && m.monto > 0);

  // El archivo viene del más nuevo al más viejo: lo invertimos a orden cronológico
  movimientos.reverse();
  movimientos.forEach((m, i) => {
    m.orden_original = i;
  });

  return movimientos;
}

// Perfiles de banco disponibles. Cada banco nuevo se suma acá con su propio parser.
export const PERFILES_BANCO = {
  ICBC: { nombre: 'ICBC', parser: parseICBC },
};
