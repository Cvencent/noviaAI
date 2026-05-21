/**
 * SkillSandbox - Provides isolated execution environment for skills.
 * 
 * Features:
 * - Timeout enforcement
 * - Output capture
 * - Error isolation
 * - Resource limits
 */

import { Skill } from './SkillLoader';

export interface SandboxResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  duration: number;
  timedOut: boolean;
}

export interface SandboxConfig {
  defaultTimeout: number;
  maxOutputSize: number;
  allowedCommands: string[];
}

const DEFAULT_CONFIG: SandboxConfig = {
  defaultTimeout: 30000, // 30 seconds
  maxOutputSize: 1024 * 1024, // 1MB
  allowedCommands: ['node', 'python', 'bash', 'sh'],
};

export class SkillSandbox {
  private config: SandboxConfig;

  constructor(config?: Partial<SandboxConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a skill in the sandbox.
   */
  async execute(skill: Skill, input: string): Promise<SandboxResult> {
    const startTime = Date.now();
    const timeout = skill.timeout || this.config.defaultTimeout;
    
    // Create timeout promise
    const timeoutPromise = new Promise<SandboxResult>((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          output: '',
          error: `Execution timed out after ${timeout}ms`,
          exitCode: -1,
          duration: timeout,
          timedOut: true,
        });
      }, timeout);
    });

    // Create execution promise
    const executionPromise = this.executeSkill(skill, input);

    // Race between execution and timeout
    const result = await Promise.race([executionPromise, timeoutPromise]);
    result.duration = Date.now() - startTime;
    
    return result;
  }

  /**
   * Execute a command in the sandbox.
   */
  async executeCommand(command: string, timeout?: number): Promise<SandboxResult> {
    const startTime = Date.now();
    const executionTimeout = timeout || this.config.defaultTimeout;
    
    // Validate command is allowed
    const commandName = command.split(' ')[0];
    if (!this.config.allowedCommands.includes(commandName)) {
      return {
        success: false,
        output: '',
        error: `Command not allowed: ${commandName}`,
        exitCode: -1,
        duration: 0,
        timedOut: false,
      };
    }

    // Create timeout promise
    const timeoutPromise = new Promise<SandboxResult>((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          output: '',
          error: `Command timed out after ${executionTimeout}ms`,
          exitCode: -1,
          duration: executionTimeout,
          timedOut: true,
        });
      }, executionTimeout);
    });

    // Create execution promise
    const executionPromise = this.runCommand(command);

    // Race between execution and timeout
    const result = await Promise.race([executionPromise, timeoutPromise]);
    result.duration = Date.now() - startTime;
    
    return result;
  }

  /**
   * Internal skill execution logic.
   */
  private async executeSkill(skill: Skill, input: string): Promise<SandboxResult> {
    try {
      // If skill has a command, execute it
      if (skill.command) {
        return this.runCommand(skill.command);
      }

      // Otherwise, simulate execution (in real implementation, this would call an AI model)
      const output = await this.simulateExecution(skill, input);
      
      return {
        success: true,
        output,
        exitCode: 0,
        duration: 0,
        timedOut: false,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        duration: 0,
        timedOut: false,
      };
    }
  }

  /**
   * Simulate skill execution (placeholder for actual implementation).
   */
  private async simulateExecution(skill: Skill, input: string): Promise<string> {
    // This is a placeholder. In real implementation, this would:
    // 1. Send the skill prompt and input to an AI model
    // 2. Capture the response
    // 3. Apply any post-processing
    
    return `[Skill: ${skill.name}]\n\nProcessed input:\n${input}\n\n[Execution completed]`;
  }

  /**
   * Run a system command with output capture.
   */
  private async runCommand(command: string): Promise<SandboxResult> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve) => {
      const parts = command.split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);
      
      const child = spawn(cmd, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
        // Enforce output size limit
        if (stdout.length > this.config.maxOutputSize) {
          child.kill();
          resolve({
            success: false,
            output: stdout.substring(0, this.config.maxOutputSize),
            error: 'Output size limit exceeded',
            exitCode: -1,
            duration: 0,
            timedOut: false,
          });
        }
      });

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code: number | null) => {
        resolve({
          success: code === 0,
          output: stdout,
          error: code !== 0 ? stderr : undefined,
          exitCode: code || 0,
          duration: 0,
          timedOut: false,
        });
      });

      child.on('error', (error: Error) => {
        resolve({
          success: false,
          output: '',
          error: error.message,
          exitCode: -1,
          duration: 0,
          timedOut: false,
        });
      });
    });
  }
}
