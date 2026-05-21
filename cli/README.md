# CLI Module

CLI tools for Novel AI platform, providing skill management, sandboxed execution, agent integration, and Q&A functionality.

## Features

- **SkillLoader**: Discovers, loads, and validates skills from the filesystem
- **SkillSandbox**: Provides isolated execution environment with timeout enforcement
- **AgentBridge**: Bridges skills to the agent system for execution
- **SkillQA**: Question and Answer functionality for skills
- **SkillExecutor**: Orchestrates skill execution with lifecycle events

## Installation

```bash
npm install
```

## Usage

```typescript
import { SkillExecutor } from '@novel-ai/cli';

const executor = new SkillExecutor();

// Discover skills
await executor.discoverSkills();

// List available skills
const skills = executor.listSkills();

// Execute a skill
const result = await executor.execute({
  skillId: 'code-review',
  userId: 'user-123',
  variables: {
    code: 'const x = 1;',
    language: 'typescript',
  },
  mode: 'agent',
});
```

## Skill Structure

Skills are stored in the `skills/` directory with the following structure:

```
skills/
  <skill-id>/
    SKILL.md          # Main skill definition (YAML frontmatter + markdown)
    config.yaml       # Optional configuration
    scripts/          # Optional scripts directory
```

### SKILL.md Format

```markdown
---
name: Skill Name
description: Skill description
version: 1.0.0
subagent_type: default
timeout: 60000
variables:
  - name: var_name
    description: Variable description
    required: true
    default: default_value
metadata:
  author: Author Name
  tags: [tag1, tag2]
  category: category
---

# Skill Prompt

The main prompt content goes here.
```

## Execution Modes

- **default**: Returns resolved prompt for external processing
- **agent**: Executes via agent system
- **cli**: Executes system commands
- **qa**: Question and Answer mode

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test
```

## Architecture

```
src/
  core/
    skills/
      SkillLoader.ts      # Skill discovery and loading
      SkillSandbox.ts     # Sandboxed execution environment
      AgentBridge.ts      # Agent system integration
      SkillQA.ts          # Q&A functionality
      SkillExecutor.ts    # Main orchestrator
      __tests__/          # Unit tests
  index.ts               # Public API exports
skills/                  # Skill definitions
```
