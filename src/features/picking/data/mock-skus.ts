/** Catálogo fijo de SKUs para buscador y sustituciones (Semana 1 / fallback). */
export interface MockSku {
  sku: string;
  name: string;
  unitsPerBundle: number;
  category: string;
  brand: string;
  family?: string;
}

export const MOCK_SKU_CATALOG: readonly MockSku[] = [
  {
    sku: 'PW-500-IND',
    name: 'Fuente de Poder Industrial 500W',
    unitsPerBundle: 12,
    category: 'Electrónica',
    brand: 'TechPro',
    family: 'Fuentes',
  },
  {
    sku: 'CBL-HD-2M',
    name: 'Cable de Conexión Reforzado',
    unitsPerBundle: 6,
    category: 'Electrónica',
    brand: 'TechPro',
    family: 'Cables',
  },
  {
    sku: 'VRM-X100',
    name: 'Módulo Regulador de Voltaje',
    unitsPerBundle: 4,
    category: 'Electrónica',
    brand: 'TechPro',
    family: 'Reguladores',
  },
  {
    sku: 'MON-LED-24',
    name: 'Monitor LED 24" Full HD',
    unitsPerBundle: 10,
    category: 'Electrónica',
    brand: 'ViewMax',
    family: 'Monitores',
  },
  {
    sku: 'MON-LED-27',
    name: 'Monitor LED 27" Full HD',
    unitsPerBundle: 8,
    category: 'Electrónica',
    brand: 'ViewMax',
    family: 'Monitores',
  },
  {
    sku: 'SOP-MON-01',
    name: 'Soporte Ajustable para Monitor',
    unitsPerBundle: 10,
    category: 'Electrónica',
    brand: 'ViewMax',
    family: 'Accesorios',
  },
  {
    sku: 'CBL-HDMI-2M',
    name: 'Cable HDMI 2.0 (2m)',
    unitsPerBundle: 8,
    category: 'Electrónica',
    brand: 'ViewMax',
    family: 'Cables',
  },
  {
    sku: 'BOX-C-05',
    name: 'Caja de Cartón Reforzada #5',
    unitsPerBundle: 20,
    category: 'Embalaje',
    brand: 'PackPro',
    family: 'Cajas',
  },
  {
    sku: 'FILM-STR-01',
    name: 'Film Stretch para Embalaje',
    unitsPerBundle: 15,
    category: 'Embalaje',
    brand: 'PackPro',
    family: 'Film',
  },
  {
    sku: 'TAPE-IND-01',
    name: 'Cinta de Embalaje Industrial',
    unitsPerBundle: 12,
    category: 'Embalaje',
    brand: 'PackPro',
    family: 'Cintas',
  },
  {
    sku: 'CORN-CART-01',
    name: 'Esquinero Protector de Cartón',
    unitsPerBundle: 9,
    category: 'Embalaje',
    brand: 'PackPro',
    family: 'Protección',
  },
  {
    sku: 'TERM-DIG-01',
    name: 'Termómetro Digital Infrarrojo',
    unitsPerBundle: 8,
    category: 'Salud',
    brand: 'MediCare',
    family: 'Diagnóstico',
  },
  {
    sku: 'OXIM-PORT-01',
    name: 'Oxímetro de Pulso Portátil',
    unitsPerBundle: 6,
    category: 'Salud',
    brand: 'MediCare',
    family: 'Diagnóstico',
  },
  {
    sku: 'GEL-ALC-500',
    name: 'Gel Antibacterial 500ml',
    unitsPerBundle: 12,
    category: 'Salud',
    brand: 'MediCare',
    family: 'Higiene',
  },
  {
    sku: 'PAP-BOND-75',
    name: 'Resma Papel Bond 75g (500 hojas)',
    unitsPerBundle: 25,
    category: 'Oficina',
    brand: 'OfficeLine',
    family: 'Papel',
  },
  {
    sku: 'BOL-BIC-AZ',
    name: 'Bolígrafo BIC Cristal Azul',
    unitsPerBundle: 20,
    category: 'Oficina',
    brand: 'OfficeLine',
    family: 'Escritura',
  },
  {
    sku: 'ACE-MOT-20W',
    name: 'Aceite de Motor 20W-50 (1L)',
    unitsPerBundle: 12,
    category: 'Lubricantes',
    brand: 'Castrol',
    family: 'Aceites',
  },
  {
    sku: '0201010020010',
    name: 'Casco Azul Talla L',
    unitsPerBundle: 18,
    category: 'Seguridad',
    brand: '3M',
    family: 'Cascos',
  },
  {
    sku: '0201010020011',
    name: 'Casco Azul Talla XL',
    unitsPerBundle: 18,
    category: 'Seguridad',
    brand: '3M',
    family: 'Cascos',
  },
  {
    sku: '0201010020012',
    name: 'Casco Verde Talla M',
    unitsPerBundle: 18,
    category: 'Seguridad',
    brand: '3M',
    family: 'Cascos',
  },
  {
    sku: '0101010040015',
    name: 'Aceite de Motor 1L',
    unitsPerBundle: 12,
    category: 'Lubricantes',
    brand: 'Castrol',
    family: 'Aceites',
  },
  {
    sku: '0201010020007',
    name: 'Casco Azul Talla M',
    unitsPerBundle: 18,
    category: 'Seguridad',
    brand: '3M',
    family: 'Cascos',
  },
  {
    sku: '0201010020008',
    name: 'Casco Verde Talla S',
    unitsPerBundle: 18,
    category: 'Seguridad',
    brand: '3M',
    family: 'Cascos',
  },
  {
    sku: '0201010020009',
    name: 'Guantes de Trabajo',
    unitsPerBundle: 120,
    category: 'Seguridad',
    brand: 'Honeywell',
    family: 'Guantes',
  },
  {
    sku: 'FIL-ACE-UNI',
    name: 'Filtro de Aceite Universal',
    unitsPerBundle: 6,
    category: 'Lubricantes',
    brand: 'Castrol',
    family: 'Filtros',
  },
  {
    sku: 'PLACA-MOTO-FORZA',
    name: 'Placa Moto Forza',
    unitsPerBundle: 9,
    category: 'Repuestos',
    brand: 'Forza',
    family: 'Placas',
  },
  {
    sku: 'TORN-M6-50',
    name: 'Tornillo M6 x 50mm',
    unitsPerBundle: 50,
    category: 'Ferretería',
    brand: 'FixPro',
    family: 'Tornillería',
  },
  {
    sku: 'TUER-M6',
    name: 'Tuerca M6',
    unitsPerBundle: 100,
    category: 'Ferretería',
    brand: 'FixPro',
    family: 'Tornillería',
  },
] as const;

export function mockSkuToArticulo(item: MockSku) {
  return {
    sku: item.sku,
    name: item.name,
    unitsPerBundle: item.unitsPerBundle,
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

export function filterSubstituteSkus(
  catalog: readonly MockSku[],
  original: { sku: string; brand?: string; category?: string; family?: string },
): MockSku[] {
  return catalog.filter((item) => {
    if (item.sku === original.sku) return false;
    if (original.brand && item.brand !== original.brand) return false;
    if (original.category && item.category !== original.category) return false;
    if (original.family && item.family !== original.family) return false;
    return true;
  });
}
