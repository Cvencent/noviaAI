export enum AIAction {
  TEXT_COMPLETION = 'TEXT_COMPLETION',           // 文本续写
  CONSISTENCY_CHECK = 'CONSISTENCY_CHECK',       // 一致性检查
  SUMMARY_GENERATION = 'SUMMARY_GENERATION',     // 摘要生成
  CHARACTER_GENERATION = 'CHARACTER_GENERATION', // 人物生成
  WORLD_BUILDING = 'WORLD_BUILDING',             // 世界观构建
  PLOT_SUGGESTION = 'PLOT_SUGGESTION',          // 情节建议
  DIALOGUE_GENERATION = 'DIALOGUE_GENERATION',  // 对话生成
  POLISH_REVISION = 'POLISH_REVISION',           // 润色修改
}

export enum AIProvider {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  DEEPSEEK = 'deepseek',
  MIMO = 'mimo',
}

export interface AIConfig {
  provider: AIProvider;
  model?: string;
  apiKeyId?: string;
  isActive?: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  provider: AIProvider;
  baseUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AIConfigMap {
  [action: string]: AIConfig;
}

export const AIActionLabels: Record<AIAction, string> = {
  [AIAction.TEXT_COMPLETION]: '文本续写',
  [AIAction.CONSISTENCY_CHECK]: '一致性检查',
  [AIAction.SUMMARY_GENERATION]: '摘要生成',
  [AIAction.CHARACTER_GENERATION]: '人物生成',
  [AIAction.WORLD_BUILDING]: '世界观构建',
  [AIAction.PLOT_SUGGESTION]: '情节建议',
  [AIAction.DIALOGUE_GENERATION]: '对话生成',
  [AIAction.POLISH_REVISION]: '润色修改',
};

export const AIActionDescriptions: Record<AIAction, string> = {
  [AIAction.TEXT_COMPLETION]: '根据上下文续写故事内容',
  [AIAction.CONSISTENCY_CHECK]: '检查人物设定、时间线等一致性',
  [AIAction.SUMMARY_GENERATION]: '为章节或项目生成摘要',
  [AIAction.CHARACTER_GENERATION]: '生成人物外貌、性格等描述',
  [AIAction.WORLD_BUILDING]: '扩展和完善世界观设定',
  [AIAction.PLOT_SUGGESTION]: '提供情节发展和冲突建议',
  [AIAction.DIALOGUE_GENERATION]: '生成自然的人物对话',
  [AIAction.POLISH_REVISION]: '润色和优化文字表达',
};

export const AIProviderLabels: Record<AIProvider, string> = {
  [AIProvider.OPENAI]: 'OpenAI (GPT)',
  [AIProvider.CLAUDE]: 'Anthropic (Claude)',
  [AIProvider.DEEPSEEK]: 'DeepSeek',
  [AIProvider.MIMO]: 'MiMo (小米)',
};

export const AIModelOptions: Record<AIProvider, string[]> = {
  [AIProvider.OPENAI]: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  [AIProvider.CLAUDE]: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  [AIProvider.DEEPSEEK]: ['deepseek-chat', 'deepseek-coder'],
  [AIProvider.MIMO]: ['mimo-v2.5-pro'],
};
