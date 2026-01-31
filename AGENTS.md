# AGENTS.md - CodeMux Development Guide

## Project Overview

CodeMux is a VS Code extension that integrates terminal multiplexers (tmux/zellij) into VS Code's terminal. Built with TypeScript, reactive-vscode, and tsdown.

## Build Commands

| Command | Description |
|---------|-------------|
| `nr build` | Compile TypeScript with tsdown to `dist/index.cjs` |
| `nr dev` | Build in watch mode with sourcemaps |
| `nr typecheck` | Run TypeScript compiler without emitting (`tsc --noEmit`) |
| `nr lint` | Lint all files with ESLint (`eslint .`) |
| `nr test` | Run Vitest suite |
| `nr test -- <pattern>` | Run tests matching pattern (e.g., `nr test -- should`) |
| `nr test -- --reporter=verbose` | Run tests with verbose output |
| `nr update` | Regenerate `src/generated/meta.ts` from package.json |
| `nr ext:package` | Create VSIX package (`vsce package --no-dependencies`) |
| `nr release` | Release with bumpp for version bump and git tag |

**Recommended workflow**: Run `nr typecheck && nr lint && nr test` before committing.

## Code Style Guidelines

### General Principles

- Follow the "tidy first" approach: small, safe changes before features
- Write self-documenting code with meaningful names
- Separate tidying commits from behavior changes

### TypeScript

- **Strict mode enabled**: All strict compiler options are on
- **strictNullChecks**: Always handle null/undefined explicitly
- Use explicit types for function parameters and return values
- Prefer interfaces over type aliases for object shapes
- Use `unknown` instead of `any` when type is uncertain

### Imports

```typescript
// Standard import order (enforced by @antfu/eslint-config)
import { defineExtension } from 'reactive-vscode' // external
import { window } from 'vscode' // vscode API
import { config } from './config' // internal relative
import { logger } from './utils' // internal relative
```

- Use named imports from reactive-vscode for tree-shaking
- Group imports: external → vscode → internal relative
- ESLint handles import ordering automatically

### Naming Conventions

| Pattern | Convention | Example |
|---------|------------|---------|
| Variables/functions | camelCase | `sessionName`, `getWorkspaceFolder` |
| Constants | UPPER_SNAKE_CASE (if truly constant) | `DEFAULT_MULTIPLEXER` |
| Types/interfaces | PascalCase | `SessionConfig`, `IMuxLauncher` |
| Files | kebab-case | `session-utils.ts`, `config-handler.ts` |
| VS Code commands | kebab-case | `codemux.killSession` |

### Error Handling

```typescript
// Use try/catch with logger
try {
  await launchSession()
}
catch (error) {
  logger.error('Failed to launch session', error)
  window.showErrorMessage('Failed to launch session')
}
// Never swallow errors silently
// Always provide user feedback for VS Code operations
```

- Use the `logger` from `src/utils.ts` for consistent logging
- Show user-friendly notifications via `vscode.window` for errors
- Validate all user inputs and configuration values

### VS Code Extension Patterns

```typescript
// Use reactive-vscode for declarative extension definition
import { defineExtension } from 'reactives-vscode'

const { activate, deactivate } = defineExtension(() => {
  // Extension activation logic
  window.showInformationMessage('CodeMux activated')
})

export { activate, deactivate }
```

- Use `defineExtension` for cleaner extension registration
- Use `defineConfig` from `src/config.ts` for settings management
- Activate on `onStartupFinished` for minimal latency

### Formatting

- **Tool**: ESLint with @antfu/eslint-config (stylistic rules disabled in IDE)
- **Prettier**: Disabled (`"prettier.enable": false`)
- **Format on save**: Disabled; use `source.fixAll.eslint` via code actions
- Configure IDE to auto-fix ESLint issues on save (`.vscode/settings.json`)

## Project Structure

```
src/
├── index.ts          # Extension entry point (activate/deactivate)
├── config.ts         # Configuration via defineConfig
├── utils.ts          # Logger utility
└── generated/
    └── meta.ts       # Auto-generated from package.json (run `nr update`)
test/
└── index.test.ts     # Vitest test suite
```

## Testing

- **Framework**: Vitest
- **Pattern**: Use `describe` and `it`/`test` blocks
- **Assertions**: Use Vitest's `expect`

```typescript
import { describe, expect, it } from 'vitest'

describe('session utils', () => {
  it('should sanitize session name', () => {
    expect(sanitizeSessionName('my project')).toBe('my-project')
  })
})
```

## Common Tasks

### Add new configuration setting

1. Add to `package.json` `contributes.configuration.properties`
2. Run `nr update` to regenerate `src/generated/meta.ts`
3. Use `config` from `src/config.ts` to read value

### Add new command

1. Add to `package.json` `contributes.commands`
2. Register in `src/index.ts` using `commands.registerCommand`
3. Export command handler for testing

### Debug extension

1. Press F5 in VS Code to launch extension host
2. Extension will reload on rebuild (`nr dev`)
3. Check "Debug Console" for logs

## Dependencies

| Package | Purpose |
|---------|---------|
| `reactive-vscode` | Declarative VS Code extension API |
| `tsdown` | TypeScript bundler |
| `vitest` | Testing framework |
| `@antfu/eslint-config` | Linting and formatting |
| `@antfu/ni` | Script runner (`nr`) |

## Key Files

- `package.json:46-58` - npm scripts definition
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `.vscode/settings.json` - IDE settings for this project
