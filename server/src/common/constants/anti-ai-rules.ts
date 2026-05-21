/**
 * 反 AI 味约束规则 — 被 ContextBuilderService 和 StyleApplicationService 共用。
 * 修改时只需改此处，两处引用自动同步。
 */
export const DEFAULT_ANTI_AI_RULES: readonly string[] = [
  '避免总结式升华，例如"这一刻，他终于明白"。',
  '避免模板化转折，例如"然而，他不知道的是"。',
  '减少空泛形容词，优先使用具体动作和可感知细节。',
  '减少"空气凝固""命运齿轮转动"等通用氛围句。',
  '减少过度工整的排比结构，保留自然节奏。',
  '减少直接解释情绪，优先通过动作、停顿和选择表达。',
]
