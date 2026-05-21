/**
 * SkillExecutor - Orchestrates skill execution with sandbox, agent, CLI, and Q&A support.
 * 
 * Flow:
 * 1. discoverSkills() - scan skill directories
 * 2. loadSkill(id) - parse SKILL.md + config
 * 3. resolveVariables() - interpolate {{variables}}
 * 4. execute() - dispatch to sandbox/agent/cli/qa
 * 5. emit lifecycle events throughout
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import { Skill, SkillConfig, SkillLoader } from './SkillLoader';
import { SkillSandbox, SandboxResult } from './SkillSandbox';
import { AgentBridge, AgentExecutionResult } from './AgentBridge';
import { SkillQA, AnswerResult } from './SkillQA';

export interface ExecutionRequest {
  skillId: string;
  userId: string;
  variables?: Record<string, string>;
  mode?: 'default' | 'agent' | 'cli' | 'qa';
  question?: string;
  input?: string;
  args?: Record<string, unknown>;
}

export interface ExecutionResult {
  success: boolean;
  skillId: string;
  mode: string;
  output?: string;
  answer?: string;
  error?: string;
  duration: number;
}

type LifecycleEvent = 
  | 'skill:discovered'
  | 'skill:loaded'
  | 'skill:validation_error'
  | 'execution:start'
  | 'execution:complete'
  | 'execution:error'
  | 'sandbox:start'
  | 'sandbox:complete'
  | 'sandbox:timeout'
  | 'agent:start'
  | 'agent:complete'
  | 'agent:error'
  | 'cli:start'
  | 'cli:complete'
  | 'cli:error'
  | 'qa:question'
  | 'qa:answer';

export class SkillExecutor extends EventEmitter {
  private loader: SkillLoader;
  private sandbox: SkillSandbox;
  private agentBridge: AgentBridge;
  private qa: SkillQA;
  private skills: Map<string, Skill> = new Map();
  private initialized = false;

  constructor(loader?: SkillLoader) {
    super();
    this.loader = loader || new SkillLoader();
    this.sandbox = new SkillSandbox();
    this.agentBridge = new AgentBridge();
    this.qa = new SkillQA();
  }

  /**
   * Discover and register all skills from default directories.
   */
  async discoverSkills(): Promise<void> {
    const discovered = await this.loader.discoverSkills();
    
    for (const skill of discovered) {
      const validation = this.loader.validateSkill(skill);
      if (validation.valid) {
        this.skills.set(skill.id, skill);
        this.emitLifecycle('skill:discovered', { skillId: skill.id, name: skill.name });
      } else {
        this.emitLifecycle('skill:validation_error', {
          skillId: skill.id,
          errors: validation.errors,
        });
      }
    }
    
    this.initialized = true;
  }

  /**
   * Load a specific skill by ID, or discover all if not initialized.
   */
  async loadSkill(skillId: string): Promise<Skill | undefined> {
    if (!this.initialized) {
      await this.discoverSkills();
    }
    return this.skills.get(skillId);
  }

  /**
   * List all registered skills.
   */
  listSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Resolve {{variables}} in a string.
   */
  resolveVariables(template: string, variables: Record<string, string>): string {
    return this.loader.resolveVariables(template, variables);
  }

  /**
   * Execute a skill based on the request.
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    // Ensure skill is loaded
    const skill = await this.loadSkill(request.skillId);
    if (!skill) {
      return {
        success: false,
        skillId: request.skillId,
        mode: request.mode || 'default',
        error: `Skill not found: ${request.skillId}`,
        duration: Date.now() - startTime,
      };
    }

    // Validate required variables
    const missingVars = this.loader.getMissingVariables(skill, request.variables || {});
    if (missingVars.length > 0) {
      return {
        success: false,
        skillId: request.skillId,
        mode: request.mode || 'default',
        error: `Missing required variables: ${missingVars.join(', ')}`,
        duration: Date.now() - startTime,
      };
    }

    // Resolve variables in prompt
    const resolvedPrompt = this.resolveVariables(skill.prompt, request.variables || {});
    
    this.emitLifecycle('execution:start', {
      skillId: request.skillId,
      mode: request.mode || 'default',
      userId: request.userId,
    });

    try {
      let result: ExecutionResult;

      switch (request.mode) {
        case 'agent':
          result = await this.executeAgent(skill, resolvedPrompt, request);
          break;
        case 'cli':
          result = await this.executeCli(skill, resolvedPrompt, request);
          break;
        case 'qa':
          result = await this.executeQa(skill, resolvedPrompt, request);
          break;
        case 'default':
        default:
          result = await this.executeDefault(skill, resolvedPrompt, request);
          break;
      }

      result.duration = Date.now() - startTime;
      this.emitLifecycle('execution:complete', {
        skillId: request.skillId,
        mode: result.mode,
        success: result.success,
      });
      return result;
    } catch (error) {
      const errResult: ExecutionResult = {
        success: false,
        skillId: request.skillId,
        mode: request.mode || 'default',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
      this.emitLifecycle('execution:error', { skillId: request.skillId, error: errResult.error });
      return errResult;
    }
  }

  /**
   * Execute in sandbox mode (safe, isolated).
   */
  async executeInSandbox(skill: Skill, input: string): Promise<SandboxResult> {
    this.emitLifecycle('sandbox:start', { skillId: skill.id });
    const result = await this.sandbox.execute(skill, input);
    this.emitLifecycle('sandbox:complete', { skillId: skill.id, success: result.success });
    return result;
  }

  /**
   * Execute via agent mode.
   */
  private async executeAgent(
    skill: Skill,
    prompt: string,
    request: ExecutionRequest,
  ): Promise<ExecutionResult> {
    this.emitLifecycle('agent:start', { skillId: skill.id, subagentType: skill.subagent_type });
    
    const result = await this.agentBridge.execute({
      skill,
      prompt,
      userId: request.userId,
      variables: request.variables,
      args: request.args,
    });

    if (result.success) {
      this.emitLifecycle('agent:complete', { skillId: skill.id });
    } else {
      this.emitLifecycle('agent:error', { skillId: skill.id, error: result.error });
    }

    return {
      success: result.success,
      skillId: skill.id,
      mode: 'agent',
      output: result.output,
      error: result.error,
      duration: 0, // Will be set by caller
    };
  }

  /**
   * Execute via CLI mode.
   */
  private async executeCli(
    skill: Skill,
    prompt: string,
    request: ExecutionRequest,
  ): Promise<ExecutionResult> {
    if (!skill.command) {
      return {
        success: false,
        skillId: skill.id,
        mode: 'cli',
        error: 'Skill does not have a command configured',
        duration: 0,
      };
    }

    this.emitLifecycle('cli:start', { skillId: skill.id, command: skill.command });
    
    const resolvedCommand = this.resolveVariables(skill.command, request.variables || {});
    const result = await this.sandbox.executeCommand(resolvedCommand, skill.timeout);

    if (result.success) {
      this.emitLifecycle('cli:complete', { skillId: skill.id });
    } else {
      this.emitLifecycle('cli:error', { skillId: skill.id, error: result.error });
    }

    return {
      success: result.success,
      skillId: skill.id,
      mode: 'cli',
      output: result.output,
      error: result.error,
      duration: 0,
    };
  }

  /**
   * Execute in Q&A mode.
   */
  private async executeQa(
    skill: Skill,
    prompt: string,
    request: ExecutionRequest,
  ): Promise<ExecutionResult> {
    this.emitLifecycle('qa:question', { skillId: skill.id, question: request.question });
    
    const result = await this.qa.answer({
      skill,
      question: request.question || '',
      prompt,
      variables: request.variables,
    });

    this.emitLifecycle('qa:answer', { skillId: skill.id, confidence: result.confidence });

    return {
      success: result.success,
      skillId: skill.id,
      mode: 'qa',
      answer: result.answer,
      error: result.error,
      duration: 0,
    };
  }

  /**
   * Execute in default mode (returns resolved prompt for external processing).
   */
  private async executeDefault(
    skill: Skill,
    prompt: string,
    request: ExecutionRequest,
  ): Promise<ExecutionResult> {
    return {
      success: true,
      skillId: skill.id,
      mode: 'default',
      output: prompt,
      duration: 0,
    };
  }

  /**
   * Emit a lifecycle event with data.
   */
  private emitLifecycle(event: LifecycleEvent, data: Record<string, unknown>): void {
    this.emit(event, {
      timestamp: new Date().toISOString(),
      ...data,
    });
  }
}
