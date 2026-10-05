export interface Head { name: string; lakh: number; equipment: boolean }
// Rs lakh. `equipment` marks heads where refurbished items are an option.
export const HEADS: Head[] = [
  { name: 'Design / approvals', lakh: 0.33, equipment: false },
  { name: 'Civil and flooring', lakh: 2.0, equipment: false },
  { name: 'Walls and ceiling', lakh: 1.08, equipment: false },
  { name: 'Partitions', lakh: 1.14, equipment: false },
  { name: 'SS fabrication', lakh: 2.07, equipment: true },
  { name: 'Cooking', lakh: 4.7, equipment: true },
  { name: 'Refrigeration', lakh: 1.3, equipment: true },
  { name: 'Exhaust', lakh: 4.19, equipment: false },
  { name: 'Plumbing', lakh: 1.22, equipment: false },
  { name: 'Electrical', lakh: 2.18, equipment: false },
  { name: 'Gas', lakh: 0.5, equipment: false },
  { name: 'Fire and safety', lakh: 0.97, equipment: false },
  { name: 'Staff', lakh: 0.3, equipment: false },
  { name: 'Packing/IT', lakh: 0.78, equipment: true },
  { name: 'Hygiene', lakh: 0.33, equipment: false },
  { name: 'Branding', lakh: 0.1, equipment: false },
  { name: 'Walk-in cold room', lakh: 1.4, equipment: true },
]
export const DESIGN_FEE = 2.0
export const CONTINGENCY = 1.51
// Illustrative assumption only (not from a quote): refurbished equipment ~30% cheaper.
export const REFURB_FACTOR = 0.7
export const fitOut = (refurb: boolean) =>
  HEADS.reduce((s, h) => s + (refurb && h.equipment ? h.lakh * REFURB_FACTOR : h.lakh), 0)
