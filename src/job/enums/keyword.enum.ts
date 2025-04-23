export enum SkillKeyword {
    // Programming Languages
    JAVA = 'Java',
    PYTHON = 'Python',
    JAVASCRIPT = 'JavaScript',
    TYPESCRIPT = 'TypeScript',
    PHP = 'PHP',
    CSHARP = 'C#',
    CPP = 'C++',
    SWIFT = 'Swift',
    KOTLIN = 'Kotlin',

    // Web Technologies
    ANGULAR = 'Angular',
    REACT = 'React',
    VUE = 'Vue.js',
    NODE = 'Node.js',
    HTML = 'HTML',
    CSS = 'CSS',
    WORDPRESS = 'WordPress',
    LARAVEL = 'Laravel',
    SYMFONY = 'Symfony',

    // Databases
    SQL = 'SQL',
    MYSQL = 'MySQL',
    POSTGRESQL = 'PostgreSQL',
    MONGODB = 'MongoDB',
    ORACLE = 'Oracle',

    // Cloud & DevOps
    AWS = 'AWS',
    AZURE = 'Azure',
    DOCKER = 'Docker',
    KUBERNETES = 'Kubernetes',
    JENKINS = 'Jenkins',
    GITLAB = 'GitLab',
    GITHUB = 'GitHub',

    // Design & UI/UX
    PHOTOSHOP = 'Photoshop',
    ILLUSTRATOR = 'Illustrator',
    FIGMA = 'Figma',
    XD = 'Adobe XD',
    UI_DESIGN = 'UI Design',
    UX_DESIGN = 'UX Design',

    // Business & Management
    SAP = 'SAP',
    SAGE = 'Sage',
    EXCEL = 'Excel',
    POWERPOINT = 'PowerPoint',
    PROJECT_MANAGEMENT = 'Gestion de Projet',
    AGILE = 'Agile',
    SCRUM = 'Scrum',

    // Quality & Standards
    ISO_9001 = 'ISO 9001',
    ISO_14001 = 'ISO 14001',
    ISO_27001 = 'ISO 27001',
    CMMI = 'CMMI',
    ITIL = 'ITIL',
    SIX_SIGMA = 'Six Sigma',

    // Industry-Specific
    PLC = 'PLC',
    SCADA = 'SCADA',
    AUTOCAD = 'AutoCAD',
    SOLIDWORKS = 'SolidWorks',
    CATIA = 'CATIA',

    // Analysis & Data
    POWER_BI = 'Power BI',
    TABLEAU = 'Tableau',
    MACHINE_LEARNING = 'Machine Learning',
    DATA_ANALYSIS = 'Analyse de Données',
    BIG_DATA = 'Big Data',
    STATISTICS = 'Statistiques',

    // Soft Skills
    TEAMWORK = 'Travail d\'Équipe',
    COMMUNICATION = 'Communication',
    PROBLEM_SOLVING = 'Résolution de Problèmes',
    LEADERSHIP = 'Leadership',
    TIME_MANAGEMENT = 'Gestion du Temps',
    ADAPTABILITY = 'Adaptabilité',

    // Certifications
    PMP = 'PMP',
    CISCO = 'CISCO',
    COMPTIA = 'CompTIA',
    MICROSOFT = 'Microsoft Certified',
    ORACLE_CERTIFIED = 'Oracle Certified',
    AWS_CERTIFIED = 'AWS Certified',

    // QHSE
    QHSE = 'QHSE',
    QUALITY = 'QUALITY',
    ENVIRONMENT = 'ENVIRONMENT',
    SAFETY = 'SAFETY',
    HYGIENE = 'HYGIENE',
    ISO_45001 = 'ISO_45001',
    RISK_MANAGEMENT = 'RISK_MANAGEMENT',
    AUDIT = 'AUDIT'
}

// Industry-specific keyword groups for easy filtering
export const TechKeywords = [
    SkillKeyword.JAVA,
    SkillKeyword.PYTHON,
    SkillKeyword.JAVASCRIPT,
    SkillKeyword.TYPESCRIPT,
    SkillKeyword.ANGULAR,
    SkillKeyword.REACT,
    SkillKeyword.NODE
];

export const ManagementKeywords = [
    SkillKeyword.PROJECT_MANAGEMENT,
    SkillKeyword.AGILE,
    SkillKeyword.SCRUM,
    SkillKeyword.LEADERSHIP,
    SkillKeyword.TIME_MANAGEMENT
];

export const QualityKeywords = [
    SkillKeyword.ISO_9001,
    SkillKeyword.ISO_14001,
    SkillKeyword.ISO_27001,
    SkillKeyword.CMMI,
    SkillKeyword.SIX_SIGMA
];

export const DataKeywords = [
    SkillKeyword.POWER_BI,
    SkillKeyword.TABLEAU,
    SkillKeyword.MACHINE_LEARNING,
    SkillKeyword.DATA_ANALYSIS,
    SkillKeyword.BIG_DATA
];
