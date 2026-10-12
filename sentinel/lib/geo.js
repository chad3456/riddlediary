'use strict';

const R_KM = 6371;
const rad = (d) => (d * Math.PI) / 180;

function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

// box = [[south, west], [north, east]]
function inBox(lat, lon, box) {
  return lat >= box[0][0] && lat <= box[1][0] && lon >= box[0][1] && lon <= box[1][1];
}

function within(item, center, km) {
  return haversineKm(item.lat, item.lon, center.lat, center.lon) <= km;
}

module.exports = { haversineKm, inBox, within };
