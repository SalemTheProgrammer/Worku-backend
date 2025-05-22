import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CvSkillsService } from '../cv-skills.service';
import { Candidate } from '../../../schemas/candidate.schema';
import { Skill } from '../../../schemas/skill.schema';
import { CVAnalysisService } from '../../../services/cv-analysis.service';
import { GeminiClientService } from '../../../services/gemini-client.service';
import { SkillCategory } from '../../enums/skill-category.enum';

describe('CvSkillsService', () => {
  let service: CvSkillsService;
  let geminiClient: jest.Mocked<GeminiClientService>;
  let cvAnalysis: jest.Mocked<CVAnalysisService>;
  let candidateModel: Model<Candidate>;

  const mockCvAnalysis = {
    jobFitSummary: {
      reason: 'Test summary',
      fitBreakdown: {
        skillsFit: { details: ['Python developer with 5 years experience'] },
        experienceFit: { details: ['Led technical projects'] },
        educationFit: { details: ['Computer Science degree'] }
      }
    }
  };

  const mockGeminiResponse = `{
    "skills": [
      {
        "name": "Python",
        "level": "expert",
        "category": "technical"
      },
      {
        "name": "Team Leadership",
        "level": "intermediate",
        "category": "interpersonal"
      },
      {
        "name": "French",
        "level": "Professionnel",
        "category": "language"
      }
    ]
  }`;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvSkillsService,
        {
          provide: getModelToken(Candidate.name),
          useValue: {
            findByIdAndUpdate: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: getModelToken(Skill.name),
          useValue: {},
        },
        {
          provide: CVAnalysisService,
          useValue: {
            analyzeCV: jest.fn().mockResolvedValue(mockCvAnalysis),
          },
        },
        {
          provide: GeminiClientService,
          useValue: {
            generateContent: jest.fn().mockResolvedValue(mockGeminiResponse),
          },
        },
      ],
    }).compile();

    service = module.get<CvSkillsService>(CvSkillsService);
    geminiClient = module.get(GeminiClientService) as jest.Mocked<GeminiClientService>;
    cvAnalysis = module.get(CVAnalysisService) as jest.Mocked<CVAnalysisService>;
    candidateModel = module.get<Model<Candidate>>(getModelToken(Candidate.name));
  });

  it('should extract and save valid skills', async () => {
    const updateSpy = jest.spyOn(candidateModel, 'findByIdAndUpdate');
    
    await service.extractSkillsFromCV('test.pdf', 'candidate123');

    expect(updateSpy).toHaveBeenCalled();
    const savedSkills = updateSpy.mock.calls[0][1].$set.skills;
    
    expect(savedSkills).toHaveLength(3);
    
    // Verify technical skill
    expect(savedSkills[0]).toMatchObject({
      name: 'Python',
      category: SkillCategory.TECHNICAL,
      level: 5, // expert level
    });

    // Verify interpersonal skill
    expect(savedSkills[1]).toMatchObject({
      name: 'Team Leadership',
      category: SkillCategory.INTERPERSONAL,
      level: 3, // intermediate level
    });

    // Verify language skill
    expect(savedSkills[2]).toMatchObject({
      name: 'French',
      category: SkillCategory.LANGUAGE,
      proficiencyLevel: 'Professionnel',
    });
  });

  it('should handle invalid skill categories', async () => {
    geminiClient.generateContent.mockResolvedValueOnce(`{
      "skills": [
        {
          "name": "Invalid Skill",
          "level": "expert",
          "category": "invalid_category"
        }
      ]
    }`);

    const updateSpy = jest.spyOn(candidateModel, 'findByIdAndUpdate');
    
    await service.extractSkillsFromCV('test.pdf', 'candidate123');

    // Should not update skills when all are invalid
    expect(updateSpy).not.toHaveBeenCalled();
  });
});