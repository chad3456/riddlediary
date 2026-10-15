/* Static geopolitical reference layers (ISO 3166-1 alpha-2 codes).
   Compiled from public sources; memberships and sanctions change, so every
   layer that uses this file is labelled "reference" with its as-of date.
   Disputed-area shapes are approximate, for orientation only, and do not
   endorse any claim. */
window.GEOREF = {
  asOf: '2026-10',

  blocs: {
    NATO: { name: 'NATO', note: 'North Atlantic Treaty Organization (32 members)',
      members: ['AL', 'BE', 'BG', 'CA', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IT', 'LV', 'LT', 'LU', 'ME', 'NL', 'MK', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'TR', 'GB', 'US'] },
    EU: { name: 'European Union', note: '27 member states',
      members: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'],
      partners: ['UA', 'MD', 'GE', 'RS', 'ME', 'AL', 'MK', 'BA', 'TR'], partnerLabel: 'Candidate countries' },
    CSTO: { name: 'CSTO', note: 'Collective Security Treaty Organization; Armenia froze participation in 2024',
      members: ['RU', 'BY', 'KZ', 'KG', 'TJ'], partners: ['AM'], partnerLabel: 'Participation frozen' },
    SCO: { name: 'Shanghai Cooperation Organisation', note: '10 members',
      members: ['CN', 'RU', 'IN', 'PK', 'KZ', 'KG', 'TJ', 'UZ', 'IR', 'BY'], partners: ['MN', 'AF'], partnerLabel: 'Observers' },
    BRICS: { name: 'BRICS', note: 'Members and partner countries (2025 enlargement)',
      members: ['BR', 'RU', 'IN', 'CN', 'ZA', 'EG', 'ET', 'IR', 'AE', 'ID'],
      partners: ['BY', 'BO', 'KZ', 'CU', 'MY', 'TH', 'UG', 'UZ', 'NG', 'VN', 'SA'], partnerLabel: 'Partners / invited' },
    GCC: { name: 'Gulf Cooperation Council', members: ['SA', 'AE', 'QA', 'KW', 'BH', 'OM'] },
    ASEAN: { name: 'ASEAN', members: ['BN', 'KH', 'ID', 'LA', 'MY', 'MM', 'PH', 'SG', 'TH', 'VN', 'TL'] },
    AES: { name: 'Alliance of Sahel States', note: 'Mali, Burkina Faso, Niger (left ECOWAS 2025)', members: ['ML', 'BF', 'NE'] },
    OPEC: { name: 'OPEC+', note: 'OPEC members + non-OPEC partners in the OPEC+ deal',
      members: ['DZ', 'CG', 'GQ', 'GA', 'IR', 'IQ', 'KW', 'LY', 'NG', 'SA', 'AE', 'VE'],
      partners: ['RU', 'KZ', 'MX', 'OM', 'AZ', 'BH', 'BN', 'MY', 'SD', 'SS'], partnerLabel: 'OPEC+ partners' },
    QUAD: { name: 'Quad / AUKUS', members: ['US', 'JP', 'IN', 'AU'], partners: ['GB'], partnerLabel: 'AUKUS only' },
    FVEY: { name: 'Five Eyes', note: 'Signals-intelligence alliance', members: ['US', 'GB', 'CA', 'AU', 'NZ'] },
  },

  // Broad sanctions programmes (US / EU / UK / UN). Verify with OFAC, the EU Sanctions Map and UN 1267 lists.
  sanctions: {
    comprehensive: ['IR', 'KP', 'CU'],
    extensive: ['RU', 'BY', 'VE'],
    targeted: ['SY', 'MM', 'AF', 'LY', 'SD', 'SS', 'CD', 'CF', 'SO', 'YE', 'ML', 'IQ', 'LB', 'NI', 'HT', 'ER'],
  },

  nuclear: {
    nws: ['US', 'RU', 'CN', 'FR', 'GB'],
    nonNpt: ['IN', 'PK', 'KP', 'IL'],
    sharing: ['BE', 'DE', 'IT', 'NL', 'TR'],
  },

  // [lat, lon] rings or lines. Approximate.
  contested: [
    { id: 'crimea', name: 'Crimea', kind: 'area', parties: 'Ukraine / Russia (occupied 2014)', ring: [[46.15, 33.6], [45.9, 32.5], [45.3, 32.5], [44.4, 33.4], [44.4, 34.2], [44.9, 35.4], [45.3, 36.6], [45.6, 35.2], [46.15, 34.0]] },
    { id: 'kashmir', name: 'Kashmir Line of Control', kind: 'line', parties: 'India / Pakistan', line: [[32.6, 74.6], [33.2, 74.0], [33.8, 73.9], [34.4, 73.9], [34.7, 74.3], [34.6, 75.2], [34.7, 76.2], [35.0, 76.8], [35.5, 77.8]] },
    { id: 'aksai', name: 'Aksai Chin', kind: 'area', parties: 'India / China', ring: [[35.6, 78.0], [35.7, 79.6], [35.3, 80.3], [34.4, 80.0], [34.0, 78.8], [34.7, 78.1]] },
    { id: 'arunachal', name: 'Arunachal Pradesh (claimed by China)', kind: 'point', parties: 'India / China', at: [28.0, 94.5] },
    { id: 'taiwan', name: 'Taiwan Strait median line', kind: 'line', parties: 'Taiwan / PRC', line: [[27.0, 122.0], [24.8, 120.2], [23.3, 118.0]] },
    { id: 'scs', name: 'South China Sea "nine-dash line" (approx.)', kind: 'line', dashed: true, parties: 'PRC claim; disputed by PH, VN, MY, BN, ID', line: [[21.4, 108.1], [17.6, 109.5], [13.0, 109.6], [8.6, 108.8], [5.6, 109.8], [3.9, 112.1], [4.4, 113.9], [7.3, 116.1], [10.6, 117.6], [14.6, 118.6], [17.9, 119.3], [20.9, 121.0], [22.1, 122.1]] },
    { id: 'spratly', name: 'Spratly Islands', kind: 'point', parties: 'CN, VN, PH, MY, BN, TW', at: [10.0, 114.5] },
    { id: 'paracel', name: 'Paracel Islands', kind: 'point', parties: 'CN, VN, TW', at: [16.5, 112.0] },
    { id: 'scarborough', name: 'Scarborough Shoal', kind: 'point', parties: 'PH / CN', at: [15.15, 117.76] },
    { id: 'senkaku', name: 'Senkaku / Diaoyu Islands', kind: 'point', parties: 'JP / CN / TW', at: [25.75, 123.5] },
    { id: 'kurils', name: 'Southern Kuril Islands', kind: 'point', parties: 'JP / RU', at: [44.0, 146.2] },
    { id: 'dmz', name: 'Korean DMZ', kind: 'line', parties: 'ROK / DPRK', line: [[37.75, 126.1], [37.95, 126.7], [38.1, 127.1], [38.3, 127.8], [38.6, 128.35]] },
    { id: 'golan', name: 'Golan Heights', kind: 'area', parties: 'Israel / Syria', ring: [[33.3, 35.8], [33.25, 35.62], [32.7, 35.6], [32.7, 35.9], [33.0, 35.95]] },
    { id: 'wsahara', name: 'Western Sahara', kind: 'area', parties: 'Morocco / Polisario', ring: [[27.67, -13.17], [27.67, -8.67], [26.0, -8.67], [26.0, -12.0], [23.45, -12.0], [21.33, -13.0], [21.33, -16.95], [24.0, -15.8], [26.0, -14.5]] },
    { id: 'transnistria', name: 'Transnistria', kind: 'area', parties: 'Moldova / Russian-backed authorities', ring: [[48.2, 28.0], [47.9, 28.6], [47.3, 29.2], [46.6, 29.9], [46.6, 30.1], [47.0, 29.8], [47.8, 29.2], [48.4, 28.3]] },
    { id: 'abkhazia', name: 'Abkhazia', kind: 'area', parties: 'Georgia / Russian-backed authorities', ring: [[43.58, 40.0], [43.4, 40.9], [43.2, 41.6], [42.8, 42.1], [42.6, 41.6], [42.75, 41.3], [43.1, 40.6]] },
    { id: 'sossetia', name: 'South Ossetia', kind: 'area', parties: 'Georgia / Russian-backed authorities', ring: [[42.65, 43.5], [42.6, 44.5], [42.2, 44.4], [42.15, 43.8], [42.35, 43.5]] },
    { id: 'essequibo', name: 'Essequibo (claimed by Venezuela)', kind: 'area', parties: 'Guyana / Venezuela', ring: [[8.5, -60.0], [7.8, -58.9], [6.8, -58.4], [5.0, -58.0], [3.0, -58.6], [1.4, -58.8], [1.3, -59.8], [2.5, -60.0], [4.5, -61.4], [5.2, -60.7], [6.8, -61.2], [7.5, -60.4]] },
    { id: 'abumusa', name: 'Abu Musa & the Tunbs', kind: 'point', parties: 'UAE / Iran', at: [25.9, 55.0] },
    { id: 'kosovo', name: 'Kosovo (status disputed by Serbia)', kind: 'point', parties: 'Kosovo / Serbia', at: [42.6, 20.9] },
  ],

  // Major overseas / forward military facilities (public reporting; positions approximate).
  bases: [
    ['Al Udeid Air Base', 'US', 'QA', 25.117, 51.315], ['NSA Bahrain (5th Fleet)', 'US', 'BH', 26.21, 50.61], ['Camp Lemonnier', 'US', 'DJ', 11.547, 43.159],
    ['Diego Garcia', 'US/UK', 'IO', -7.316, 72.411], ['Ramstein Air Base', 'US', 'DE', 49.437, 7.6], ['Incirlik Air Base', 'US', 'TR', 37.002, 35.426],
    ['Naval Station Rota', 'US', 'ES', 36.645, -6.35], ['NSA Souda Bay', 'US', 'GR', 35.53, 24.15], ['Aviano Air Base', 'US', 'IT', 46.03, 12.596],
    ['RAF Lakenheath', 'US', 'GB', 52.409, 0.561], ['Kadena Air Base', 'US', 'JP', 26.356, 127.768], ['Yokosuka (7th Fleet)', 'US', 'JP', 35.29, 139.67],
    ['Camp Humphreys', 'US', 'KR', 36.96, 127.03], ['Andersen AFB, Guam', 'US', 'GU', 13.584, 144.93], ['Al Dhafra Air Base', 'US', 'AE', 24.248, 54.548],
    ['Ali Al Salem Air Base', 'US', 'KW', 29.347, 47.521], ['Ain al-Asad', 'US', 'IQ', 33.785, 42.441], ['Pituffik Space Base', 'US', 'GL', 76.531, -68.703],
    ['Guantanamo Bay', 'US', 'CU', 19.9, -75.1], ['Mihail Kogălniceanu', 'US/NATO', 'RO', 44.362, 28.488], ['Aegis Ashore Redzikowo', 'US/NATO', 'PL', 54.48, 17.1],
    ['Tartus naval facility', 'RU', 'SY', 34.905, 35.873], ['Hmeimim Air Base', 'RU', 'SY', 35.401, 35.949], ['Kant Air Base', 'RU', 'KG', 42.853, 74.846],
    ['201st Military Base', 'RU', 'TJ', 38.55, 68.8], ['102nd Military Base, Gyumri', 'RU', 'AM', 40.79, 43.85], ['Sevastopol (Black Sea Fleet)', 'RU', 'UA', 44.616, 33.525],
    ['PLA Support Base Djibouti', 'CN', 'DJ', 11.59, 43.06], ['Ream Naval Base', 'CN (access)', 'KH', 10.505, 103.61], ['Fiery Cross Reef', 'CN', 'SCS', 9.55, 112.89],
    ['Subi Reef', 'CN', 'SCS', 10.92, 114.08], ['Mischief Reef', 'CN', 'SCS', 9.9, 115.53], ['Woody Island', 'CN', 'SCS', 16.83, 112.34],
    ['RAF Akrotiri', 'GB', 'CY', 34.59, 32.99], ['French forces Djibouti', 'FR', 'DJ', 11.55, 43.15], ['French base Abu Dhabi', 'FR', 'AE', 24.52, 54.39],
    ['TURKSOM Mogadishu', 'TR', 'SO', 2.03, 45.3], ['JSDF Base Djibouti', 'JP', 'DJ', 11.56, 43.14],
  ].map(([name, operator, host, lat, lon]) => ({ name, operator, host, lat, lon })),
};
