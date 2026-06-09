import type { Order } from '../types';

const now = Date.now();
const minutes = (m: number) => new Date(now - m * 60 * 1000).toISOString();
const hours = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();
const days = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

/** UIDs alineados con mock-pickers y auth (Semana 1). */
export const MOCK_PICKER_ANA_UID = 'user-picker-1';
export const MOCK_LEAD_CARLOS_UID = 'user-lead-1';
export const MOCK_AUDITOR_LUISA_UID = 'user-auditor-1';

const linesPed502 = [
  { sku: 'PW-500-IND', name: 'Fuente de Poder Industrial 500W', requiredQty: 12 },
  { sku: 'CBL-HD-2M', name: 'Cable de Conexión Reforzado', requiredQty: 5 },
  { sku: 'VRM-X100', name: 'Módulo Regulador de Voltaje', requiredQty: 2 },
];

const linesPed508 = [
  { sku: 'MON-LED-24', name: 'Monitor LED 24" Full HD', requiredQty: 10 },
  { sku: 'SOP-MON-01', name: 'Soporte Ajustable para Monitor', requiredQty: 10 },
  { sku: 'CBL-HDMI-2M', name: 'Cable HDMI 2.0 (2m)', requiredQty: 8 },
];

const linesPed512 = [
  { sku: 'BOX-C-05', name: 'Caja de Cartón Reforzada #5', requiredQty: 20 },
  { sku: 'FILM-STR-01', name: 'Film Stretch para Embalaje', requiredQty: 15 },
  { sku: 'TAPE-IND-01', name: 'Cinta de Embalaje Industrial', requiredQty: 12 },
  { sku: 'CORN-CART-01', name: 'Esquinero Protector de Cartón', requiredQty: 9 },
];

const linesPedLarge = [
  { sku: 'CEM-PORT-50', name: 'Cemento Portland Tipo I (50kg)', requiredQty: 100 },
  { sku: 'VAR-COR-38', name: 'Varilla Corrugada 3/8"', requiredQty: 80 },
  { sku: 'MALLA-ELT-01', name: 'Malla Electrosoldada 6x6', requiredQty: 30 },
  { sku: 'PAP-BOND-75', name: 'Resma Papel Bond 75g (500 hojas)', requiredQty: 50 },
  { sku: 'BOL-BIC-AZ', name: 'Bolígrafo BIC Cristal Azul', requiredQty: 40 },
  { sku: 'ACE-MOT-20W', name: 'Aceite de Motor 20W-50 (1L)', requiredQty: 25 },
];

const linesPed530 = [
  { sku: 'TERM-DIG-01', name: 'Termómetro Digital Infrarrojo', requiredQty: 8 },
  { sku: 'OXIM-PORT-01', name: 'Oxímetro de Pulso Portátil', requiredQty: 6 },
  { sku: 'GEL-ALC-500', name: 'Gel Antibacterial 500ml', requiredQty: 24 },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-assigned-new',
    orderNumber: 'PED-530',
    client: 'Farmacia Central',
    status: 'assigned',
    definedBultos: 2,
    hasExtraBultos: false,
    assignedPickerId: MOCK_PICKER_ANA_UID,
    assignedLeadId: null,
    teamId: null,
    lines: linesPed530,
    bultos: [],
    snapshotOriginal: null,
    finalState: null,
    auditObservations: [],
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
    assignedPickerId: MOCK_PICKER_ANA_UID,
    assignedLeadId: null,
    teamId: null,
    lines: linesPed502,
    bultos: [],
    snapshotOriginal: null,
    finalState: null,
    auditObservations: [],
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
    assignedPickerId: MOCK_PICKER_ANA_UID,
    assignedLeadId: null,
    teamId: null,
    lines: linesPed508,
    bultos: [
      {
        id: 'bulto-508-1',
        number: 1,
        status: 'closed',
        items: [
          {
            id: 'bi-1',
            sku: 'MON-LED-24',
            name: 'Monitor LED 24" Full HD',
            qty: 6,
          },
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
    finalState: null,
    auditObservations: [],
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
    assignedPickerId: MOCK_PICKER_ANA_UID,
    assignedLeadId: null,
    teamId: null,
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
    finalState: [
      { id: 'fs-1', sku: 'BOX-C-05', name: 'Caja de Cartón Reforzada #5', qty: 20 },
      { id: 'fs-2', sku: 'FILM-STR-01', name: 'Film Stretch para Embalaje', qty: 15 },
      { id: 'fs-3', sku: 'TAPE-IND-01', name: 'Cinta de Embalaje Industrial', qty: 12 },
      { id: 'fs-4', sku: 'CORN-CART-01', name: 'Esquinero Protector de Cartón', qty: 9 },
    ],
    auditObservations: [],
    createdAt: days(3),
    assignedAt: minutes(18),
    packedAt: null,
  },
  {
    id: 'ord-packed-1',
    orderNumber: 'PED-519',
    client: 'Distribuidora Mercantil XYZ',
    status: 'packed',
    definedBultos: 1,
    hasExtraBultos: false,
    assignedPickerId: 'picker-maria',
    assignedLeadId: null,
    teamId: null,
    lines: [
      { sku: 'ACE-MOT-20W', name: 'Aceite de Motor 20W-50 (1L)', requiredQty: 12 },
      { sku: 'FIL-ACE-UNI', name: 'Filtro de Aceite Universal', requiredQty: 6 },
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
      { sku: 'ACE-MOT-20W', name: 'Aceite de Motor 20W-50 (1L)', requiredQty: 12 },
      { sku: 'FIL-ACE-UNI', name: 'Filtro de Aceite Universal', requiredQty: 6 },
    ],
    finalState: [
      { id: 'fs-5', sku: 'ACE-MOT-20W', name: 'Aceite de Motor 20W-50 (1L)', qty: 12 },
      { id: 'fs-6', sku: 'FIL-ACE-UNI', name: 'Filtro de Aceite Universal', qty: 6 },
    ],
    auditObservations: [],
    createdAt: days(1),
    assignedAt: hours(20),
    packedAt: hours(2),
  },
  {
    id: 'ord-rejected-1',
    orderNumber: 'PED-523',
    client: 'Librería Universitaria',
    status: 'rejected_review',
    isCritical: true,
    definedBultos: 2,
    hasExtraBultos: true,
    assignedPickerId: MOCK_PICKER_ANA_UID,
    assignedLeadId: null,
    teamId: null,
    lines: [
      { sku: 'PAP-BOND-75', name: 'Resma Papel Bond 75g (500 hojas)', requiredQty: 150 },
      { sku: 'BOL-BIC-AZ', name: 'Bolígrafo BIC Cristal Azul', requiredQty: 100 },
      { sku: 'CUA-UNI-100', name: 'Cuaderno Universitario 100 hojas', requiredQty: 50 },
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
        items: [
          { id: 'bi-9', sku: 'BOL-BIC-AZ', name: 'Bolígrafo BIC Cristal Azul', qty: 100 },
        ],
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
      { sku: 'PAP-BOND-75', name: 'Resma Papel Bond 75g (500 hojas)', requiredQty: 150 },
      { sku: 'BOL-BIC-AZ', name: 'Bolígrafo BIC Cristal Azul', requiredQty: 100 },
      { sku: 'CUA-UNI-100', name: 'Cuaderno Universitario 100 hojas', requiredQty: 50 },
    ],
    finalState: [
      { id: 'fs-7', sku: 'PAP-BOND-75', name: 'Resma Papel Bond 75g (500 hojas)', qty: 140 },
      { id: 'fs-8', sku: 'BOL-BIC-AZ', name: 'Bolígrafo BIC Cristal Azul', qty: 100 },
      { id: 'fs-9', sku: 'CUA-UNI-100', name: 'Cuaderno Universitario 100 hojas', qty: 50 },
    ],
    auditObservations: [
      {
        id: 'obs-1',
        auditorId: MOCK_AUDITOR_LUISA_UID,
        auditorName: 'Luisa Torres',
        text: 'Faltan 10 resmas de papel bond respecto al pedido original. Revisar bulto 1.',
        createdAt: hours(6),
      },
    ],
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
    assignedPickerId: null,
    assignedLeadId: MOCK_LEAD_CARLOS_UID,
    teamId: null,
    lines: linesPedLarge,
    bultos: [],
    snapshotOriginal: null,
    finalState: null,
    auditObservations: [],
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
    assignedPickerId: 'picker-luis',
    assignedLeadId: null,
    teamId: null,
    lines: [
      { sku: 'TERM-DIG-01', name: 'Termómetro Digital Infrarrojo', requiredQty: 20 },
      { sku: 'OXIM-PORT-01', name: 'Oxímetro de Pulso Portátil', requiredQty: 14 },
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
      { sku: 'TERM-DIG-01', name: 'Termómetro Digital Infrarrojo', requiredQty: 20 },
      { sku: 'OXIM-PORT-01', name: 'Oxímetro de Pulso Portátil', requiredQty: 14 },
    ],
    finalState: [
      { id: 'fs-10', sku: 'TERM-DIG-01', name: 'Termómetro Digital Infrarrojo', qty: 20 },
      { id: 'fs-11', sku: 'OXIM-PORT-01', name: 'Oxímetro de Pulso Portátil', qty: 14 },
    ],
    auditObservations: [],
    createdAt: days(5),
    assignedAt: days(4),
    packedAt: days(3),
  },
];
