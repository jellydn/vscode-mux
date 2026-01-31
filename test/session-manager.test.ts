import { describe, expect, it, vi } from 'vitest';
import type { IMuxLauncher } from '../src/multiplexer/types';
import { getSessionName, getUniqueSessionName, type SessionNameOptions } from '../src/session-manager';

// ---------------------------------------------------------------------------
// getSessionName (covers sanitizeSessionName behavior)
// ---------------------------------------------------------------------------
describe('getSessionName', () => {
  const baseOptions: SessionNameOptions = {
    workspaceName: 'My Workspace',
    folderPath: '/home/user/my-project',
    customName: ''
  };

  describe('input handling', () => {
    it('passes through a clean alphanumeric name', () => {
      const result = getSessionName('workspace', { ...baseOptions, workspaceName: 'myproject' });
      expect(result).toBe('myproject');
    });

    it('handles mixed case alphanumeric characters', () => {
      const result = getSessionName('workspace', { ...baseOptions, workspaceName: 'MyProject123' });
      expect(result).toBe('MyProject123');
    });
  });

  describe('special character replacement', () => {
    it('replaces spaces with hyphens', () => {
      const result = getSessionName('workspace', { ...baseOptions, workspaceName: 'my project' });
      expect(result).toBe('my-project');
    });

    it('replaces dots with hyphens', () => {
      const result = getSessionName('workspace', { ...baseOptions, workspaceName: 'my.project' });
      expect(result).toBe('my-project');
    });

    it('replaces underscores with hyphens', () => {
      const result = getSessionName('workspace', { ...baseOptions, workspaceName: 'my_project' });
      expect(result).toBe('my-project');
    });
  });

  describe('consecutive character handling', () => {
    it('collapses consecutive special characters into a single hyphen', () => {
      const result = getSessionName('workspace', { ...baseOptions, workspaceName: 'my...project' });
      expect(result).toBe('my-project');
    });
  });

  describe('trimming behavior', () => {
    it('trims leading and trailing hyphens', () => {
      const result = getSessionName('workspace', { ...baseOptions, workspaceName: '-myproject-' });
      expect(result).toBe('myproject');
    });
  });

  describe('fallback behavior', () => {
    it('falls back to "session" for empty string', () => {
      const result = getSessionName('workspace', { ...baseOptions, workspaceName: '' });
      expect(result).toBe('session');
    });

    it('falls back to "session" when input contains only special characters', () => {
      const result = getSessionName('workspace', { ...baseOptions, workspaceName: '...' });
      expect(result).toBe('session');
    });
  });

  describe('workspace strategy', () => {
    it('returns the sanitized workspace name when strategy is "workspace"', () => {
      const result = getSessionName('workspace', baseOptions);
      expect(result).toBe('My-Workspace');
    });

    it('falls back to folder basename when workspaceName is undefined', () => {
      const options: SessionNameOptions = { ...baseOptions, workspaceName: undefined };
      const result = getSessionName('workspace', options);
      expect(result).toBe('my-project');
    });
  });

  describe('folder strategy', () => {
    it('returns the sanitized folder basename when strategy is "folder"', () => {
      const result = getSessionName('folder', baseOptions);
      expect(result).toBe('my-project');
    });

    it('returns "session" when folderPath is undefined', () => {
      const options: SessionNameOptions = { workspaceName: 'ws', folderPath: undefined, customName: '' };
      const result = getSessionName('folder', options);
      expect(result).toBe('session');
    });

    it('handles nested folder paths correctly', () => {
      const options: SessionNameOptions = { ...baseOptions, workspaceName: 'ws' };
      const result = getSessionName('folder', options);
      expect(result).toBe('my-project');
    });
  });

  describe('custom strategy', () => {
    it('returns the sanitized custom name when strategy is "custom"', () => {
      const options: SessionNameOptions = { ...baseOptions, customName: 'My Custom Name' };
      const result = getSessionName('custom', options);
      expect(result).toBe('My-Custom-Name');
    });

    it('falls back to workspace strategy when customName is empty', () => {
      const result = getSessionName('custom', baseOptions);
      expect(result).toBe('My-Workspace');
    });
  });
});

// ---------------------------------------------------------------------------
// getUniqueSessionName
// ---------------------------------------------------------------------------
describe('getUniqueSessionName', () => {
  function createMockLauncher(sessions: string[]): IMuxLauncher {
    return {
      buildCommand: vi.fn(),
      listSessions: vi.fn().mockResolvedValue(sessions),
      killSession: vi.fn(),
      checkInstalled: vi.fn()
    };
  }

  it('returns the base name when no collision exists', async () => {
    const launcher = createMockLauncher(['other-session', 'another-one']);
    const result = await getUniqueSessionName('myapp', launcher);
    expect(result).toBe('myapp');
  });

  it('appends -2 when the base name already exists', async () => {
    const launcher = createMockLauncher(['myapp']);
    const result = await getUniqueSessionName('myapp', launcher);
    expect(result).toBe('myapp-2');
  });

  it('appends -3 when baseName and baseName-2 exist', async () => {
    const launcher = createMockLauncher(['myapp', 'myapp-2']);
    const result = await getUniqueSessionName('myapp', launcher);
    expect(result).toBe('myapp-3');
  });

  it('finds next available number in a populated sequence', async () => {
    const launcher = createMockLauncher(['myapp', 'myapp-2', 'myapp-3', 'myapp-5']);
    const result = await getUniqueSessionName('myapp', launcher);
    expect(result).toBe('myapp-4');
  });

  it('does not call listSessions more than necessary', async () => {
    const launcher = createMockLauncher(['myapp']);
    await getUniqueSessionName('myapp', launcher);
    expect(launcher.listSessions).toHaveBeenCalledTimes(1);
  });
});
