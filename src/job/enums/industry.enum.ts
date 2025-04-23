export enum Industry {
    // Manufacturing & Industry
    TEXTILE = 'Textile et Habillement',
    AUTOMOTIVE = 'Industrie Automobile',
    AEROSPACE = 'Aéronautique',
    ELECTRONICS = 'Électronique',
    MECHANICAL = 'Mécanique et Métallurgie',
    PLASTICS = 'Plastique et Emballage',
    PHARMACEUTICAL = 'Industrie Pharmaceutique',
    FOOD_PROCESSING = 'Agroalimentaire',
    LEATHER = 'Cuir et Chaussures',

    // Technology & Services
    IT_SERVICES = 'Services Informatiques',
    SOFTWARE = 'Édition de Logiciels',
    TELECOM = 'Télécommunications',
    CONSULTING = 'Conseil et Services',
    ENGINEERING = 'Bureau d\'Études',
    OUTSOURCING = 'Centre de Services Partagés',
    CALL_CENTER = 'Centre d\'Appels',
    DIGITAL_SERVICES = 'Services Numériques',

    // Financial Services
    BANKING = 'Banque',
    INSURANCE = 'Assurance',
    MICROFINANCE = 'Microfinance',
    FINTECH = 'Technologies Financières',
    LEASING = 'Leasing',

    // Tourism & Hospitality
    HOTELS = 'Hôtellerie',
    RESTAURANTS = 'Restauration',
    TRAVEL = 'Agences de Voyage',
    TOURISM_SERVICES = 'Services Touristiques',

    // Construction & Real Estate
    CONSTRUCTION = 'BTP',
    REAL_ESTATE = 'Immobilier',
    ARCHITECTURE = 'Architecture et Design',
    BUILDING_MATERIALS = 'Matériaux de Construction',

    // Energy & Resources
    OIL_GAS = 'Pétrole et Gaz',
    RENEWABLE_ENERGY = 'Énergies Renouvelables',
    MINING = 'Industries Extractives',
    UTILITIES = 'Services Publics',

    // Agriculture
    AGRICULTURE = 'Agriculture',
    FISHING = 'Pêche',
    FORESTRY = 'Sylviculture',
    AGRITECH = 'Technologies Agricoles',

    // Healthcare
    HOSPITALS = 'Hôpitaux et Cliniques',
    MEDICAL_SERVICES = 'Services Médicaux',
    MEDICAL_EQUIPMENT = 'Équipements Médicaux',
    BIOTECHNOLOGY = 'Biotechnologie',

    // Education & Training
    HIGHER_EDUCATION = 'Enseignement Supérieur',
    PROFESSIONAL_TRAINING = 'Formation Professionnelle',
    LANGUAGE_SCHOOLS = 'Écoles de Langues',
    EDUCATIONAL_SERVICES = 'Services Éducatifs',

    // Transportation & Logistics
    TRANSPORT = 'Transport',
    LOGISTICS = 'Logistique',
    SHIPPING = 'Transport Maritime',
    FREIGHT = 'Fret et Messagerie',

    // Media & Communication
    MEDIA = 'Médias',
    ADVERTISING = 'Publicité',
    PUBLISHING = 'Édition',
    DIGITAL_MEDIA = 'Médias Numériques',

    // Retail & Distribution
    RETAIL = 'Commerce de Détail',
    WHOLESALE = 'Commerce de Gros',
    E_COMMERCE = 'Commerce Électronique',
    DISTRIBUTION = 'Distribution',

    // Environmental Services
    WASTE_MANAGEMENT = 'Gestion des Déchets',
    RECYCLING = 'Recyclage',
    ENVIRONMENTAL_SERVICES = 'Services Environnementaux',
    GREEN_TECH = 'Technologies Vertes',

    // Public Sector
    GOVERNMENT = 'Administration Publique',
    PUBLIC_SERVICES = 'Services Publics',
    INTERNATIONAL_ORGANIZATIONS = 'Organisations Internationales',
    NGO = 'ONG'
}

export const IndustryGroups = {
    MANUFACTURING: [
        Industry.TEXTILE,
        Industry.AUTOMOTIVE,
        Industry.AEROSPACE,
        Industry.ELECTRONICS,
        Industry.MECHANICAL,
        Industry.PLASTICS,
        Industry.PHARMACEUTICAL,
        Industry.FOOD_PROCESSING,
        Industry.LEATHER
    ],
    TECH_SERVICES: [
        Industry.IT_SERVICES,
        Industry.SOFTWARE,
        Industry.TELECOM,
        Industry.CONSULTING,
        Industry.ENGINEERING,
        Industry.OUTSOURCING,
        Industry.DIGITAL_SERVICES
    ],
    FINANCE: [
        Industry.BANKING,
        Industry.INSURANCE,
        Industry.MICROFINANCE,
        Industry.FINTECH,
        Industry.LEASING
    ]
};