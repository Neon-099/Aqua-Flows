// e:\Aquaflow\backend\src\utils\eta.js
const ETA_MAP = [
  { key: 'mapandan', min: 10, max: 13 },
  { key: 'aserda', min: 10, max: 13 },
  { key: 'dagupan', min: 8, max: 12 },
];

export const computeEtaFromAddress = (address = '') => {
  const lower = address.toLowerCase();
  const hit = ETA_MAP.find(e => lower.includes(e.key));
  if (!hit) return null;

  return {
    eta_minutes_min: hit.min,
    eta_minutes_max: hit.max,
    eta_text: `${hit.min}-${hit.max} minutes`,
    eta_last_calculated_at: new Date(),
  };
};
