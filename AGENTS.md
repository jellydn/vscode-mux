# AGENTS.md - CodeMux Development Guide

CodeMux is a VS Code extension integrating terminal multiplexers (tmux/zellij). Built with TypeScript, reactive-vscode, and tsdown. Uses **bun** for package management.

## Build Commands

| Command | Description |
|---------|-------------|
| `nr build` | Compile TypeScript to `dist/index.cjs` |
| `nr dev` | Watch mode with sourcemaps |
| `nr typecheck` | TypeScript check without emit |
| `nr lint` | Lint with Biome |
| `nr format` | Format with Biome |
| `nr test` | Run all tests |
| `nr test -- test/session-manager.test.ts` | Run single test file |
| `nr test -- --reporter=verbose` | Verbose test output |
| `nr update` | Regenerate `src/generated/meta.ts` |
| `nr ext:package` | Create VSIX package |
| `nr release` | Version bump and git tag |

**Recommended**: `nr typecheck && nr format && nr lint && nr test`

## Code Style

### TypeScript
- Strict mode enabled with `strictNullChecks`
- Explicit types for parameters and return values
- Prefer interfaces over type aliases for objects
- Use `unknown` instead of `any`

### Imports (Biome enforces ordering)
```typescript
import { defineExtension } from 'reactive-vscode' // external
import { window } from 'vscode'                   // vscode API
import { config } from './config'                  // internal
```

### Naming Conventions
| Pattern | Convention | Example |
|---------|------------|---------|
| Variables/functions | camelCase | `sessionName` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_MUX` |
| Types/interfaces | PascalCase | `SessionConfig` |
| Files | kebab-case | `session-utils.ts` |
| VS Code commands | kebab-case | `codemux.killSession` |

### Error Handling
```typescript
try { await launchSession() }
catch (error) {
  logger.error('Failed to launch', error)
  window.showErrorMessage('Failed to launch session')
}
```
- Use `logger` from `src/utils.ts`
- Always show user feedback for VS Code operations
- Never swallow errors silently

### VS Code Extension Patterns
```typescript
import { defineExtension } from 'reactive-vscode'
import { defineConfig } from './config'

const { activate, deactivate } = defineExtension(() => {
  // Extension logic
})
export { activate, deactivate }
```
- Use `defineExtension` for registration
- Use `defineConfig` for settings
- Activate on `onStartupFinished`

### Formatting
- **Tool**: Biome v2 (linter + formatter, Prettier disabled)
- Enable format on save in IDE

## Project Structure

```
src/
├── index.ts          # Extension entry (activate/deactivate)
├── config.ts         # Configuration via defineConfig
├── utils.ts          # Logger utility
└── generated/
    └── meta.ts       # Auto-generated (run `nr update`)
test/
└── session-manager.test.ts  # Vitest suite
```

## Testing

- **Framework**: Vitest with `describe`/`it`/`test` blocks
- **Assertions**: Vitest's `expect`

```typescript
import { describe, expect, it } from 'vitest'
describe('session utils', () => {
  it('should sanitize session name', () => {
    expect(sanitizeSessionName('my project')).toBe('my-project')
  })
})
```

## Common Tasks

### Add configuration
1. Add to `package.json` → `contributes.configuration.properties`
2. Run `nr update`
3. Use `config` from `src/config.ts`

### Add command
1. Add to `package.json` → `contributes.commands`
2. Register in `src/index.ts` via `commands.registerCommand`
3. Export handler for testing

### Debug
Press F5 to launch extension host; rebuild with `nr dev`

## Dependencies

| Package | Purpose |
|---------|---------|
| `reactive-vscode` | Declarative VS Code API |
| `tsdown` | TypeScript bundler |
| `vitest` | Testing framework |
| `@biomejs/biome` | Linting + formatting |
| `@antfu/ni` | Script runner (`nr`) |
| `bun` | Package manager |

## Key Files

- `package.json` - npm scripts, extension manifest
- `tsconfig.json` - TypeScript config
- `biome.json` - Biome config
- `.vscode/settings.json` - IDE settings
- `src/index.ts` - Extension entry point
- `src/config.ts` - Configuration definitions
