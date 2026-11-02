/* All internal quantities use mm, N, MPa and °C. No extrapolation. */
(function (scope) {
  'use strict';
  function positive(values) {
    if (!values.every(v => Number.isFinite(v) && v > 0)) throw new Error('All required dimensions, pressures and stresses must be finite positive numbers.');
  }
  function stressAt(collection, name, temp) {
    const row = collection.find(item => item.name === name);
    if (!row || !Number.isFinite(temp)) return { error: 'Select a material and enter a numeric temperature.' };
    const points = (row.stresses || []).filter(p => Number.isFinite(p.temp)).sort((a, b) => a.temp - b.temp);
    if (!points.length) return { error: `${name}: no temperature data available.` };
    const min = points[0].temp, max = points.at(-1).temp;
    if (temp < min || temp > max) return { error: `${name}: ${temp} °C is outside the available ${min} to ${max} °C range. No stress was extrapolated.` };
    const valid = p => Number.isFinite(p?.stress) && p.stress > 0;
    const exact = points.find(p => p.temp === temp);
    if (exact) return valid(exact) ? { stress: exact.stress, row, min, max, basis: `Tabulated at ${temp} °C` } : { error: `${name}: stress unavailable at ${temp} °C.` };
    const i = points.findIndex(p => p.temp > temp), a = points[i - 1], b = points[i];
    if (!valid(a) || !valid(b)) return { error: `${name}: cannot interpolate across missing stress data.` };
    return { stress: a.stress + (temp - a.temp) * (b.stress - a.stress) / (b.temp - a.temp), row, min, max, basis: `Linear interpolation between ${a.temp} and ${b.temp} °C` };
  }
  function nonCircular({ pressure, H, h, ca, requiredShell, shortActual, longActual, endActual, stress, efficiency }) {
    positive([pressure, H, h, requiredShell, shortActual, longActual, endActual, stress, efficiency]);
    if (!Number.isFinite(ca) || ca < 0 || ca >= Math.min(shortActual, longActual, endActual)) throw new Error('Corrosion allowance must be zero or greater and less than every actual thickness.');
    if (H > h) throw new Error('Short span H must not exceed long span h.');
    const shortSpan = H + 2 * ca, longSpan = h + 2 * ca, actualShell = Math.min(shortActual, longActual);
    const C = Math.max(0.33 * requiredShell / actualShell, 0.2);
    const Z = Math.min(3.4 - 2.4 * shortSpan / longSpan, 2.5);
    const requiredEnd = shortSpan * Math.sqrt(Z * C * pressure / (stress * efficiency)) + ca;
    positive([requiredEnd]);
    return { C, Z, requiredEnd, actualShell, requiredShell, endActual };
  }
  function circular({ pressure, od, id, actualShell, endActual, ca, shellStress, endStress, efficiency }) {
    positive([pressure, od, id, actualShell, endActual, shellStress, endStress, efficiency]);
    if (od <= id) throw new Error('Outside diameter must exceed inside diameter.');
    const geometricThickness = (od - id) / 2;
    if (Math.abs(actualShell - geometricThickness) > Math.max(0.01, geometricThickness * 0.001)) throw new Error('Actual shell thickness must agree with (OD − ID) / 2. Adjust the diameters or thickness.');
    if (!Number.isFinite(ca) || ca < 0 || ca >= Math.min(actualShell, endActual)) throw new Error('Corrosion allowance must be less than the actual shell and endplate thicknesses.');
    const denominator = shellStress * efficiency - 0.6 * pressure;
    if (denominator <= 0) throw new Error('Pressure is outside the supported ID-basis formula range: S × E − 0.6 × P must be positive.');
    const tId = pressure * (id / 2 + ca) / denominator + ca;
    const tOd = pressure * od / 2 / (shellStress * efficiency + 0.4 * pressure) + ca;
    const cf = Math.max(0.33 * tId / actualShell, 0.33 * tOd / actualShell, 0.2);
    const requiredEnd = (id + 2 * ca) * Math.sqrt(cf * pressure / (endStress * efficiency)) + ca;
    positive([tId, tOd, cf, requiredEnd]);
    return { tId, tOd, cf, requiredEnd, requiredShell: Math.max(tId, tOd), actualShell, endActual };
  }
  function bolts({ pressure, area, count, preload, friction, clearance, stress, yieldStress, size }) {
    positive([pressure, area, count, preload, friction, stress, yieldStress]);
    if (!Number.isInteger(count)) throw new Error('Number of bolts must be a whole number.');
    if (preload > 100) throw new Error('Preload must be greater than 0 and no more than 100% of the recorded yield strength.');
    if (friction > 1) throw new Error('Friction coefficient must be greater than 0 and no more than 1.');
    if (!Number.isFinite(clearance) || clearance < 0) throw new Error('Diametrical clearance must be zero or higher.');
    const rootArea = Number(size.rootArea), tensileArea = Number(size.tensileArea), diameter = Number(size.boltOD), pitch = Number(size.pitch), outer = Number(size.widthFlats);
    positive([rootArea, tensileArea, diameter, pitch, outer]);
    const inner = diameter + clearance, pitchDiameter = diameter - 6 * Math.sqrt(3) * pitch / 16;
    if (inner >= outer) throw new Error('Bolt hole diameter must be smaller than the recorded outer bearing diameter. Reduce clearance or choose another bolt.');
    positive([pitchDiameter]);
    const load = pressure * area / count, requiredArea = load / stress, actualStress = load / rootArea;
    const preloadStress = preload / 100 * yieldStress, preloadForce = preloadStress * tensileArea, partingForce = load * 1.1;
    const beta = Math.PI / 6, lambda = Math.atan(pitch / (Math.PI * pitchDiameter));
    const denominator = 1 - friction * Math.tan(lambda) / Math.cos(beta);
    if (denominator <= 0) throw new Error('Friction and thread geometry are outside the torque formula range.');
    const K = ((pitchDiameter / 2) * (Math.tan(lambda) + friction / Math.cos(beta)) / denominator + 0.625 * friction * diameter) / diameter;
    const targetTorque = preloadForce * (0.16 * pitch + 0.58 * friction * pitchDiameter + (outer + inner) * friction / 4) / 1000;
    const tighteningTorque = preloadForce * K * diameter / 1000;
    const partingTorque = partingForce * K * diameter / 1000;
    positive([load, requiredArea, actualStress, K, targetTorque, tighteningTorque, partingTorque]);
    return { load, requiredArea, rootArea, actualStress, K, targetTorque, tighteningTorque, partingTorque, preloadForce, partingForce, preloadStress, lambdaDegrees: lambda * 180 / Math.PI };
  }
  scope.BeruMath = { stressAt, nonCircular, circular, bolts };
  if (typeof module !== 'undefined') module.exports = scope.BeruMath;
})(typeof window !== 'undefined' ? window : globalThis);
