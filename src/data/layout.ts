export type Diet = 'veg' | 'nonveg' | 'jain'
export type ZoneType = 'cooking' | 'prep' | 'storage' | 'room' | 'packing' | 'washing'
export type Side = 'n' | 's' | 'e' | 'w'

export interface Zone {
  id: string
  name: string
  type: ZoneType
  x: number // metres, west edge
  z: number // metres, north edge
  w: number
  d: number
  diet?: Diet
  door?: Side
  walled?: boolean
}

export const S = 0.0316 // metres per plan pixel
// Outer shell, inferred from the fire-exit positions and the outermost zones (plan px 44,35 to 806,433)
export const BX0 = 44 * S
export const BZ0 = 35 * S
export const BX1 = 806 * S
export const BZ1 = 433 * S
export const BW = BX1 - BX0 // ~24.1 m
export const BD = BZ1 - BZ0 // ~12.6 m
export const CX = (BX0 + BX1) / 2
export const CZ = (BZ0 + BZ1) / 2
export const CEIL = 3.8 // ~12.5 ft
export const DIET_COLOR: Record<Diet, string> = { veg: '#2E9E4F', nonveg: '#D13B3B', jain: '#E8A317' }
export const DIET_LABEL: Record<Diet, string> = { veg: 'Veg', nonveg: 'Non-Veg', jain: 'Jain' }

const r = (
  id: string, name: string, type: ZoneType,
  x1: number, y1: number, x2: number, y2: number,
  extra: Partial<Zone> = {},
): Zone => ({
  id, name, type,
  x: +(x1 * S).toFixed(2), z: +(y1 * S).toFixed(2),
  w: +((x2 - x1) * S).toFixed(2), d: +((y2 - y1) * S).toFixed(2),
  ...(type === 'room' ? { walled: true } : {}),
  ...extra,
})

// Coordinates are the plan pixels from the brief (x1,y1,x2,y2).
export const LAYOUT: Zone[] = [
  r('wash-a', 'Utensils Washing', 'washing', 85, 60, 225, 95),
  r('wash-b', 'Utensils Washing (Return)', 'washing', 47, 60, 85, 185),
  r('cleaning', 'Cleaning Zone', 'room', 222, 62, 295, 125),
  r('receiving', 'Receiving Materials', 'storage', 297, 66, 385, 95),
  r('lift', 'Service Lift', 'room', 338, 38, 385, 65, { door: 's' }),
  r('lockers', 'Staff Lockers / Rest Area', 'room', 430, 58, 562, 170, { door: 'n' }),
  r('changing', 'Changing Rooms & Washrooms', 'room', 565, 58, 700, 170),
  r('electrical', 'Electrical Room', 'room', 700, 60, 800, 98, { door: 'w' }),
  r('it', 'IT Room', 'room', 700, 105, 800, 138, { door: 'w' }),
  r('dry', 'Dry Storage', 'storage', 165, 150, 272, 245, { walled: true, door: 'w' }),
  r('freezer', 'Freezer (Non-Veg only)', 'room', 275, 150, 358, 200, { diet: 'nonveg', door: 's' }),
  r('cold', 'Cold Storage (Veg + Jain)', 'room', 275, 202, 358, 247, { door: 's' }),
  r('cook-annex', 'Cooking Line (Annex)', 'cooking', 133, 150, 163, 245),
  r('jain-cook', 'Jain Cooking', 'cooking', 48, 265, 80, 425, { diet: 'jain' }),
  r('veg-cook', 'Veg Cooking', 'cooking', 85, 400, 240, 425, { diet: 'veg' }),
  r('nv-cook', 'Non-Veg Cooking', 'cooking', 245, 400, 400, 425, { diet: 'nonveg' }),
  r('jain-prep', 'Jain Prep Table', 'prep', 132, 270, 195, 298, { diet: 'jain' }),
  r('veg-prep', 'Veg Prep Table', 'prep', 197, 270, 358, 298, { diet: 'veg' }),
  r('nv-prep', 'Non-Veg Prep Table', 'prep', 132, 327, 358, 355, { diet: 'nonveg' }),
  r('waste', 'Waste Zone', 'storage', 482, 218, 706, 260, { walled: true, door: 'w' }),
  r('pack-store', 'Packing Storage', 'storage', 482, 282, 597, 353),
  r('bulk', 'Bulk Storage', 'storage', 600, 282, 706, 353),
  r('qc', 'Quality Check', 'packing', 453, 400, 570, 428),
  r('packing', 'Packing Zone', 'packing', 572, 402, 803, 430),
  r('dispatch', 'Order Checking / Dispatch', 'packing', 767, 222, 800, 397),
]

export const FIRE_EXITS: { id: string; x: number; z: number; side: Side }[] = [
  { id: 'Left exit', x: BX0, z: 200 * S, side: 'w' },
  { id: 'Bottom exit', x: 425 * S, z: BZ1, side: 's' },
  { id: 'Right exit', x: BX1, z: 150 * S, side: 'e' },
]

export const sqft = (z: Zone) => z.w * z.d * 10.7639

export const TYPE_INFO: Record<ZoneType, { purpose: string; equipment: string[]; heads: string[] }> = {
  cooking: {
    purpose: 'Dedicated cooking line with its own burners, hood and utensils.',
    equipment: ['SS 304 gas range', 'Exhaust hood + duct run', 'SS splashback', 'Drain channel'],
    heads: ['Cooking', 'Exhaust', 'Gas', 'SS fabrication'],
  },
  prep: {
    purpose: 'Cutting and preparation, with boards and knives kept for one diet only.',
    equipment: ['SS work table with undershelf', 'Colour-coded chopping boards', 'Knife and utensil rack'],
    heads: ['SS fabrication', 'Hygiene'],
  },
  storage: {
    purpose: 'Racked storage for ingredients, packaging or waste, kept off the floor.',
    equipment: ['Wire racks', 'Colour-coded crates', 'Floor markings'],
    heads: ['SS fabrication', 'Refrigeration', 'Walk-in cold room'],
  },
  room: {
    purpose: 'Enclosed room with a door, tiled walls and its own services.',
    equipment: ['Partition walls', 'Door with frame and handle', 'Room-specific fittings'],
    heads: ['Partitions', 'Electrical', 'Walls and ceiling'],
  },
  packing: {
    purpose: 'Orders are checked, packed and handed to riders.',
    equipment: ['SS packing counter', 'Packing cartons', 'Dispatch window'],
    heads: ['Packing/IT', 'SS fabrication'],
  },
  washing: {
    purpose: 'Washing and sanitising utensils, away from the cooking lines.',
    equipment: ['Double-basin SS sink', 'Taps and spray rinse', 'Drain channel'],
    heads: ['Plumbing', 'SS fabrication'],
  },
}

export const FLOW: Record<Diet, string[]> = {
  veg: ['receiving', 'dry', 'veg-prep', 'veg-cook', 'packing', 'dispatch'],
  nonveg: ['receiving', 'freezer', 'nv-prep', 'nv-cook', 'qc', 'dispatch'],
  jain: ['receiving', 'cold', 'jain-prep', 'jain-cook', 'qc', 'dispatch'],
}

export const TOUR = ['receiving', 'dry', 'cold', 'freezer', 'veg-prep', 'jain-cook', 'veg-cook', 'nv-cook', 'qc', 'packing', 'dispatch', 'waste', 'lockers']

export const SHORT: Record<string, string> = {
  'wash-a': 'Utensil Washing', 'wash-b': 'Washing (Return)', cleaning: 'Cleaning', receiving: 'Receiving',
  lift: 'Service Lift', lockers: 'Staff Lockers', changing: 'Changing / Washrooms', electrical: 'Electrical',
  it: 'IT Room', dry: 'Dry Storage', freezer: 'Freezer', cold: 'Cold Storage', 'cook-annex': 'Cooking Annex',
  'jain-cook': 'Jain Cooking', 'veg-cook': 'Veg Cooking', 'nv-cook': 'Non-Veg Cooking',
  'jain-prep': 'Jain Prep', 'veg-prep': 'Veg Prep', 'nv-prep': 'Non-Veg Prep', waste: 'Waste',
  'pack-store': 'Packing Storage', bulk: 'Bulk Storage', qc: 'Quality Check', packing: 'Packing', dispatch: 'Dispatch',
}
