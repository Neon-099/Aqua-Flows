// e:\Aquaflow\backend\src\utils\eta.js
const ETA_MAP = [
  { key: 'Amanoaoac', min: 10, max: 18 },
  { key: 'Aserda', min: 16, max: 29 },
  { key: 'Apaya', min: 12, max: 25 },
  { key: 'Baloling', min: 13, max: 26 },
  { key: 'Coral', min: 15, max: 21 },
  { key: 'Golden', min: 8, max: 12 },
  { key: 'Luyan', min: 11, max: 15 },
  { key: 'Nilombot', min: 12, max: 19 },
  { key: 'Pias', min: 14, max: 20 },
  { key: 'Poblacion', min: 17, max: 23 },
  { key: 'Primicias', min: 13, max: 16 },
  { key: 'Santa Maria', min: 8, max: 18 },
  { key: 'Torres', min: 10, max: 15 }
];

export const computeEtaFromAddress = (address = '') => {
  const lower = String(address || '').toLowerCase();
  const hit = ETA_MAP.find((e) => lower.includes(String(e.key).toLowerCase()));
  if (!hit) return null;

  return {
    eta_minutes_min: hit.min,
    eta_minutes_max: hit.max,
    eta_text: `${hit.min}-${hit.max} minutes`,
    eta_last_calculated_at: new Date(),
  };
};
