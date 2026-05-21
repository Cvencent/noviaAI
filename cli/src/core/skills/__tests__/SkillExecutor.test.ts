/**
 * Test file for SkillExecutor and related modules.
 */

import { SkillLoader, Skill } from '../SkillLoader';
import { SkillExecutor, ExecutionRequest } from '../SkillExecutor';

describe('SkillLoader', () => {
  let loader: SkillLoader;

  beforeEach(() => {
    loader = new SkillLoader();
  });

  test('should resolve variables in template', () => {
    const template = 'Hello {{name}}, welcome to {{project}}!';
    const variables = { name: 'Alice', project: 'NovelAI' };
    const result = loader.resolveVariables(template, variables);
    expect(result).toBe('Hello Alice, welcome to NovelAI!');
  });

  test('should validate skill correctly', () => {
    const validSkill: Skill = {
      id: 'test-skill',
      name: 'Test Skill',
      description: 'A test skill',
      version: '1.0.0',
      prompt: 'Test prompt',
      variables: [],
      metadata: {},
      filePath: '/test/path',
    };

    const validation = loader.validateSkill(validSkill);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should detect missing required fields', () => {
    const invalidSkill: Skill = {
      id: '',
      name: '',
      description: 'A test skill',
      version: '1.0.0',
      prompt: '',
      variables: [],
      metadata: {},
      filePath: '/test/path',
    };

    const validation = loader.validateSkill(invalidSkill);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Skill ID is required');
    expect(validation.errors).toContain('Skill name is required');
    expect(validation.errors).toContain('Skill prompt is required');
  });

  test('should get missing variables', () => {
    const skill: Skill = {
      id: 'test-skill',
      name: 'Test Skill',
      description: 'A test skill',
      version: '1.0.0',
      prompt: 'Test prompt',
      variables: [
        { name: 'required_var', description: 'A required variable', required: true },
        { name: 'optional_var', description: 'An optional variable', required: false },
        { name: 'default_var', description: 'A variable with default', required: true, default: 'default' },
      ],
      metadata: {},
      filePath: '/test/path',
    };

    const missing = loader.getMissingVariables(skill, { required_var: 'value' });
    expect(missing).toHaveLength(0);
  });

  test('should detect missing required variables', () => {
    const skill: Skill = {
      id: 'test-skill',
      name: 'Test Skill',
      description: 'A test skill',
      version: '1.0.0',
      prompt: 'Test prompt',
      variables: [
        { name: 'required_var', description: 'A required variable', required: true },
      ],
      metadata: {},
      filePath: '/test/path',
    };

    const missing = loader.getMissingVariables(skill, {});
    expect(missing).toContain('required_var');
  });
});

describe('SkillExecutor', () => {
  let executor: SkillExecutor;

  beforeEach(() => {
    executor = new SkillExecutor();
  });

  test('should return error for unknown skill', async () => {
    const request: ExecutionRequest = {
      skillId: 'unknown-skill',
      userId: 'test-user',
    };

    const result = await executor.execute(request);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Skill not found');
  });

  test('should resolve variables correctly', () => {
    const template = 'Process {{input}} for {{user}}';
    const variables = { input: 'test data', user: 'Alice' };
    const result = executor.resolveVariables(template, variables);
    expect(result).toBe('Process test data for Alice');
  });
});
