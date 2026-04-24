export interface Client {
  id: string;
  name: string;
  nif: string;
  segment: 'GE' | 'PME';
  sector: string;
  gestionnaire: string;
  qualite: string;
  scoring: string;
  anciennete: string;
  creation: string;
  capital: string;
  nbProduits: number;
  ca: number;
  caVariation: number;
  pnb: number;
  pnbVariation: number;
  impayes: number;
  impayesVariation: number;
  nbIncidents: number;
  products: Array<{ name: string; count: number; value: number; color: string }>;
  shareholders: Array<{ name: string; percentage: number }>;
  incidents: Array<{ status: 'resolved' | 'pending' | 'critical'; label: string; date: string; amount: string }>;
  caHistory: Array<{ year: string; ca: number; pnb: number }>;
  productsDistribution: Array<{ name: string; value: number; color: string }>;
}

export const clientsData: Client[] = [
  {
    id: 'SGA-GE-2018-00234',
    name: 'SARL ALGÉRIE INDUSTRIE',
    nif: '098765432101234',
    segment: 'GE',
    sector: 'Industrie',
    gestionnaire: 'Karim Mansouri',
    qualite: 'Premium',
    scoring: 'A+',
    anciennete: '8 ans',
    creation: '12/03/2018',
    capital: '50 M DZD',
    nbProduits: 12,
    ca: 2.45,
    caVariation: 12.3,
    pnb: 147.8,
    pnbVariation: 8.7,
    impayes: 18.2,
    impayesVariation: 5.2,
    nbIncidents: 3,
    products: [
      { name: 'Crédit Investissement', count: 3, value: 85, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 4, value: 65, color: '#4A9EFF' },
      { name: 'Leasing', count: 2, value: 50, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 2, value: 40, color: '#00C27A' },
      { name: 'Forex & Change', count: 1, value: 30, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Mohamed Benali', percentage: 45 },
      { name: 'Fatima Khalil', percentage: 30 },
      { name: 'Youcef Mansour', percentage: 15 },
      { name: 'Sara Amrani', percentage: 10 }
    ],
    incidents: [
      { status: 'resolved', label: 'Retard paiement LDD-2024-045', date: '12/02/2026', amount: '2.4 M DZD' },
      { status: 'pending', label: 'Incident chèque impayé', date: '18/03/2026', amount: '850 K DZD' },
      { status: 'critical', label: 'Dépassement découvert autorisé', date: '20/04/2026', amount: '1.2 M DZD' }
    ],
    caHistory: [
      { year: '2020', ca: 1.2, pnb: 85 },
      { year: '2021', ca: 1.5, pnb: 95 },
      { year: '2022', ca: 1.8, pnb: 110 },
      { year: '2023', ca: 2.1, pnb: 128 },
      { year: '2024', ca: 2.3, pnb: 138 },
      { year: '2025', ca: 2.45, pnb: 148 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 38, color: '#E2001A' },
      { name: 'Crédit CT', value: 25, color: '#4A9EFF' },
      { name: 'Leasing', value: 17, color: '#C9A84C' },
      { name: 'Caution', value: 13, color: '#00C27A' },
      { name: 'Forex', value: 7, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-GE-2019-00156',
    name: 'SPA CONSTRUCTION EXCELLENCE',
    nif: '098765432101567',
    segment: 'GE',
    sector: 'BTP',
    gestionnaire: 'Amina Boudiaf',
    qualite: 'VIP',
    scoring: 'A',
    anciennete: '7 ans',
    creation: '05/01/2019',
    capital: '120 M DZD',
    nbProduits: 15,
    ca: 3.82,
    caVariation: 18.5,
    pnb: 215.3,
    pnbVariation: 14.2,
    impayes: 8.5,
    impayesVariation: -2.1,
    nbIncidents: 1,
    products: [
      { name: 'Crédit Investissement', count: 5, value: 90, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 6, value: 75, color: '#4A9EFF' },
      { name: 'Leasing', count: 2, value: 45, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 35, color: '#00C27A' },
      { name: 'Forex & Change', count: 1, value: 25, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Ahmed Zaidi', percentage: 55 },
      { name: 'Leila Hamidi', percentage: 25 },
      { name: 'Omar Larbi', percentage: 20 }
    ],
    incidents: [
      { status: 'resolved', label: 'Retard paiement crédit', date: '15/01/2026', amount: '1.5 M DZD' }
    ],
    caHistory: [
      { year: '2020', ca: 2.1, pnb: 125 },
      { year: '2021', ca: 2.6, pnb: 148 },
      { year: '2022', ca: 3.0, pnb: 172 },
      { year: '2023', ca: 3.3, pnb: 188 },
      { year: '2024', ca: 3.6, pnb: 202 },
      { year: '2025', ca: 3.82, pnb: 215 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 42, color: '#E2001A' },
      { name: 'Crédit CT', value: 28, color: '#4A9EFF' },
      { name: 'Leasing', value: 15, color: '#C9A84C' },
      { name: 'Caution', value: 10, color: '#00C27A' },
      { name: 'Forex', value: 5, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-PME-2020-00892',
    name: 'EURL TECH INNOVATIONS',
    nif: '098765432102345',
    segment: 'PME',
    sector: 'Technologies',
    gestionnaire: 'Nassim Berkani',
    qualite: 'Standard',
    scoring: 'B+',
    anciennete: '6 ans',
    creation: '20/06/2020',
    capital: '15 M DZD',
    nbProduits: 8,
    ca: 0.85,
    caVariation: 25.4,
    pnb: 42.5,
    pnbVariation: 22.8,
    impayes: 2.1,
    impayesVariation: 0.5,
    nbIncidents: 0,
    products: [
      { name: 'Crédit Investissement', count: 2, value: 70, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 3, value: 80, color: '#4A9EFF' },
      { name: 'Leasing', count: 1, value: 40, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 30, color: '#00C27A' },
      { name: 'Forex & Change', count: 1, value: 20, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Sofiane Meziane', percentage: 70 },
      { name: 'Rachid Benamar', percentage: 30 }
    ],
    incidents: [],
    caHistory: [
      { year: '2020', ca: 0.3, pnb: 18 },
      { year: '2021', ca: 0.45, pnb: 24 },
      { year: '2022', ca: 0.58, pnb: 30 },
      { year: '2023', ca: 0.68, pnb: 35 },
      { year: '2024', ca: 0.75, pnb: 39 },
      { year: '2025', ca: 0.85, pnb: 42.5 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 30, color: '#E2001A' },
      { name: 'Crédit CT', value: 35, color: '#4A9EFF' },
      { name: 'Leasing', value: 15, color: '#C9A84C' },
      { name: 'Caution', value: 12, color: '#00C27A' },
      { name: 'Forex', value: 8, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-GE-2017-00089',
    name: 'SARL AGROALIMENTAIRE NATIONAL',
    nif: '098765432103456',
    segment: 'GE',
    sector: 'Agroalimentaire',
    gestionnaire: 'Karim Mansouri',
    qualite: 'Premium',
    scoring: 'A',
    anciennete: '9 ans',
    creation: '15/02/2017',
    capital: '85 M DZD',
    nbProduits: 14,
    ca: 4.12,
    caVariation: 9.8,
    pnb: 198.6,
    pnbVariation: 7.3,
    impayes: 12.3,
    impayesVariation: -1.2,
    nbIncidents: 2,
    products: [
      { name: 'Crédit Investissement', count: 4, value: 88, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 5, value: 92, color: '#4A9EFF' },
      { name: 'Leasing', count: 3, value: 65, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 45, color: '#00C27A' },
      { name: 'Forex & Change', count: 1, value: 35, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Mourad Saidi', percentage: 40 },
      { name: 'Zineb Cherif', percentage: 35 },
      { name: 'Kamel Boukhari', percentage: 25 }
    ],
    incidents: [
      { status: 'resolved', label: 'Retard échéance leasing', date: '10/01/2026', amount: '980 K DZD' },
      { status: 'pending', label: 'Virement tardif', date: '05/04/2026', amount: '450 K DZD' }
    ],
    caHistory: [
      { year: '2020', ca: 2.8, pnb: 145 },
      { year: '2021', ca: 3.2, pnb: 162 },
      { year: '2022', ca: 3.5, pnb: 175 },
      { year: '2023', ca: 3.8, pnb: 185 },
      { year: '2024', ca: 4.0, pnb: 192 },
      { year: '2025', ca: 4.12, pnb: 198.6 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 35, color: '#E2001A' },
      { name: 'Crédit CT', value: 40, color: '#4A9EFF' },
      { name: 'Leasing', value: 12, color: '#C9A84C' },
      { name: 'Caution', value: 8, color: '#00C27A' },
      { name: 'Forex', value: 5, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-PME-2021-00234',
    name: 'EURL IMPORT EXPORT MÉDITERRANÉE',
    nif: '098765432104567',
    segment: 'PME',
    sector: 'Commerce',
    gestionnaire: 'Amina Boudiaf',
    qualite: 'Standard',
    scoring: 'B',
    anciennete: '5 ans',
    creation: '08/09/2021',
    capital: '22 M DZD',
    nbProduits: 9,
    ca: 1.28,
    caVariation: 15.7,
    pnb: 68.4,
    pnbVariation: 12.1,
    impayes: 5.8,
    impayesVariation: 2.3,
    nbIncidents: 1,
    products: [
      { name: 'Crédit Investissement', count: 2, value: 60, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 3, value: 75, color: '#4A9EFF' },
      { name: 'Leasing', count: 2, value: 55, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 50, color: '#00C27A' },
      { name: 'Forex & Change', count: 1, value: 85, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Farid Messaoudi', percentage: 60 },
      { name: 'Nadia Khelifi', percentage: 40 }
    ],
    incidents: [
      { status: 'pending', label: 'Retard paiement CREDOC', date: '18/04/2026', amount: '1.8 M DZD' }
    ],
    caHistory: [
      { year: '2021', ca: 0.6, pnb: 38 },
      { year: '2022', ca: 0.85, pnb: 48 },
      { year: '2023', ca: 1.0, pnb: 56 },
      { year: '2024', ca: 1.15, pnb: 62 },
      { year: '2025', ca: 1.28, pnb: 68.4 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 25, color: '#E2001A' },
      { name: 'Crédit CT', value: 30, color: '#4A9EFF' },
      { name: 'Leasing', value: 18, color: '#C9A84C' },
      { name: 'Caution', value: 15, color: '#00C27A' },
      { name: 'Forex', value: 12, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-GE-2016-00445',
    name: 'SPA PHARMACEUTIQUE SANTÉ PLUS',
    nif: '098765432105678',
    segment: 'GE',
    sector: 'Pharmacie',
    gestionnaire: 'Nassim Berkani',
    qualite: 'VIP',
    scoring: 'A+',
    anciennete: '10 ans',
    creation: '22/11/2016',
    capital: '150 M DZD',
    nbProduits: 18,
    ca: 5.67,
    caVariation: 11.2,
    pnb: 285.4,
    pnbVariation: 9.8,
    impayes: 3.2,
    impayesVariation: -5.4,
    nbIncidents: 0,
    products: [
      { name: 'Crédit Investissement', count: 6, value: 95, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 7, value: 88, color: '#4A9EFF' },
      { name: 'Leasing', count: 3, value: 60, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 40, color: '#00C27A' },
      { name: 'Forex & Change', count: 1, value: 50, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Dr. Salim Bouzid', percentage: 50 },
      { name: 'Dr. Meriem Taleb', percentage: 30 },
      { name: 'Investisseurs Divers', percentage: 20 }
    ],
    incidents: [],
    caHistory: [
      { year: '2020', ca: 3.8, pnb: 215 },
      { year: '2021', ca: 4.3, pnb: 238 },
      { year: '2022', ca: 4.8, pnb: 252 },
      { year: '2023', ca: 5.2, pnb: 268 },
      { year: '2024', ca: 5.45, pnb: 278 },
      { year: '2025', ca: 5.67, pnb: 285.4 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 45, color: '#E2001A' },
      { name: 'Crédit CT', value: 25, color: '#4A9EFF' },
      { name: 'Leasing', value: 15, color: '#C9A84C' },
      { name: 'Caution', value: 10, color: '#00C27A' },
      { name: 'Forex', value: 5, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-PME-2022-00567',
    name: 'SARL TEXTILE MODERNE',
    nif: '098765432106789',
    segment: 'PME',
    sector: 'Textile',
    gestionnaire: 'Karim Mansouri',
    qualite: 'Standard',
    scoring: 'B+',
    anciennete: '4 ans',
    creation: '14/04/2022',
    capital: '18 M DZD',
    nbProduits: 7,
    ca: 0.92,
    caVariation: 28.3,
    pnb: 48.2,
    pnbVariation: 24.5,
    impayes: 1.5,
    impayesVariation: 0.8,
    nbIncidents: 0,
    products: [
      { name: 'Crédit Investissement', count: 2, value: 75, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 3, value: 85, color: '#4A9EFF' },
      { name: 'Leasing', count: 1, value: 50, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 35, color: '#00C27A' },
      { name: 'Forex & Change', count: 0, value: 0, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Habib Chergui', percentage: 65 },
      { name: 'Samia Boudour', percentage: 35 }
    ],
    incidents: [],
    caHistory: [
      { year: '2022', ca: 0.45, pnb: 25 },
      { year: '2023', ca: 0.65, pnb: 35 },
      { year: '2024', ca: 0.78, pnb: 42 },
      { year: '2025', ca: 0.92, pnb: 48.2 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 32, color: '#E2001A' },
      { name: 'Crédit CT', value: 38, color: '#4A9EFF' },
      { name: 'Leasing', value: 20, color: '#C9A84C' },
      { name: 'Caution', value: 10, color: '#00C27A' },
      { name: 'Forex', value: 0, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-GE-2015-00234',
    name: 'SPA ÉNERGIE RENOUVELABLE ALGÉRIE',
    nif: '098765432107890',
    segment: 'GE',
    sector: 'Énergie',
    gestionnaire: 'Amina Boudiaf',
    qualite: 'Premium',
    scoring: 'A',
    anciennete: '11 ans',
    creation: '30/05/2015',
    capital: '200 M DZD',
    nbProduits: 16,
    ca: 6.85,
    caVariation: 22.4,
    pnb: 342.5,
    pnbVariation: 19.8,
    impayes: 0,
    impayesVariation: -100,
    nbIncidents: 0,
    products: [
      { name: 'Crédit Investissement', count: 7, value: 98, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 5, value: 70, color: '#4A9EFF' },
      { name: 'Leasing', count: 2, value: 55, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 45, color: '#00C27A' },
      { name: 'Forex & Change', count: 1, value: 40, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Groupe ENER-DZ', percentage: 60 },
      { name: 'Investisseurs Étrangers', percentage: 25 },
      { name: 'État Algérien', percentage: 15 }
    ],
    incidents: [],
    caHistory: [
      { year: '2020', ca: 3.2, pnb: 185 },
      { year: '2021', ca: 4.1, pnb: 225 },
      { year: '2022', ca: 5.0, pnb: 268 },
      { year: '2023', ca: 5.8, pnb: 298 },
      { year: '2024', ca: 6.3, pnb: 322 },
      { year: '2025', ca: 6.85, pnb: 342.5 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 50, color: '#E2001A' },
      { name: 'Crédit CT', value: 22, color: '#4A9EFF' },
      { name: 'Leasing', value: 15, color: '#C9A84C' },
      { name: 'Caution', value: 8, color: '#00C27A' },
      { name: 'Forex', value: 5, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-PME-2020-00678',
    name: 'EURL LOGISTIQUE EXPRESS',
    nif: '098765432108901',
    segment: 'PME',
    sector: 'Transport',
    gestionnaire: 'Nassim Berkani',
    qualite: 'Standard',
    scoring: 'B',
    anciennete: '6 ans',
    creation: '18/07/2020',
    capital: '25 M DZD',
    nbProduits: 10,
    ca: 1.45,
    caVariation: 18.9,
    pnb: 72.5,
    pnbVariation: 16.2,
    impayes: 4.2,
    impayesVariation: 1.5,
    nbIncidents: 2,
    products: [
      { name: 'Crédit Investissement', count: 3, value: 80, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 4, value: 70, color: '#4A9EFF' },
      { name: 'Leasing', count: 2, value: 90, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 40, color: '#00C27A' },
      { name: 'Forex & Change', count: 0, value: 0, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Bilal Cherif', percentage: 55 },
      { name: 'Lynda Mokhtar', percentage: 45 }
    ],
    incidents: [
      { status: 'resolved', label: 'Retard remboursement leasing', date: '05/02/2026', amount: '1.1 M DZD' },
      { status: 'pending', label: 'Découvert non autorisé', date: '12/04/2026', amount: '680 K DZD' }
    ],
    caHistory: [
      { year: '2020', ca: 0.7, pnb: 42 },
      { year: '2021', ca: 0.9, pnb: 52 },
      { year: '2022', ca: 1.1, pnb: 60 },
      { year: '2023', ca: 1.25, pnb: 66 },
      { year: '2024', ca: 1.35, pnb: 69 },
      { year: '2025', ca: 1.45, pnb: 72.5 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 35, color: '#E2001A' },
      { name: 'Crédit CT', value: 28, color: '#4A9EFF' },
      { name: 'Leasing', value: 25, color: '#C9A84C' },
      { name: 'Caution', value: 12, color: '#00C27A' },
      { name: 'Forex', value: 0, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-GE-2019-00789',
    name: 'SARL HÔTELLERIE PRESTIGE',
    nif: '098765432109012',
    segment: 'GE',
    sector: 'Tourisme',
    gestionnaire: 'Karim Mansouri',
    qualite: 'Premium',
    scoring: 'A-',
    anciennete: '7 ans',
    creation: '10/03/2019',
    capital: '95 M DZD',
    nbProduits: 13,
    ca: 2.98,
    caVariation: 32.5,
    pnb: 156.8,
    pnbVariation: 28.7,
    impayes: 6.5,
    impayesVariation: -3.2,
    nbIncidents: 1,
    products: [
      { name: 'Crédit Investissement', count: 4, value: 85, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 5, value: 68, color: '#4A9EFF' },
      { name: 'Leasing', count: 2, value: 55, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 42, color: '#00C27A' },
      { name: 'Forex & Change', count: 1, value: 60, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Groupe Prestige SA', percentage: 70 },
      { name: 'Investisseurs Privés', percentage: 30 }
    ],
    incidents: [
      { status: 'resolved', label: 'Retard échéance crédit', date: '28/01/2026', amount: '2.2 M DZD' }
    ],
    caHistory: [
      { year: '2020', ca: 1.2, pnb: 75 },
      { year: '2021', ca: 1.5, pnb: 92 },
      { year: '2022', ca: 1.9, pnb: 108 },
      { year: '2023', ca: 2.3, pnb: 125 },
      { year: '2024', ca: 2.6, pnb: 142 },
      { year: '2025', ca: 2.98, pnb: 156.8 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 40, color: '#E2001A' },
      { name: 'Crédit CT', value: 25, color: '#4A9EFF' },
      { name: 'Leasing', value: 18, color: '#C9A84C' },
      { name: 'Caution', value: 10, color: '#00C27A' },
      { name: 'Forex', value: 7, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-PME-2021-00345',
    name: 'EURL ÉLECTRONIQUE MODERNE',
    nif: '098765432110123',
    segment: 'PME',
    sector: 'Électronique',
    gestionnaire: 'Amina Boudiaf',
    qualite: 'Standard',
    scoring: 'B+',
    anciennete: '5 ans',
    creation: '25/09/2021',
    capital: '12 M DZD',
    nbProduits: 6,
    ca: 0.68,
    caVariation: 21.4,
    pnb: 35.8,
    pnbVariation: 19.2,
    impayes: 1.2,
    impayesVariation: 0.3,
    nbIncidents: 0,
    products: [
      { name: 'Crédit Investissement', count: 1, value: 65, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 3, value: 78, color: '#4A9EFF' },
      { name: 'Leasing', count: 1, value: 45, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 32, color: '#00C27A' },
      { name: 'Forex & Change', count: 0, value: 0, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Amine Sahraoui', percentage: 80 },
      { name: 'Khadija Benali', percentage: 20 }
    ],
    incidents: [],
    caHistory: [
      { year: '2021', ca: 0.25, pnb: 15 },
      { year: '2022', ca: 0.38, pnb: 22 },
      { year: '2023', ca: 0.48, pnb: 27 },
      { year: '2024', ca: 0.58, pnb: 31 },
      { year: '2025', ca: 0.68, pnb: 35.8 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 28, color: '#E2001A' },
      { name: 'Crédit CT', value: 42, color: '#4A9EFF' },
      { name: 'Leasing', value: 18, color: '#C9A84C' },
      { name: 'Caution', value: 12, color: '#00C27A' },
      { name: 'Forex', value: 0, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-GE-2018-00567',
    name: 'SPA MÉTALLURGIE INDUSTRIELLE',
    nif: '098765432111234',
    segment: 'GE',
    sector: 'Métallurgie',
    gestionnaire: 'Nassim Berkani',
    qualite: 'Premium',
    scoring: 'A',
    anciennete: '8 ans',
    creation: '12/06/2018',
    capital: '110 M DZD',
    nbProduits: 17,
    ca: 4.55,
    caVariation: 14.8,
    pnb: 228.5,
    pnbVariation: 11.5,
    impayes: 9.8,
    impayesVariation: -2.5,
    nbIncidents: 2,
    products: [
      { name: 'Crédit Investissement', count: 6, value: 92, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 6, value: 82, color: '#4A9EFF' },
      { name: 'Leasing', count: 3, value: 68, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 48, color: '#00C27A' },
      { name: 'Forex & Change', count: 1, value: 38, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Groupe Métaux Algérie', percentage: 55 },
      { name: 'Tarek Belkacem', percentage: 30 },
      { name: 'Partenaires Industriels', percentage: 15 }
    ],
    incidents: [
      { status: 'resolved', label: 'Retard paiement crédit CT', date: '15/02/2026', amount: '1.6 M DZD' },
      { status: 'pending', label: 'Incident découvert', date: '08/04/2026', amount: '920 K DZD' }
    ],
    caHistory: [
      { year: '2020', ca: 2.8, pnb: 165 },
      { year: '2021', ca: 3.3, pnb: 185 },
      { year: '2022', ca: 3.7, pnb: 198 },
      { year: '2023', ca: 4.0, pnb: 210 },
      { year: '2024', ca: 4.3, pnb: 220 },
      { year: '2025', ca: 4.55, pnb: 228.5 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 43, color: '#E2001A' },
      { name: 'Crédit CT', value: 30, color: '#4A9EFF' },
      { name: 'Leasing', value: 14, color: '#C9A84C' },
      { name: 'Caution', value: 8, color: '#00C27A' },
      { name: 'Forex', value: 5, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-PME-2022-00123',
    name: 'SARL COSMÉTIQUE BEAUTÉ',
    nif: '098765432112345',
    segment: 'PME',
    sector: 'Cosmétique',
    gestionnaire: 'Karim Mansouri',
    qualite: 'Standard',
    scoring: 'B',
    anciennete: '4 ans',
    creation: '03/02/2022',
    capital: '8 M DZD',
    nbProduits: 5,
    ca: 0.42,
    caVariation: 35.8,
    pnb: 22.4,
    pnbVariation: 32.1,
    impayes: 0.8,
    impayesVariation: 0.2,
    nbIncidents: 0,
    products: [
      { name: 'Crédit Investissement', count: 1, value: 55, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 2, value: 72, color: '#4A9EFF' },
      { name: 'Leasing', count: 1, value: 38, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 28, color: '#00C27A' },
      { name: 'Forex & Change', count: 0, value: 0, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Yasmine Hamdi', percentage: 75 },
      { name: 'Rania Belaid', percentage: 25 }
    ],
    incidents: [],
    caHistory: [
      { year: '2022', ca: 0.15, pnb: 9 },
      { year: '2023', ca: 0.24, pnb: 14 },
      { year: '2024', ca: 0.32, pnb: 18 },
      { year: '2025', ca: 0.42, pnb: 22.4 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 25, color: '#E2001A' },
      { name: 'Crédit CT', value: 45, color: '#4A9EFF' },
      { name: 'Leasing', value: 18, color: '#C9A84C' },
      { name: 'Caution', value: 12, color: '#00C27A' },
      { name: 'Forex', value: 0, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-GE-2017-00234',
    name: 'SPA PLASTIQUE ALGÉRIEN',
    nif: '098765432113456',
    segment: 'GE',
    sector: 'Plastique',
    gestionnaire: 'Amina Boudiaf',
    qualite: 'Premium',
    scoring: 'A-',
    anciennete: '9 ans',
    creation: '19/08/2017',
    capital: '78 M DZD',
    nbProduits: 14,
    ca: 3.25,
    caVariation: 10.5,
    pnb: 168.2,
    pnbVariation: 8.9,
    impayes: 11.2,
    impayesVariation: 1.8,
    nbIncidents: 3,
    products: [
      { name: 'Crédit Investissement', count: 4, value: 82, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 5, value: 76, color: '#4A9EFF' },
      { name: 'Leasing', count: 3, value: 58, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 44, color: '#00C27A' },
      { name: 'Forex & Change', count: 1, value: 32, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Samir Djelloul', percentage: 48 },
      { name: 'Malika Ziane', percentage: 32 },
      { name: 'Autres Actionnaires', percentage: 20 }
    ],
    incidents: [
      { status: 'resolved', label: 'Retard paiement LDD', date: '05/01/2026', amount: '1.8 M DZD' },
      { status: 'pending', label: 'Incident chèque', date: '20/03/2026', amount: '750 K DZD' },
      { status: 'critical', label: 'Dépassement autorisation', date: '15/04/2026', amount: '1.4 M DZD' }
    ],
    caHistory: [
      { year: '2020', ca: 2.2, pnb: 128 },
      { year: '2021', ca: 2.5, pnb: 142 },
      { year: '2022', ca: 2.75, pnb: 152 },
      { year: '2023', ca: 2.95, pnb: 160 },
      { year: '2024', ca: 3.1, pnb: 165 },
      { year: '2025', ca: 3.25, pnb: 168.2 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 38, color: '#E2001A' },
      { name: 'Crédit CT', value: 28, color: '#4A9EFF' },
      { name: 'Leasing', value: 18, color: '#C9A84C' },
      { name: 'Caution', value: 10, color: '#00C27A' },
      { name: 'Forex', value: 6, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-PME-2020-00456',
    name: 'EURL SERVICES INFORMATIQUES',
    nif: '098765432114567',
    segment: 'PME',
    sector: 'Services IT',
    gestionnaire: 'Nassim Berkani',
    qualite: 'Standard',
    scoring: 'B+',
    anciennete: '6 ans',
    creation: '11/11/2020',
    capital: '10 M DZD',
    nbProduits: 8,
    ca: 0.75,
    caVariation: 26.8,
    pnb: 39.5,
    pnbVariation: 23.4,
    impayes: 1.8,
    impayesVariation: 0.4,
    nbIncidents: 0,
    products: [
      { name: 'Crédit Investissement', count: 2, value: 68, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 3, value: 75, color: '#4A9EFF' },
      { name: 'Leasing', count: 2, value: 62, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 35, color: '#00C27A' },
      { name: 'Forex & Change', count: 0, value: 0, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Mehdi Rezki', percentage: 60 },
      { name: 'Salima Haddad', percentage: 40 }
    ],
    incidents: [],
    caHistory: [
      { year: '2020', ca: 0.28, pnb: 18 },
      { year: '2021', ca: 0.38, pnb: 23 },
      { year: '2022', ca: 0.48, pnb: 28 },
      { year: '2023', ca: 0.58, pnb: 32 },
      { year: '2024', ca: 0.66, pnb: 36 },
      { year: '2025', ca: 0.75, pnb: 39.5 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 30, color: '#E2001A' },
      { name: 'Crédit CT', value: 35, color: '#4A9EFF' },
      { name: 'Leasing', value: 22, color: '#C9A84C' },
      { name: 'Caution', value: 13, color: '#00C27A' },
      { name: 'Forex', value: 0, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-GE-2016-00678',
    name: 'SARL CHIMIE AVANCÉE',
    nif: '098765432115678',
    segment: 'GE',
    sector: 'Chimie',
    gestionnaire: 'Karim Mansouri',
    qualite: 'VIP',
    scoring: 'A+',
    anciennete: '10 ans',
    creation: '27/04/2016',
    capital: '165 M DZD',
    nbProduits: 19,
    ca: 7.12,
    caVariation: 16.3,
    pnb: 358.4,
    pnbVariation: 13.8,
    impayes: 4.5,
    impayesVariation: -4.2,
    nbIncidents: 1,
    products: [
      { name: 'Crédit Investissement', count: 7, value: 96, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 7, value: 88, color: '#4A9EFF' },
      { name: 'Leasing', count: 3, value: 65, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 52, color: '#00C27A' },
      { name: 'Forex & Change', count: 1, value: 48, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'ChemCorp International', percentage: 65 },
      { name: 'Dr. Hakim Bouazza', percentage: 20 },
      { name: 'Fonds d\'Investissement', percentage: 15 }
    ],
    incidents: [
      { status: 'resolved', label: 'Retard remboursement', date: '18/02/2026', amount: '2.8 M DZD' }
    ],
    caHistory: [
      { year: '2020', ca: 4.2, pnb: 235 },
      { year: '2021', ca: 5.0, pnb: 275 },
      { year: '2022', ca: 5.8, pnb: 305 },
      { year: '2023', ca: 6.3, pnb: 328 },
      { year: '2024', ca: 6.7, pnb: 345 },
      { year: '2025', ca: 7.12, pnb: 358.4 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 48, color: '#E2001A' },
      { name: 'Crédit CT', value: 24, color: '#4A9EFF' },
      { name: 'Leasing', value: 15, color: '#C9A84C' },
      { name: 'Caution', value: 8, color: '#00C27A' },
      { name: 'Forex', value: 5, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-PME-2021-00789',
    name: 'EURL MEUBLES DESIGN',
    nif: '098765432116789',
    segment: 'PME',
    sector: 'Ameublement',
    gestionnaire: 'Amina Boudiaf',
    qualite: 'Standard',
    scoring: 'B',
    anciennete: '5 ans',
    creation: '16/05/2021',
    capital: '14 M DZD',
    nbProduits: 7,
    ca: 0.58,
    caVariation: 22.1,
    pnb: 30.8,
    pnbVariation: 19.7,
    impayes: 2.5,
    impayesVariation: 1.2,
    nbIncidents: 1,
    products: [
      { name: 'Crédit Investissement', count: 2, value: 70, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 2, value: 65, color: '#4A9EFF' },
      { name: 'Leasing', count: 2, value: 75, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 38, color: '#00C27A' },
      { name: 'Forex & Change', count: 0, value: 0, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Kamel Brahim', percentage: 70 },
      { name: 'Naima Saadi', percentage: 30 }
    ],
    incidents: [
      { status: 'pending', label: 'Retard échéance', date: '22/04/2026', amount: '580 K DZD' }
    ],
    caHistory: [
      { year: '2021', ca: 0.22, pnb: 14 },
      { year: '2022', ca: 0.32, pnb: 19 },
      { year: '2023', ca: 0.42, pnb: 24 },
      { year: '2024', ca: 0.51, pnb: 28 },
      { year: '2025', ca: 0.58, pnb: 30.8 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 32, color: '#E2001A' },
      { name: 'Crédit CT', value: 28, color: '#4A9EFF' },
      { name: 'Leasing', value: 25, color: '#C9A84C' },
      { name: 'Caution', value: 15, color: '#00C27A' },
      { name: 'Forex', value: 0, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-GE-2018-00890',
    name: 'SPA AUTOMOBILE DISTRIBUTION',
    nif: '098765432117890',
    segment: 'GE',
    sector: 'Automobile',
    gestionnaire: 'Nassim Berkani',
    qualite: 'Premium',
    scoring: 'A',
    anciennete: '8 ans',
    creation: '09/09/2018',
    capital: '135 M DZD',
    nbProduits: 16,
    ca: 5.28,
    caVariation: 19.7,
    pnb: 268.5,
    pnbVariation: 16.4,
    impayes: 15.8,
    impayesVariation: 3.5,
    nbIncidents: 4,
    products: [
      { name: 'Crédit Investissement', count: 5, value: 88, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 6, value: 92, color: '#4A9EFF' },
      { name: 'Leasing', count: 3, value: 70, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 50, color: '#00C27A' },
      { name: 'Forex & Change', count: 1, value: 55, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Auto Groupe Algérie', percentage: 60 },
      { name: 'Partenaires Étrangers', percentage: 25 },
      { name: 'Actionnaires Locaux', percentage: 15 }
    ],
    incidents: [
      { status: 'resolved', label: 'Retard crédit fournisseur', date: '08/01/2026', amount: '3.2 M DZD' },
      { status: 'resolved', label: 'Incident leasing', date: '14/02/2026', amount: '1.9 M DZD' },
      { status: 'pending', label: 'Chèque impayé', date: '25/03/2026', amount: '1.2 M DZD' },
      { status: 'critical', label: 'Découvert non autorisé', date: '19/04/2026', amount: '2.5 M DZD' }
    ],
    caHistory: [
      { year: '2020', ca: 3.0, pnb: 175 },
      { year: '2021', ca: 3.6, pnb: 198 },
      { year: '2022', ca: 4.2, pnb: 220 },
      { year: '2023', ca: 4.6, pnb: 238 },
      { year: '2024', ca: 4.9, pnb: 255 },
      { year: '2025', ca: 5.28, pnb: 268.5 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 35, color: '#E2001A' },
      { name: 'Crédit CT', value: 32, color: '#4A9EFF' },
      { name: 'Leasing', value: 20, color: '#C9A84C' },
      { name: 'Caution', value: 8, color: '#00C27A' },
      { name: 'Forex', value: 5, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-PME-2022-00234',
    name: 'SARL FORMATION PROFESSIONNELLE',
    nif: '098765432118901',
    segment: 'PME',
    sector: 'Éducation',
    gestionnaire: 'Karim Mansouri',
    qualite: 'Standard',
    scoring: 'B+',
    anciennete: '4 ans',
    creation: '02/03/2022',
    capital: '6 M DZD',
    nbProduits: 5,
    ca: 0.38,
    caVariation: 18.8,
    pnb: 20.2,
    pnbVariation: 16.5,
    impayes: 0.5,
    impayesVariation: 0.1,
    nbIncidents: 0,
    products: [
      { name: 'Crédit Investissement', count: 1, value: 60, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 2, value: 70, color: '#4A9EFF' },
      { name: 'Leasing', count: 1, value: 42, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 30, color: '#00C27A' },
      { name: 'Forex & Change', count: 0, value: 0, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'Dr. Nabil Ferhat', percentage: 85 },
      { name: 'Associés Divers', percentage: 15 }
    ],
    incidents: [],
    caHistory: [
      { year: '2022', ca: 0.18, pnb: 11 },
      { year: '2023', ca: 0.26, pnp: 15 },
      { year: '2024', ca: 0.32, pnb: 18 },
      { year: '2025', ca: 0.38, pnb: 20.2 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 28, color: '#E2001A' },
      { name: 'Crédit CT', value: 40, color: '#4A9EFF' },
      { name: 'Leasing', value: 20, color: '#C9A84C' },
      { name: 'Caution', value: 12, color: '#00C27A' },
      { name: 'Forex', value: 0, color: '#A855F7' }
    ]
  },
  {
    id: 'SGA-GE-2019-00345',
    name: 'SPA TÉLÉCOMMUNICATIONS RÉSEAU',
    nif: '098765432119012',
    segment: 'GE',
    sector: 'Télécoms',
    gestionnaire: 'Amina Boudiaf',
    qualite: 'VIP',
    scoring: 'A+',
    anciennete: '7 ans',
    creation: '21/07/2019',
    capital: '180 M DZD',
    nbProduits: 20,
    ca: 8.45,
    caVariation: 24.6,
    pnb: 425.8,
    pnbVariation: 21.3,
    impayes: 0,
    impayesVariation: -100,
    nbIncidents: 0,
    products: [
      { name: 'Crédit Investissement', count: 8, value: 98, color: '#E2001A' },
      { name: 'Crédit Court Terme', count: 7, value: 85, color: '#4A9EFF' },
      { name: 'Leasing', count: 3, value: 72, color: '#C9A84C' },
      { name: 'Caution & Garanties', count: 1, value: 55, color: '#00C27A' },
      { name: 'Forex & Change', count: 1, value: 65, color: '#A855F7' }
    ],
    shareholders: [
      { name: 'TeleNet International', percentage: 70 },
      { name: 'Investisseurs Institutionnels', percentage: 20 },
      { name: 'Management', percentage: 10 }
    ],
    incidents: [],
    caHistory: [
      { year: '2020', ca: 4.5, pnb: 258 },
      { year: '2021', ca: 5.4, pnb: 302 },
      { year: '2022', ca: 6.3, pnb: 342 },
      { year: '2023', ca: 7.1, pnb: 375 },
      { year: '2024', ca: 7.8, pnb: 405 },
      { year: '2025', ca: 8.45, pnb: 425.8 }
    ],
    productsDistribution: [
      { name: 'Crédit Invest.', value: 52, color: '#E2001A' },
      { name: 'Crédit CT', value: 22, color: '#4A9EFF' },
      { name: 'Leasing', value: 14, color: '#C9A84C' },
      { name: 'Caution', value: 7, color: '#00C27A' },
      { name: 'Forex', value: 5, color: '#A855F7' }
    ]
  }
];
