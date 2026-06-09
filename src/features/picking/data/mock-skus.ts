/** Catálogo fijo de SKUs para buscador de armado de bultos (Semana 1). */
export interface MockSku {
  sku: string;
  name: string;
}

export const MOCK_SKU_CATALOG: readonly MockSku[] = [
  { sku: 'PW-500-IND', name: 'Fuente de Poder Industrial 500W' },
  { sku: 'CBL-HD-2M', name: 'Cable de Conexión Reforzado' },
  { sku: 'VRM-X100', name: 'Módulo Regulador de Voltaje' },
  { sku: 'MON-LED-24', name: 'Monitor LED 24" Full HD' },
  { sku: 'SOP-MON-01', name: 'Soporte Ajustable para Monitor' },
  { sku: 'CBL-HDMI-2M', name: 'Cable HDMI 2.0 (2m)' },
  { sku: 'BOX-C-05', name: 'Caja de Cartón Reforzada #5' },
  { sku: 'FILM-STR-01', name: 'Film Stretch para Embalaje' },
  { sku: 'TAPE-IND-01', name: 'Cinta de Embalaje Industrial' },
  { sku: 'CORN-CART-01', name: 'Esquinero Protector de Cartón' },
  { sku: 'TERM-DIG-01', name: 'Termómetro Digital Infrarrojo' },
  { sku: 'OXIM-PORT-01', name: 'Oxímetro de Pulso Portátil' },
  { sku: 'PAP-BOND-75', name: 'Resma Papel Bond 75g (500 hojas)' },
  { sku: 'BOL-BIC-AZ', name: 'Bolígrafo BIC Cristal Azul' },
  { sku: 'ACE-MOT-20W', name: 'Aceite de Motor 20W-50 (1L)' },
] as const;
