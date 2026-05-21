/**
 * AgentBridge - Bridges skills to the agent system for execution.
 * 
 * Features:
 * - Agent discovery and routing
 * - Execution context management
 * - Result handling
 * - Error recovery
 */

import { Skill } from './SkillLoader';

export interface AgentExecutionRequest {
  skill: Skill;
  prompt: string;
  userId: string;
  variables?: Record<string, string>;
  args?: Record<string, unknown>;
}

export interface AgentExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentConfig {
  defaultAgent: string;
  timeout: number;
  retryAttempts: number;
}

const DEFAULT_CONFIG: AgentConfig = {
  defaultAgent: 'default',
  timeout: 60000,
  retryAttempts: 3,
};

export class AgentBridge {
  private config: AgentConfig;
  private agents: Map<string, AgentHandler> = new Map();

  constructor(config?: Partial<AgentConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registerDefaultAgents();
  }

  /**
   * Register default agent handlers.
   */
  private registerDefaultAgents(): void {
    // Default agent - processes prompts directly
    this.agents.set('default', {
      execute: async (request: AgentExecutionRequest) => {
        return {
          success: true,
          output: `[Agent: default]\n\nPrompt processed:\n${request.prompt}`,
        };
      },
    });

    // Explore agent - for codebase exploration
    this.agents.set('explore', {
      execute: async (request: AgentExecutionRequest) => {
        return {
          success: true,
          output: `[Agent: explore]\n\nExploration task:\n${request.prompt}`,
        };
      },
    });

    // Librarian agent - for documentation and knowledge
    this.agents.set('librarian', {
      execute: async (request: AgentExecutionRequest) => {
        return {
          success: true,
          output: `[Agent: librarian]\n\nKnowledge task:\n${request.prompt}`,
        };
      },
    });
  }

  /**
   * Execute a skill via an agent.
   */
  async execute(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    const agentType = request.skill.subagent_type || this.config.defaultAgent;
    const agent = this.agents.get(agentType);

    if (!agent) {
      return {
        success: false,
        error: `Agent not found: ${agentType}`,
      };
    }

    // Retry logic
    let lastError: string | undefined;
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const result = await Promise.race([
          agent.execute(request),
          this.createTimeoutPromise(),
        ]);

        if (result.success) {
          return {
            ...result,
            agentId: agentType,
          };
        }

        lastError = result.error;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return {
      success: false,
      error: lastError || 'Execution failed after retries',
      agentId: agentType,
    };
  }

  /**
   * Register a custom agent handler.
   */
  registerAgent(name: string, handler: AgentHandler): void {
    this.agents.set(name, handler);
  }

  /**
   * Get available agent types.
   */
  getAvailableAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Create a timeout promise.
   */
  private createTimeoutPromise(): Promise<AgentExecutionResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          error: `Agent execution timed out after ${this.config.timeout}ms`,
        });
      }, this.config.timeout);
    });
  }
}

interface AgentHandler {
  execute: (request: AgentExecutionRequest) => Promise<AgentExecutionResult>;
}
