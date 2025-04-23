import { Industry } from './industry.enum';
import { SkillKeyword } from './keyword.enum';

export enum SkillCategory {
    TECHNICAL = 'Compétences Techniques',
    SOFT = 'Compétences Comportementales',
    LANGUAGE = 'Compétences Linguistiques',
    MANAGEMENT = 'Compétences Managériales',
    CERTIFICATION = 'Certifications',
    INDUSTRY = 'Compétences Sectorielles'
}

export enum SkillLevel {
    BEGINNER = 'Débutant',
    INTERMEDIATE = 'Intermédiaire',
    ADVANCED = 'Avancé',
    EXPERT = 'Expert'
}

interface RoleSkillSet {
    required: SkillKeyword[];
    preferred: SkillKeyword[];
}

type RoleSkills = {
    [key: string]: RoleSkillSet;
};

type IndustrySkills = {
    [key in Industry]?: SkillKeyword[];
};


export const CommonRoleSkills: RoleSkills = {
    'Software Developer': {
        required: [
            SkillKeyword.JAVASCRIPT,
            SkillKeyword.HTML,
            SkillKeyword.CSS,
            SkillKeyword.SQL,
            SkillKeyword.GITHUB
        ],
        preferred: [
            SkillKeyword.REACT,
            SkillKeyword.ANGULAR,
            SkillKeyword.NODE
        ]
    },
    'QHSE Manager': {
        required: [
            SkillKeyword.ISO_9001,
            SkillKeyword.ISO_14001,
            SkillKeyword.PROJECT_MANAGEMENT
        ],
        preferred: [
            SkillKeyword.SIX_SIGMA,
            SkillKeyword.CMMI
        ]
    },
    'Business Analyst': {
        required: [
            SkillKeyword.EXCEL,
            SkillKeyword.DATA_ANALYSIS,
            SkillKeyword.PROBLEM_SOLVING
        ],
        preferred: [
            SkillKeyword.POWER_BI,
            SkillKeyword.SQL
        ]
    },
    'Project Manager': {
        required: [
            SkillKeyword.PROJECT_MANAGEMENT,
            SkillKeyword.LEADERSHIP,
            SkillKeyword.COMMUNICATION
        ],
        preferred: [
            SkillKeyword.AGILE,
            SkillKeyword.PMP
        ]
    },
    'Network Engineer': {
        required: [
            SkillKeyword.CISCO,
            SkillKeyword.COMPTIA
        ],
        preferred: [
            SkillKeyword.AZURE,
            SkillKeyword.AWS
        ]
    }
};

export const SkillsByIndustry: IndustrySkills = {
    [Industry.IT_SERVICES]: [
        SkillKeyword.JAVA,
        SkillKeyword.JAVASCRIPT,
        SkillKeyword.PYTHON,
        SkillKeyword.SQL,
        SkillKeyword.AGILE
    ],
    [Industry.AUTOMOTIVE]: [
        SkillKeyword.PLC,
        SkillKeyword.SCADA,
        SkillKeyword.ISO_9001,
        SkillKeyword.SIX_SIGMA
    ],
    [Industry.BANKING]: [
        SkillKeyword.SAP,
        SkillKeyword.EXCEL,
        SkillKeyword.DATA_ANALYSIS,
        SkillKeyword.SAGE
    ],
    [Industry.PHARMACEUTICAL]: [
        SkillKeyword.ISO_9001,
        SkillKeyword.ISO_14001,
        SkillKeyword.SIX_SIGMA
    ]
};


export const CommonCertifications = {
    IT: [
        'AWS Certified Solutions Architect',
        'CISCO CCNA',
        'CompTIA A+',
        'Microsoft Certified',
        'Oracle Certified Professional'
    ],
    Quality: [
        'ISO 9001 Lead Auditor',
        'ISO 14001 Lead Auditor',
        'Six Sigma Green Belt',
        'Six Sigma Black Belt',
        'IRCA Certified Auditor'
    ],
    Management: [
        'PMP',
        'PRINCE2',
        'Scrum Master',
        'ITIL Foundation',
        'Agile Certified Practitioner'
    ],
    Finance: [
        'CPA',
        'ACCA',
        'CIA',
        'CFA',
        'Bloomberg Certification'
    ]
};