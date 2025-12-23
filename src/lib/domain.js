export const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const monthKey = (iso) => iso.slice(0, 7);
export const deepClone = (o) => JSON.parse(JSON.stringify(o));
