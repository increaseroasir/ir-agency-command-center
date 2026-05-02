/**
 * CPL Calculation and Color Classification.
 * Thresholds always come from the settings table — never hardcoded.
 */

export type CplColor = 'green' | 'orange' | 'red' | 'gray';

export interface CplResult {
  cpl: number | null;
  color: CplColor;
}

/**
 * Calculate CPL and assign a color classification.
 * @param spend - Total Meta spend
 * @param leads - GHL qualified lead count
 * @param greenMax - CPL threshold for green (from settings table)
 * @param orangeMax - CPL threshold for orange (from settings table)
 */
export function calculateCpl(
  spend: number,
  leads: number,
  greenMax: number,
  orangeMax: number
): CplResult {
  if (leads === 0) {
    return { cpl: null, color: 'gray' };
  }

  const cpl = spend / leads;
  let color: CplColor;

  if (cpl < greenMax) {
    color = 'green';
  } else if (cpl < orangeMax) {
    color = 'orange';
  } else {
    color = 'red';
  }

  return { cpl, color };
}
