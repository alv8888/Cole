// Public UI units are km and km³/s²; the physics layer accepts SI only.
export const kmToM = value => value * 1000;
export const km3ToM3 = value => value * 1e9;
export const mToKm = value => value / 1000;
export const secondsToMinutes = value => value / 60;

export function number(value, digits = 2) {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(value);
}
