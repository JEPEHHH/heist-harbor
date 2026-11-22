// The mercury column: rise while seen, slow decay unseen, threshold stamps and the caught state.

import { TUNE } from './config.js';

export function createAlarm() {
  return { value: 0, max: 0, alerted: false, caughtBy: null, flash: 0 };
}

/**
 * Advance the meter. `sightings` is [{source, rate}] from cones and camera arcs.
 * Returns true on the step that crosses the fail threshold.
 */
export function updateAlarm(alarm, dt, sightings) {
  alarm.flash = Math.max(0, alarm.flash - dt);
  let rise = 0;
  let culprit = null;
  for (const s of sightings) {
    rise += s.rate;
    if (!culprit || s.rate > culprit.rate) culprit = s;
  }
  if (rise > 0) {
    alarm.value = Math.min(100, alarm.value + Math.min(rise, 90) * dt);
    alarm.flash = 0.12;
  } else {
    alarm.value = Math.max(0, alarm.value - TUNE.alarmDecay * dt);
  }
  alarm.max = Math.max(alarm.max, alarm.value);
  let alertedNow = false;
  if (!alarm.alerted && alarm.value >= TUNE.alertThreshold) {
    alarm.alerted = true;
    alertedNow = true;
  }
  if (alarm.value >= TUNE.failThreshold && !alarm.caughtBy) {
    alarm.caughtBy = culprit ? culprit.source : 'UNKNOWN SIGHTING';
    return { caught: true, alertedNow, culprit: alarm.caughtBy };
  }
  return { caught: false, alertedNow, culprit: null };
}

export function alarmLabel(alarm) {
  return `${Math.round(alarm.value).toString().padStart(3, '0')}%`;
}
