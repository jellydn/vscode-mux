import { beforeEach, describe, expect, it, vi } from 'vitest';

type MockTerminal = { name: string };

const mockWindow = vi.hoisted(() => ({
  activeTerminal: undefined as MockTerminal | undefined,
  terminals: [] as MockTerminal[],
  showErrorMessage: vi.fn(),
  showQuickPick: vi.fn(),
  showWarningMessage: vi.fn()
}));

const mockWorkspace = vi.hoisted(() => ({
  getConfiguration: vi.fn(() => ({
    get: vi.fn((_key: string, fallback: unknown) => fallback),
    update: vi.fn()
  }))
}));

vi.mock('vscode', () => ({
  window: mockWindow,
  workspace: mockWorkspace,
  TerminalProfile: class {},
  Terminal: class {}
}));

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn()
}));

vi.mock('reactive-vscode', () => ({
  defineLogger: () => mockLogger
}));

import { resolveKillTargetTerminal, SESSION_NAME_PREFIX } from '../src/terminal-profile';

describe('resolveKillTargetTerminal', () => {
  beforeEach(() => {
    mockWindow.activeTerminal = undefined;
    mockWindow.terminals = [];
    mockWindow.showErrorMessage.mockReset();
    mockWindow.showQuickPick.mockReset();
  });

  it('returns active CodeMux terminal when available', async () => {
    const activeTerminal = { name: `${SESSION_NAME_PREFIX}alpha` };
    mockWindow.activeTerminal = activeTerminal;

    const result = await resolveKillTargetTerminal();

    expect(result).toBe(activeTerminal);
    expect(mockWindow.showQuickPick).not.toHaveBeenCalled();
    expect(mockWindow.showErrorMessage).not.toHaveBeenCalled();
  });

  it('shows error when no CodeMux terminals exist', async () => {
    const result = await resolveKillTargetTerminal();

    expect(result).toBeUndefined();
    expect(mockWindow.showErrorMessage).toHaveBeenCalledWith('No CodeMux sessions found.');
  });

  it('returns the only CodeMux terminal when it is the sole match', async () => {
    const terminal = { name: `${SESSION_NAME_PREFIX}solo` };
    mockWindow.terminals = [terminal];

    const result = await resolveKillTargetTerminal();

    expect(result).toBe(terminal);
    expect(mockWindow.showQuickPick).not.toHaveBeenCalled();
  });

  it('prompts to select a terminal when multiple matches exist', async () => {
    const first = { name: `${SESSION_NAME_PREFIX}one` };
    const second = { name: `${SESSION_NAME_PREFIX}two` };
    mockWindow.terminals = [first, second];
    mockWindow.showQuickPick.mockResolvedValue({ label: second.name, terminal: second });

    const result = await resolveKillTargetTerminal();

    expect(mockWindow.showQuickPick).toHaveBeenCalledTimes(1);
    expect(result).toBe(second);
  });
});
