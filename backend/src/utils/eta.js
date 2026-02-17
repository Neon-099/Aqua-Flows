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

const STAGE_FACTORS = {
  PICKED_UP: { min: 1.0, max: 1.2 },
  OUT_FOR_DELIVERY: { min: 0.45, max: 0.7 },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const computeEtaFromAddress = (address = '', stage = 'PICKED_UP') => {
  const lower = String(address || '').toLowerCase();
  const hit = ETA_MAP.find((e) => lower.includes(String(e.key).toLowerCase()));
  if (!hit) return null;

  const factor = STAGE_FACTORS[stage] || STAGE_FACTORS.PICKED_UP;
  const rawMin = Math.round(hit.min * factor.min);
  const rawMax = Math.round(hit.max * factor.max);
  const adjustedMin = clamp(Math.min(rawMin, rawMax), 1, 180);
  const adjustedMax = clamp(Math.max(rawMin, rawMax), adjustedMin, 180);
  const etaFinalCount =
    Math.floor(Math.random() * (adjustedMax - adjustedMin + 1)) + adjustedMin;

  return {
    eta_minutes_min: adjustedMin,
    eta_minutes_max: adjustedMax,
    eta_text: `${etaFinalCount} minutes`,
    eta_last_calculated_at: new Date(),
  };
};

