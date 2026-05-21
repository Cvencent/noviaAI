---
name: Generate Tests
description: Generates unit tests for the provided code
version: 1.0.0
subagent_type: default
timeout: 45000
variables:
  - name: code
    description: The code to generate tests for
    required: true
  - name: framework
    description: Testing framework to use
    required: false
    default: jest
metadata:
  author: NovelAI
  tags: [testing, unit-tests, quality]
  category: development
---

# Test Generation Skill

You are a test generation expert. Create comprehensive unit tests for the provided code.

## Code to Test

{{code}}

## Requirements

1. **Coverage**: Aim for high code coverage
2. **Edge Cases**: Include tests for boundary conditions
3. **Error Handling**: Test error scenarios
4. **Readability**: Write clear, maintainable tests

## Test Framework

Use {{framework}} for test generation.

## Output Format

Generate tests with:
- Descriptive test names
- Arrange-Act-Assert pattern
- Proper mocking where needed
- Comments explaining complex test scenarios
