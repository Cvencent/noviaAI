/**
 * SkillLoader - Discovers, loads, and validates skills from the filesystem.
 * 
 * Skills are stored in directories with the following structure:
 *   skills/<skill-id>/
 *     SKILL.md          - Main skill definition (YAML frontmatter + markdown)
 *     config.yaml       - Optional configuration
 *     scripts/          - Optional scripts directory
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  prompt: string;
  variables: VariableDefinition[];
  command?: string;
  timeout?: number;
  subagent_type?: string;
  metadata: SkillMetadata;
  filePath: string;
}

export interface VariableDefinition {
  name: string;
  description: string;
  required: boolean;
  default?: string;
}

export interface SkillMetadata {
  author?: string;
  tags?: string[];
  category?: string;
  dependencies?: string[];
}

export interface SkillConfig {
  skillsDir?: string;
  autoDiscover?: boolean;
  allowedCommands?: string[];
  sandboxEnabled?: boolean;
}

interface FrontmatterData {
  name?: string;
  description?: string;
  version?: string;
  command?: string;
  timeout?: number;
  subagent_type?: string;
  variables?: VariableDefinition[];
  metadata?: SkillMetadata;
}

const DEFAULT_SKILLS_DIR = path.join(process.cwd(), 'skills');
const SKILL_FILE = 'SKILL.md';
const CONFIG_FILE = 'config.yaml';

export class SkillLoader {
  private skillsDir: string;
  private config: SkillConfig;

  constructor(config?: SkillConfig) {
    this.config = config || {};
    this.skillsDir = this.config.skillsDir || DEFAULT_SKILLS_DIR;
  }

  /**
   * Discover all skills in the skills directory.
   */
  async discoverSkills(): Promise<Skill[]> {
    const skills: Skill[] = [];
    
    try {
      const entries = await fs.readdir(this.skillsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillPath = path.join(this.skillsDir, entry.name);
          const skill = await this.loadSkillFromDirectory(entry.name, skillPath);
          if (skill) {
            skills.push(skill);
          }
        }
      }
    } catch (error) {
      // Skills directory doesn't exist or is empty
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
    
    return skills;
  }

  /**
   * Load a single skill by ID.
   */
  async loadSkill(skillId: string): Promise<Skill | undefined> {
    const skillPath = path.join(this.skillsDir, skillId);
    return this.loadSkillFromDirectory(skillId, skillPath);
  }

  /**
   * Load a skill from a directory path.
   */
  private async loadSkillFromDirectory(skillId: string, dirPath: string): Promise<Skill | undefined> {
    const skillFile = path.join(dirPath, SKILL_FILE);
    
    try {
      const content = await fs.readFile(skillFile, 'utf-8');
      const { frontmatter, body } = this.parseFrontmatter(content);
      
      const skill: Skill = {
        id: skillId,
        name: frontmatter.name || skillId,
        description: frontmatter.description || '',
        version: frontmatter.version || '1.0.0',
        prompt: body.trim(),
        variables: frontmatter.variables || [],
        command: frontmatter.command,
        timeout: frontmatter.timeout,
        subagent_type: frontmatter.subagent_type,
        metadata: frontmatter.metadata || {},
        filePath: skillFile,
      };
      
      return skill;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Parse YAML frontmatter from markdown content.
   */
  private parseFrontmatter(content: string): { frontmatter: FrontmatterData; body: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
      return { frontmatter: {}, body: content };
    }
    
    const yamlContent = match[1];
    const body = match[2];
    const frontmatter = this.parseSimpleYaml(yamlContent);
    
    return { frontmatter, body };
  }

  /**
   * Simple YAML parser for frontmatter (handles basic key-value pairs and arrays).
   */
  private parseSimpleYaml(yaml: string): FrontmatterData {
    const result: FrontmatterData = {};
    const lines = yaml.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      
      // Handle different value types
      if (value === '' || value === 'null') {
        continue;
      } else if (value === 'true') {
        (result as Record<string, unknown>)[key] = true;
      } else if (value === 'false') {
        (result as Record<string, unknown>)[key] = false;
      } else if (/^\d+$/.test(value)) {
        (result as Record<string, unknown>)[key] = parseInt(value, 10);
      } else if (/^\d+\.\d+$/.test(value)) {
        (result as Record<string, unknown>)[key] = parseFloat(value);
      } else if (value.startsWith('"') && value.endsWith('"')) {
        (result as Record<string, unknown>)[key] = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        (result as Record<string, unknown>)[key] = value.slice(1, -1);
      } else {
        (result as Record<string, unknown>)[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Validate a skill definition.
   */
  validateSkill(skill: Skill): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!skill.id) {
      errors.push('Skill ID is required');
    }
    
    if (!skill.name) {
      errors.push('Skill name is required');
    }
    
    if (!skill.prompt) {
      errors.push('Skill prompt is required');
    }
    
    if (skill.timeout !== undefined && (skill.timeout < 0 || skill.timeout > 300000)) {
      errors.push('Timeout must be between 0 and 300000ms');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Resolve {{variables}} in a template string.
   */
  resolveVariables(template: string, variables: Record<string, string>): string {
    let resolved = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${this.escapeRegex(key)}\\}\\}`, 'g');
      resolved = resolved.replace(regex, value);
    }
    
    return resolved;
  }

  /**
   * Get missing required variables for a skill.
   */
  getMissingVariables(skill: Skill, variables: Record<string, string>): string[] {
    const missing: string[] = [];
    
    for (const varDef of skill.variables) {
      if (varDef.required && !variables[varDef.name] && !varDef.default) {
        missing.push(varDef.name);
      }
    }
    
    return missing;
  }

  /**
   * Escape special regex characters in a string.
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
