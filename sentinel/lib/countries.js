'use strict';
// Approximate country centroids (ISO 3166-1 alpha-2) for placing country-level
// signals (internet outages) on the map. Good to ~1 degree, which is all a
// country-scale marker needs.

const C = {
  AF: [33.9, 67.7, 'Afghanistan'], AL: [41.2, 20.2, 'Albania'], DZ: [28.0, 1.7, 'Algeria'], AO: [-11.2, 17.9, 'Angola'],
  AR: [-38.4, -63.6, 'Argentina'], AM: [40.1, 45.0, 'Armenia'], AU: [-25.3, 133.8, 'Australia'], AT: [47.5, 14.6, 'Austria'],
  AZ: [40.1, 47.6, 'Azerbaijan'], BH: [26.0, 50.6, 'Bahrain'], BD: [23.7, 90.4, 'Bangladesh'], BY: [53.7, 28.0, 'Belarus'],
  BE: [50.5, 4.5, 'Belgium'], BJ: [9.3, 2.3, 'Benin'], BO: [-16.3, -63.6, 'Bolivia'], BA: [43.9, 17.7, 'Bosnia and Herzegovina'],
  BW: [-22.3, 24.7, 'Botswana'], BR: [-14.2, -51.9, 'Brazil'], BG: [42.7, 25.5, 'Bulgaria'], BF: [12.2, -1.6, 'Burkina Faso'],
  BI: [-3.4, 29.9, 'Burundi'], KH: [12.6, 105.0, 'Cambodia'], CM: [7.4, 12.4, 'Cameroon'], CA: [56.1, -106.3, 'Canada'],
  CF: [6.6, 20.9, 'Central African Republic'], TD: [15.5, 18.7, 'Chad'], CL: [-35.7, -71.5, 'Chile'], CN: [35.9, 104.2, 'China'],
  CO: [4.6, -74.3, 'Colombia'], CD: [-4.0, 21.8, 'DR Congo'], CG: [-0.2, 15.8, 'Congo'], CR: [9.7, -83.8, 'Costa Rica'],
  CI: [7.5, -5.5, "Côte d'Ivoire"], HR: [45.1, 15.2, 'Croatia'], CU: [21.5, -77.8, 'Cuba'], CY: [35.1, 33.4, 'Cyprus'],
  CZ: [49.8, 15.5, 'Czechia'], DK: [56.3, 9.5, 'Denmark'], DJ: [11.8, 42.6, 'Djibouti'], DO: [18.7, -70.2, 'Dominican Republic'],
  EC: [-1.8, -78.2, 'Ecuador'], EG: [26.8, 30.8, 'Egypt'], SV: [13.8, -88.9, 'El Salvador'], ER: [15.2, 39.8, 'Eritrea'],
  EE: [58.6, 25.0, 'Estonia'], ET: [9.1, 40.5, 'Ethiopia'], FI: [61.9, 25.7, 'Finland'], FR: [46.2, 2.2, 'France'],
  GA: [-0.8, 11.6, 'Gabon'], GM: [13.4, -15.3, 'Gambia'], GE: [42.3, 43.4, 'Georgia'], DE: [51.2, 10.5, 'Germany'],
  GH: [7.9, -1.0, 'Ghana'], GR: [39.1, 21.8, 'Greece'], GT: [15.8, -90.2, 'Guatemala'], GN: [9.9, -9.7, 'Guinea'],
  GW: [11.8, -15.2, 'Guinea-Bissau'], HT: [19.0, -72.3, 'Haiti'], HN: [15.2, -86.2, 'Honduras'], HK: [22.3, 114.2, 'Hong Kong'],
  HU: [47.2, 19.5, 'Hungary'], IS: [64.96, -19.0, 'Iceland'], IN: [20.6, 79.0, 'India'], ID: [-0.8, 113.9, 'Indonesia'],
  IR: [32.4, 53.7, 'Iran'], IQ: [33.2, 43.7, 'Iraq'], IE: [53.4, -8.2, 'Ireland'], IL: [31.0, 34.9, 'Israel'],
  IT: [41.9, 12.6, 'Italy'], JM: [18.1, -77.3, 'Jamaica'], JP: [36.2, 138.3, 'Japan'], JO: [30.6, 36.2, 'Jordan'],
  KZ: [48.0, 66.9, 'Kazakhstan'], KE: [-0.02, 37.9, 'Kenya'], KP: [40.3, 127.5, 'North Korea'], KR: [35.9, 127.8, 'South Korea'],
  KW: [29.3, 47.5, 'Kuwait'], KG: [41.2, 74.8, 'Kyrgyzstan'], LA: [19.9, 102.5, 'Laos'], LV: [56.9, 24.6, 'Latvia'],
  LB: [33.9, 35.9, 'Lebanon'], LR: [6.4, -9.4, 'Liberia'], LY: [26.3, 17.2, 'Libya'], LT: [55.2, 23.9, 'Lithuania'],
  MG: [-18.8, 46.9, 'Madagascar'], MW: [-13.3, 34.3, 'Malawi'], MY: [4.2, 101.98, 'Malaysia'], ML: [17.6, -4.0, 'Mali'],
  MR: [21.0, -10.9, 'Mauritania'], MX: [23.6, -102.6, 'Mexico'], MD: [47.4, 28.4, 'Moldova'], MN: [46.9, 103.8, 'Mongolia'],
  ME: [42.7, 19.4, 'Montenegro'], MA: [31.8, -7.1, 'Morocco'], MZ: [-18.7, 35.5, 'Mozambique'], MM: [21.9, 95.96, 'Myanmar'],
  NA: [-22.96, 18.5, 'Namibia'], NP: [28.4, 84.1, 'Nepal'], NL: [52.1, 5.3, 'Netherlands'], NZ: [-40.9, 174.9, 'New Zealand'],
  NI: [12.9, -85.2, 'Nicaragua'], NE: [17.6, 8.1, 'Niger'], NG: [9.1, 8.7, 'Nigeria'], MK: [41.6, 21.7, 'North Macedonia'],
  NO: [60.5, 8.5, 'Norway'], OM: [21.5, 55.9, 'Oman'], PK: [30.4, 69.3, 'Pakistan'], PS: [31.9, 35.2, 'Palestine'],
  PA: [8.5, -80.8, 'Panama'], PG: [-6.3, 143.96, 'Papua New Guinea'], PY: [-23.4, -58.4, 'Paraguay'], PE: [-9.2, -75.0, 'Peru'],
  PH: [12.9, 121.8, 'Philippines'], PL: [51.9, 19.1, 'Poland'], PT: [39.4, -8.2, 'Portugal'], QA: [25.4, 51.2, 'Qatar'],
  RO: [45.9, 24.97, 'Romania'], RU: [61.5, 105.3, 'Russia'], RW: [-1.9, 29.9, 'Rwanda'], SA: [23.9, 45.1, 'Saudi Arabia'],
  SN: [14.5, -14.5, 'Senegal'], RS: [44.0, 21.0, 'Serbia'], SL: [8.5, -11.8, 'Sierra Leone'], SG: [1.35, 103.8, 'Singapore'],
  SK: [48.7, 19.7, 'Slovakia'], SI: [46.2, 14.995, 'Slovenia'], SO: [5.2, 46.2, 'Somalia'], ZA: [-30.6, 22.9, 'South Africa'],
  SS: [6.9, 31.3, 'South Sudan'], ES: [40.5, -3.7, 'Spain'], LK: [7.9, 80.8, 'Sri Lanka'], SD: [12.9, 30.2, 'Sudan'],
  SE: [60.1, 18.6, 'Sweden'], CH: [46.8, 8.2, 'Switzerland'], SY: [34.8, 39.0, 'Syria'], TW: [23.7, 120.96, 'Taiwan'],
  TJ: [38.9, 71.3, 'Tajikistan'], TZ: [-6.4, 34.9, 'Tanzania'], TH: [15.9, 100.99, 'Thailand'], TG: [8.6, 0.8, 'Togo'],
  TN: [33.9, 9.5, 'Tunisia'], TR: [38.96, 35.2, 'Turkey'], TM: [38.97, 59.6, 'Turkmenistan'], UG: [1.4, 32.3, 'Uganda'],
  UA: [48.4, 31.2, 'Ukraine'], AE: [23.4, 53.8, 'United Arab Emirates'], GB: [55.4, -3.4, 'United Kingdom'], US: [37.1, -95.7, 'United States'],
  UY: [-32.5, -55.8, 'Uruguay'], UZ: [41.4, 64.6, 'Uzbekistan'], VE: [6.4, -66.6, 'Venezuela'], VN: [14.1, 108.3, 'Vietnam'],
  YE: [15.6, 48.5, 'Yemen'], ZM: [-13.1, 27.8, 'Zambia'], ZW: [-19.0, 29.2, 'Zimbabwe'], XK: [42.6, 20.9, 'Kosovo'],
  GY: [4.9, -58.9, 'Guyana'], SR: [3.9, -56.0, 'Suriname'], BT: [27.5, 90.4, 'Bhutan'], MU: [-20.3, 57.6, 'Mauritius'],
};

function centroid(iso) {
  const c = C[(iso || '').toUpperCase()];
  return c ? { lat: c[0], lon: c[1], name: c[2] } : null;
}

module.exports = { centroid, COUNTRIES: C };
