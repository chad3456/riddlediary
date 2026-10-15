/* Orbital analysis in the browser (satellite.js SGP4):
   orbit classification, solar geometry and day/night terminator, sensor
   field-of-regard footprints, and overhead-pass prediction for a ground point. */
(() => {
  'use strict';
  const R = 6371;
  const D2R = Math.PI / 180;

  function classify(rec) {
    const revDay = (rec.no * 1440) / (2 * Math.PI);
    const ecc = rec.ecco; const inc = rec.inclo / D2R;
    const period = 1440 / revDay;
    const a = Math.cbrt(398600.4418 * ((period * 60) / (2 * Math.PI)) ** 2);
    const perigee = a * (1 - ecc) - R; const apogee = a * (1 + ecc) - R;
    let cls = 'MEO';
    if (ecc > 0.25) cls = 'HEO';
    else if (revDay > 0.95 && revDay < 1.05) cls = 'GEO';
    else if (revDay > 11.25) cls = 'LEO';
    // Sun-synchronous LEO: retrograde ~96-100 deg inclination at LEO altitudes — the classic imaging orbit.
    const sso = cls === 'LEO' && inc > 95 && inc < 101;
    return { cls, sso, period: +period.toFixed(1), inc: +inc.toFixed(1), ecc: +ecc.toFixed(4), perigee: Math.round(perigee), apogee: Math.round(apogee) };
  }

  // Low-precision solar position (NOAA-style), good to ~0.1 deg — plenty for day/night.
  function sun(date) {
    const jd = date.getTime() / 86400000 + 2440587.5; const n = jd - 2451545.0;
    const L = (280.46 + 0.9856474 * n) % 360; const g = ((357.528 + 0.9856003 * n) % 360) * D2R;
    const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D2R;
    const eps = (23.439 - 0.0000004 * n) * D2R;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
    const gmst = ((18.697374558 + 24.06570982441908 * n) % 24) * 15 * D2R;
    let lon = (ra - gmst) / D2R; lon = ((lon + 540) % 360) - 180;
    return { lat: dec / D2R, lon };
  }
  function sunElevation(lat, lon, date) {
    const s = sun(date);
    const c = Math.sin(lat * D2R) * Math.sin(s.lat * D2R) + Math.cos(lat * D2R) * Math.cos(s.lat * D2R) * Math.cos((lon - s.lon) * D2R);
    return Math.asin(Math.max(-1, Math.min(1, c))) / D2R;
  }
  // Night-side polygon as [lat, lon] ring, closed over the dark pole.
  function nightRing(date) {
    const s = sun(date); const dec = s.lat * D2R || 1e-6;
    const ring = [];
    for (let lon = -180; lon <= 180; lon += 2) {
      const lat = Math.atan(-Math.cos((lon - s.lon) * D2R) / Math.tan(dec)) / D2R;
      ring.push([lat, lon]);
    }
    const pole = s.lat > 0 ? -90 : 90;
    ring.push([pole, 180], [pole, -180]);
    return ring;
  }

  // Ground radius (km) a sensor can reach when slewing to `offNadir` degrees.
  function fieldOfRegardKm(altKm, offNadir = 30) {
    const eta = offNadir * D2R; const x = ((R + altKm) / R) * Math.sin(eta);
    const lambda = x >= 1 ? Math.acos(R / (R + altKm)) : Math.asin(x) - eta;
    return lambda * R;
  }
  function circle(lat, lon, km, n = 48) {
    const d = km / R; const la = lat * D2R; const lo = lon * D2R; const pts = [];
    for (let i = 0; i <= n; i++) {
      const b = (i / n) * 2 * Math.PI;
      const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b));
      const lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
      pts.push([la2 / D2R, ((lo2 / D2R + 540) % 360) - 180]);
    }
    return pts;
  }

  // Overhead passes above `minEl` degrees for the next `hours`, 60 s resolution.
  function passes(recs, lat, lon, { hours = 12, minEl = 10, stepS = 60, now = new Date() } = {}) {
    const obs = { latitude: lat * D2R, longitude: lon * D2R, height: 0 };
    const steps = Math.round((hours * 3600) / stepS);
    const t0 = now.getTime();
    const gm = []; for (let i = 0; i <= steps; i++) gm.push(satellite.gstime(new Date(t0 + i * stepS * 1000)));
    const out = [];
    for (const s of recs) {
      if (s.orbit?.cls === 'GEO') {
        const el = elevationAt(s.rec, obs, new Date(t0), gm[0]);
        if (el > minEl) out.push({ name: s.name, group: s.group, cls: 'GEO', aos: t0, los: t0 + hours * 3_600_000, maxEl: +el.toFixed(1), tMax: t0, persistent: true, daylight: null });
        continue;
      }
      let cur = null;
      for (let i = 0; i <= steps; i++) {
        const t = t0 + i * stepS * 1000;
        const el = elevationAt(s.rec, obs, new Date(t), gm[i]);
        if (el > minEl) {
          if (!cur) cur = { name: s.name, group: s.group, cls: s.orbit?.cls, sso: s.orbit?.sso, aos: t, maxEl: el, tMax: t };
          if (el > cur.maxEl) { cur.maxEl = el; cur.tMax = t; }
        } else if (cur) { cur.los = t; out.push(cur); cur = null; }
      }
      if (cur) { cur.los = t0 + steps * stepS * 1000; out.push(cur); }
    }
    for (const p of out) {
      p.maxEl = +(+p.maxEl).toFixed(1);
      if (!p.persistent) p.daylight = sunElevation(lat, lon, new Date(p.tMax)) > 0;
    }
    return out.sort((a, b) => a.aos - b.aos);
  }
  function elevationAt(rec, obs, date, gmst) {
    const pv = satellite.propagate(rec, date);
    if (!pv || !pv.position) return -90;
    const ecf = satellite.eciToEcf(pv.position, gmst);
    return satellite.ecfToLookAngles(obs, ecf).elevation / D2R;
  }

  window.SentinelOrbits = { classify, sun, sunElevation, nightRing, fieldOfRegardKm, circle, passes };
})();
