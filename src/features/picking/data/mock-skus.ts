/** Catálogo fijo de SKUs para buscador y sustituciones (Semana 1 / fallback). */
export interface MockSku {
  sku: string;
  name: string;
  /** Talla del artículo. Solo los artículos con talla son sustituibles. */
  talla?: string;
  /** Categoría Profit (`co_cat`) — filtro de sustitución. */
  coCat?: string;
  /** Sublínea Profit (`co_subl`) — filtro de sustitución. */
  coSubl?: string;
  category: string;
  brand: string;
  family?: string;
}

export const MOCK_SKU_CATALOG: readonly MockSku[] = [
  {
    sku: 'PW-500-IND',
    name: 'Fuente de Poder Industrial 500W',
    category: 'Electrónica',
    brand: 'TechPro',
    family: 'Fuentes',
  },
  {
    sku: 'CBL-HD-2M',
    name: 'Cable de Conexión Reforzado',
    category: 'Electrónica',
    brand: 'TechPro',
    family: 'Cables',
  },
  {
    sku: 'VRM-X100',
    name: 'Módulo Regulador de Voltaje',
    category: 'Electrónica',
    brand: 'TechPro',
    family: 'Reguladores',
  },
  {
    sku: 'MON-LED-24',
    name: 'Monitor LED 24" Full HD',
    category: 'Electrónica',
    brand: 'ViewMax',
    family: 'Monitores',
  },
  {
    sku: 'MON-LED-27',
    name: 'Monitor LED 27" Full HD',
    category: 'Electrónica',
    brand: 'ViewMax',
    family: 'Monitores',
  },
  {
    sku: 'SOP-MON-01',
    name: 'Soporte Ajustable para Monitor',
    category: 'Electrónica',
    brand: 'ViewMax',
    family: 'Accesorios',
  },
  {
    sku: 'CBL-HDMI-2M',
    name: 'Cable HDMI 2.0 (2m)',
    category: 'Electrónica',
    brand: 'ViewMax',
    family: 'Cables',
  },
  {
    sku: 'BOX-C-05',
    name: 'Caja de Cartón Reforzada #5',
    category: 'Embalaje',
    brand: 'PackPro',
    family: 'Cajas',
  },
  {
    sku: 'FILM-STR-01',
    name: 'Film Stretch para Embalaje',
    category: 'Embalaje',
    brand: 'PackPro',
    family: 'Film',
  },
  {
    sku: 'TAPE-IND-01',
    name: 'Cinta de Embalaje Industrial',
    category: 'Embalaje',
    brand: 'PackPro',
    family: 'Cintas',
  },
  {
    sku: 'CORN-CART-01',
    name: 'Esquinero Protector de Cartón',
    category: 'Embalaje',
    brand: 'PackPro',
    family: 'Protección',
  },
  {
    sku: 'TERM-DIG-01',
    name: 'Termómetro Digital Infrarrojo',
    category: 'Salud',
    brand: 'MediCare',
    family: 'Diagnóstico',
  },
  {
    sku: 'OXIM-PORT-01',
    name: 'Oxímetro de Pulso Portátil',
    category: 'Salud',
    brand: 'MediCare',
    family: 'Diagnóstico',
  },
  {
    sku: 'GEL-ALC-500',
    name: 'Gel Antibacterial 500ml',
    category: 'Salud',
    brand: 'MediCare',
    family: 'Higiene',
  },
  {
    sku: 'PAP-BOND-75',
    name: 'Resma Papel Bond 75g (500 hojas)',
    category: 'Oficina',
    brand: 'OfficeLine',
    family: 'Papel',
  },
  {
    sku: 'BOL-BIC-AZ',
    name: 'Bolígrafo BIC Cristal Azul',
    category: 'Oficina',
    brand: 'OfficeLine',
    family: 'Escritura',
  },
  {
    sku: 'ACE-MOT-20W',
    name: 'Aceite de Motor 20W-50 (1L)',
    category: 'Lubricantes',
    brand: 'Castrol',
    family: 'Aceites',
  },
  {
    sku: '0201010020010',
    name: 'Casco Azul Talla L',
    talla: 'L',
    category: 'Seguridad',
    brand: '3M',
    coCat: 'ACCE',
    coSubl: 'CASC',
    family: 'Cascos',
  },
  {
    sku: '0201010020011',
    name: 'Casco Azul Talla XL',
    talla: 'XL',
    category: 'Seguridad',
    brand: '3M',
    coCat: 'ACCE',
    coSubl: 'CASC',
    family: 'Cascos',
  },
  {
    sku: '0201010020012',
    name: 'Casco Verde Talla M',
    talla: 'M',
    category: 'Seguridad',
    brand: '3M',
    coCat: 'ACCE',
    coSubl: 'CASC',
    family: 'Cascos',
  },
  {
    sku: '0201010020013',
    name: 'Casco Rojo Talla S',
    talla: 'S',
    category: 'Seguridad',
    brand: '3M',
    coCat: 'ACCE',
    coSubl: 'CASC',
    family: 'Cascos',
  },
  {
    sku: '0101010040015',
    name: 'Aceite de Motor 1L',
    category: 'Lubricantes',
    brand: 'Castrol',
    family: 'Aceites',
  },
  {
    sku: '0201010020007',
    name: 'Casco Azul Talla M',
    talla: 'M',
    category: 'Seguridad',
    brand: '3M',
    coCat: 'ACCE',
    coSubl: 'CASC',
    family: 'Cascos',
  },
  {
    sku: '0201010020008',
    name: 'Casco Verde Talla S',
    talla: 'S',
    category: 'Seguridad',
    brand: '3M',
    coCat: 'ACCE',
    coSubl: 'CASC',
    family: 'Cascos',
  },
  {
    sku: '0201010020009',
    name: 'Guantes de Trabajo',
    category: 'Seguridad',
    brand: 'Honeywell',
    family: 'Guantes',
  },
  {
    sku: 'FIL-ACE-UNI',
    name: 'Filtro de Aceite Universal',
    category: 'Lubricantes',
    brand: 'Castrol',
    family: 'Filtros',
  },
  {
    sku: 'PLACA-MOTO-FORZA',
    name: 'Placa Moto Forza',
    category: 'Repuestos',
    brand: 'Forza',
    family: 'Placas',
  },
  {
    sku: 'TORN-M6-50',
    name: 'Tornillo M6 x 50mm',
    category: 'Ferretería',
    brand: 'FixPro',
    family: 'Tornillería',
  },
  {
    sku: 'TUER-M6',
    name: 'Tuerca M6',
    category: 'Ferretería',
    brand: 'FixPro',
    family: 'Tornillería',
  },
] as const;

export function mockSkuToArticulo(item: MockSku) {
  return {
    sku: item.sku,
    name: item.name,
    talla: item.talla,
    coCat: item.coCat,
    coSubl: item.coSubl,
    category: item.category,
    brand: item.brand,
    family: item.family,
  };
}

export function getMockArticuloBySku(sku: string) {
  const item = MOCK_SKU_CATALOG.find((m) => m.sku === sku);
  return item ? mockSkuToArticulo(item) : undefined;
}

export function getMockArticulosForSkus(skus: string[]) {
  const map: Record<string, ReturnType<typeof mockSkuToArticulo>> = {};
  for (const sku of skus) {
    const articulo = getMockArticuloBySku(sku);
    if (articulo) map[sku] = articulo;
  }
  return map;
}

export function searchMockArticulos(query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return MOCK_SKU_CATALOG.filter(
    (item) =>
      item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q),
  ).map(mockSkuToArticulo);
}

/**
 * Candidatos de sustitución:
 *  - Gate: el original DEBE tener `talla` (sin talla no es sustituible → lista vacía).
 *  - Filtro: mismo `co_cat` y mismo `co_subl` que el original (la talla NO filtra:
 *    justamente se sustituye por otra talla en existencia).
 */
export function filterSubstituteSkus(
  catalog: readonly MockSku[],
  original: { sku: string; talla?: string; coCat?: string; coSubl?: string },
): MockSku[] {
  if (!original.talla) return [];
  return catalog.filter(
    (item) =>
      item.sku !== original.sku &&
      item.coCat === original.coCat &&
      item.coSubl === original.coSubl,
  );
}
