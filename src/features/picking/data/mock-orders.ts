import type { FinalSku, Order, OrderLine } from '../types';
import { buildFinalSkus } from '../utils/order-snapshot';
import { MOCK_SKU_CATALOG } from './mock-skus';

const now = Date.now();
const minutes = (m: number) => new Date(now - m * 60 * 1000).toISOString();
const hours = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();
const days = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

/** UIDs alineados con mock-pickers y auth (Semana 1). */
export const MOCK_PICKER_ANA_UID = 'user-picker-1';
export const MOCK_LEAD_CARLOS_UID = 'user-lead-1';
export const MOCK_AUDITOR_LUISA_UID = 'user-auditor-1';

function line(
  sku: string,
  name: string,
  requiredQty: number,
  // 4º parámetro (antes units_per_bundle) se ignora; se mantiene por compatibilidad
  // con las llamadas existentes hasta limpiarlas.
  _legacyUnitsPerBundle?: number,
): OrderLine {
  const catalog = MOCK_SKU_CATALOG.find((s) => s.sku === sku);
  return {
    sku,
    name,
    requiredQty,
    talla: catalog?.talla,
    coCat: catalog?.coCat,
    coSubl: catalog?.coSubl,
    category: catalog?.category,
    brand: catalog?.brand,
    family: catalog?.family,
  };
}

const linesPed502 = [
  line('PW-500-IND', 'Fuente de Poder Industrial 500W', 12, 12),
  line('CBL-HD-2M', 'Cable de Conexión Reforzado', 5, 6),
  line('VRM-X100', 'Módulo Regulador de Voltaje', 2, 4),
];

const linesPed508 = [
  line('MON-LED-24', 'Monitor LED 24" Full HD', 10, 10),
  line('SOP-MON-01', 'Soporte Ajustable para Monitor', 10, 10),
  line('CBL-HDMI-2M', 'Cable HDMI 2.0 (2m)', 8, 8),
];

const linesPed512 = [
  line('BOX-C-05', 'Caja de Cartón Reforzada #5', 20, 20),
  line('FILM-STR-01', 'Film Stretch para Embalaje', 15, 15),
  line('TAPE-IND-01', 'Cinta de Embalaje Industrial', 12, 12),
  line('CORN-CART-01', 'Esquinero Protector de Cartón', 9, 9),
];

const linesPed4424 = [
  line('0101010040015', 'Aceite de Motor 1L', 12, 12),
  line('0201010020007', 'Casco Azul Talla M', 9, 18),
  line('0201010020008', 'Casco Verde Talla S', 12, 18),
  line('0201010020009', 'Guantes de Trabajo', 10, 120),
];

const linesPedLarge = [
  line('CEM-PORT-50', 'Cemento Portland Tipo I (50kg)', 100, 50),
  line('VAR-COR-38', 'Varilla Corrugada 3/8"', 80, 40),
  line('MALLA-ELT-01', 'Malla Electrosoldada 6x6', 30, 15),
  line('PAP-BOND-75', 'Resma Papel Bond 75g (500 hojas)', 50, 25),
  line('BOL-BIC-AZ', 'Bolígrafo BIC Cristal Azul', 40, 20),
  line('ACE-MOT-20W', 'Aceite de Motor 20W-50 (1L)', 25, 12),
];

const linesPed530 = [
  line('TERM-DIG-01', 'Termómetro Digital Infrarrojo', 8, 8),
  line('OXIM-PORT-01', 'Oxímetro de Pulso Portátil', 6, 6),
  line('GEL-ALC-500', 'Gel Antibacterial 500ml', 24, 12),
];

function withFinalSkus(order: Order): FinalSku[] {
  if (order.bultos.length === 0) return [];
  return buildFinalSkus(order, order.bultos.filter((b) => b.status === 'closed'));
}

const linesPedTestPlacas = [
  line('PLACA-MOTO-FORZA', 'Placa Moto Forza', 9, 9),
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-test-placas',
    orderNumber: 'PED-TEST-PLACAS',
    client: 'Cliente Prueba Capacidad',
    status: 'assigned',
    definedBultos: 9,
    hasExtraBultos: false,
    bundlesCreated: 0,
    progressPercentage: 0,
    lastSavedMilestone: 0,
    queuePosition: 1,
    assignedPickerId: MOCK_PICKER_ANA_UID,
    assignedLeadId: null,
    teamPickerUids: [],
    lines: linesPedTestPlacas,
    bultos: [],
    snapshotOriginal: null,
    finalSkus: [],
    auditObservations: [],
    auditResult: null,
    createdAt: minutes(5),
    assignedAt: minutes(1),
    packedAt: null,
  },
  {
    id: 'ord-assigned-new',
    orderNumber: 'PED-530',
    client: 'Farmacia Central',
    status: 'assigned',
    definedBultos: 2,
    hasExtraBultos: false,
    bundlesCreated: 0,
    progressPercentage: 0,
    lastSavedMilestone: 0,
    queuePosition: 2,
    assignedPickerId: MOCK_PICKER_ANA_UID,
    assignedLeadId: null,
    teamPickerUids: [],
    lines: linesPed530,
    bultos: [],
    snapshotOriginal: null,
    finalSkus: [],
    auditObservations: [],
    auditResult: null,
    createdAt: minutes(15),
    assignedAt: minutes(2),
    packedAt: null,
  },
  {
    id: 'ord-assigned-1',
    orderNumber: 'PED-502',
    client: 'Global Tech Solutions',
    status: 'assigned',
    isCritical: true,
    definedBultos: 2,
    hasExtraBultos: false,
    bundlesCreated: 0,
    progressPercentage: 0,
    lastSavedMilestone: 0,
    queuePosition: 3,
    assignedPickerId: MOCK_PICKER_ANA_UID,
    assignedLeadId: null,
    teamPickerUids: [],
    lines: linesPed502,
    bultos: [],
    snapshotOriginal: null,
    finalSkus: [],
    auditObservations: [],
    auditResult: null,
    createdAt: days(2),
    assignedAt: minutes(25),
    packedAt: null,
  },
  {
    id: 'ord-in-progress-1',
    orderNumber: 'PED-508',
    client: 'Apex Retail Group',
    status: 'in_progress',
    definedBultos: 2,
    hasExtraBultos: false,
    bundlesCreated: 1,
    progressPercentage: 50,
    lastSavedMilestone: 50,
    queuePosition: 1,
    assignedPickerId: MOCK_PICKER_ANA_UID,
    assignedLeadId: null,
    teamPickerUids: [],
    lines: linesPed508,
    bultos: [
      {
        id: 'bulto-508-1',
        number: 1,
        status: 'closed',
        items: [
          { id: 'bi-1', sku: 'MON-LED-24', name: 'Monitor LED 24" Full HD', qty: 6 },
        ],
      },
      {
        id: 'bulto-508-2',
        number: 2,
        status: 'open',
        items: [],
      },
    ],
    snapshotOriginal: linesPed508.map((l) => ({ ...l })),
    finalSkus: [],
    auditObservations: [],
    auditResult: null,
    createdAt: days(1),
    assignedAt: minutes(8),
    packedAt: null,
  },
  {
    id: 'ord-to-pack-1',
    orderNumber: 'PED-512',
    client: 'Riverstone Logistics',
    status: 'to_pack',
    definedBultos: 2,
    hasExtraBultos: false,
    bundlesCreated: 2,
    progressPercentage: 100,
    lastSavedMilestone: 100,
    queuePosition: 1,
    assignedPickerId: MOCK_PICKER_ANA_UID,
    assignedLeadId: null,
    teamPickerUids: [],
    lines: linesPed512,
    bultos: [
      {
        id: 'bulto-512-1',
        number: 1,
        status: 'closed',
        items: [
          { id: 'bi-2', sku: 'BOX-C-05', name: 'Caja de Cartón Reforzada #5', qty: 20 },
          { id: 'bi-3', sku: 'FILM-STR-01', name: 'Film Stretch para Embalaje', qty: 15 },
        ],
      },
      {
        id: 'bulto-512-2',
        number: 2,
        status: 'closed',
        items: [
          { id: 'bi-4', sku: 'TAPE-IND-01', name: 'Cinta de Embalaje Industrial', qty: 12 },
          { id: 'bi-5', sku: 'CORN-CART-01', name: 'Esquinero Protector de Cartón', qty: 9 },
        ],
      },
    ],
    snapshotOriginal: linesPed512.map((l) => ({ ...l })),
    finalSkus: [],
    auditObservations: [],
    auditResult: null,
    createdAt: days(3),
    assignedAt: minutes(18),
    packedAt: null,
  },
  {
    id: 'ord-audit-queue-1',
    orderNumber: 'PED-519',
    client: 'Distribuidora Mercantil XYZ',
    status: 'to_pack',
    definedBultos: 1,
    hasExtraBultos: false,
    bundlesCreated: 1,
    progressPercentage: 100,
    lastSavedMilestone: 100,
    queuePosition: 1,
    assignedPickerId: 'picker-maria',
    assignedLeadId: null,
    teamPickerUids: [],
    lines: [
      line('ACE-MOT-20W', 'Aceite de Motor 20W-50 (1L)', 12, 12),
      line('FIL-ACE-UNI', 'Filtro de Aceite Universal', 6, 6),
    ],
    bultos: [
      {
        id: 'bulto-519-1',
        number: 1,
        status: 'closed',
        items: [
          { id: 'bi-6', sku: 'ACE-MOT-20W', name: 'Aceite de Motor 20W-50 (1L)', qty: 12 },
          { id: 'bi-7', sku: 'FIL-ACE-UNI', name: 'Filtro de Aceite Universal', qty: 6 },
        ],
      },
    ],
    snapshotOriginal: [
      line('ACE-MOT-20W', 'Aceite de Motor 20W-50 (1L)', 12, 12),
      line('FIL-ACE-UNI', 'Filtro de Aceite Universal', 6, 6),
    ],
    finalSkus: [],
    auditObservations: [],
    auditResult: null,
    createdAt: days(1),
    assignedAt: hours(20),
    packedAt: null,
  },
  {
    id: 'ord-rejected-1',
    orderNumber: 'PED-523',
    client: 'Librería Universitaria',
    status: 'rejected_review',
    isCritical: true,
    definedBultos: 2,
    hasExtraBultos: true,
    bundlesCreated: 3,
    progressPercentage: 100,
    lastSavedMilestone: 100,
    queuePosition: 1,
    assignedPickerId: MOCK_PICKER_ANA_UID,
    assignedLeadId: null,
    teamPickerUids: [],
    lines: [
      line('PAP-BOND-75', 'Resma Papel Bond 75g (500 hojas)', 150, 50),
      line('BOL-BIC-AZ', 'Bolígrafo BIC Cristal Azul', 100, 50),
      line('CUA-UNI-100', 'Cuaderno Universitario 100 hojas', 50, 25),
    ],
    bultos: [
      {
        id: 'bulto-523-1',
        number: 1,
        status: 'closed',
        items: [
          { id: 'bi-8', sku: 'PAP-BOND-75', name: 'Resma Papel Bond 75g (500 hojas)', qty: 140 },
        ],
      },
      {
        id: 'bulto-523-2',
        number: 2,
        status: 'closed',
        items: [{ id: 'bi-9', sku: 'BOL-BIC-AZ', name: 'Bolígrafo BIC Cristal Azul', qty: 100 }],
      },
      {
        id: 'bulto-523-3',
        number: 3,
        status: 'closed',
        items: [
          { id: 'bi-10', sku: 'CUA-UNI-100', name: 'Cuaderno Universitario 100 hojas', qty: 50 },
        ],
      },
    ],
    snapshotOriginal: [
      line('PAP-BOND-75', 'Resma Papel Bond 75g (500 hojas)', 150, 50),
      line('BOL-BIC-AZ', 'Bolígrafo BIC Cristal Azul', 100, 50),
      line('CUA-UNI-100', 'Cuaderno Universitario 100 hojas', 50, 25),
    ],
    finalSkus: [],
    auditObservations: [
      {
        id: 'obs-1',
        auditorId: MOCK_AUDITOR_LUISA_UID,
        auditorName: 'Luisa Torres',
        text: 'Faltan 10 resmas de papel bond respecto al pedido original. Revisar bulto 1.',
        createdAt: hours(6),
      },
    ],
    auditResult: null,
    createdAt: days(4),
    assignedAt: minutes(18),
    packedAt: hours(10),
  },
  {
    id: 'ord-large-1',
    orderNumber: 'PED-601',
    client: 'Construcciones Ramírez',
    status: 'assigned',
    definedBultos: 4,
    hasExtraBultos: false,
    bundlesCreated: 0,
    progressPercentage: 0,
    lastSavedMilestone: 0,
    queuePosition: 1,
    assignedPickerId: null,
    assignedLeadId: MOCK_LEAD_CARLOS_UID,
    teamPickerUids: [],
    lines: linesPedLarge,
    bultos: [],
    snapshotOriginal: null,
    finalSkus: [],
    auditObservations: [],
    auditResult: null,
    createdAt: hours(2),
    assignedAt: hours(1),
    packedAt: null,
  },
  {
    id: 'ord-audited-1',
    orderNumber: 'PED-515',
    client: 'Farmacia San José',
    status: 'audited',
    definedBultos: 1,
    hasExtraBultos: false,
    bundlesCreated: 1,
    progressPercentage: 100,
    lastSavedMilestone: 100,
    queuePosition: 1,
    assignedPickerId: 'picker-luis',
    assignedLeadId: null,
    teamPickerUids: [],
    lines: [
      line('TERM-DIG-01', 'Termómetro Digital Infrarrojo', 20, 20),
      line('OXIM-PORT-01', 'Oxímetro de Pulso Portátil', 14, 14),
    ],
    bultos: [
      {
        id: 'bulto-515-1',
        number: 1,
        status: 'closed',
        items: [
          { id: 'bi-11', sku: 'TERM-DIG-01', name: 'Termómetro Digital Infrarrojo', qty: 20 },
          { id: 'bi-12', sku: 'OXIM-PORT-01', name: 'Oxímetro de Pulso Portátil', qty: 14 },
        ],
      },
    ],
    snapshotOriginal: [
      line('TERM-DIG-01', 'Termómetro Digital Infrarrojo', 20, 20),
      line('OXIM-PORT-01', 'Oxímetro de Pulso Portátil', 14, 14),
    ],
    finalSkus: [],
    auditObservations: [],
    auditResult: null,
    createdAt: days(5),
    assignedAt: days(4),
    packedAt: null,
  },
  {
    id: 'ord-mock-4424',
    orderNumber: 'PF-4424',
    client: 'Distribuidora Los Andes C.A.',
    status: 'assigned',
    definedBultos: 5,
    hasExtraBultos: false,
    bundlesCreated: 0,
    progressPercentage: 0,
    lastSavedMilestone: 0,
    queuePosition: 4,
    assignedPickerId: MOCK_PICKER_ANA_UID,
    assignedLeadId: null,
    teamPickerUids: [],
    lines: linesPed4424,
    bultos: [],
    snapshotOriginal: null,
    finalSkus: [],
    auditObservations: [],
    auditResult: null,
    createdAt: days(1),
    assignedAt: hours(3),
    packedAt: null,
  },
].map((order) => ({
  ...order,
  finalSkus: order.finalSkus.length > 0 ? order.finalSkus : withFinalSkus(order as Order),
})) as Order[];
