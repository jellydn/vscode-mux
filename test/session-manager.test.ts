import { describe, expect, it, vi } from 'vitest';
import type { IMuxLauncher } from '../src/multiplexer/types';
import {
  getSessionName,
  getUniqueSessionName,
  sanitizeSessionName,
  type SessionNameOptions
} from '../src/session-manager';

// ---------------------------------------------------------------------------
// sanitizeSessionName
// ---------------------------------------------------------------------------
describe('sanitizeSessionName', () => {
  describe('valid input handling', () => {
    it('passes through a clean alphanumeric name', () => {
      // Arrange: Clean input string
      const input = 'myproject';

      // Act: Sanitize the name
      const result = sanitizeSessionName(input);

      // Assert: Output unchanged
      expect(result).toBe('myproject');
    });

    it('handles mixed case alphanumeric characters', () => {
      // Arrange: Mixed case input
      const input = 'MyProject123';

      // Act: Sanitize the name
      const result = sanitizeSessionName(input);

      // Assert: Mixed case preserved
      expect(result).toBe('MyProject123');
    });
  });

  describe('special character replacement', () => {
    it('replaces spaces with hyphens', () => {
      const result = sanitizeSessionName('my project');
      expect(result).toBe('my-project');
    });

    it('replaces dots with hyphens', () => {
      const result = sanitizeSessionName('my.project');
      expect(result).toBe('my-project');
    });

    it('replaces colons with hyphens', () => {
      const result = sanitizeSessionName('C:Users');
      expect(result).toBe('C-Users');
    });

    it('replaces underscores with hyphens', () => {
      const result = sanitizeSessionName('my_project');
      expect(result).toBe('my-project');
    });

    it('replaces slashes with hyphens', () => {
      const result = sanitizeSessionName('path/to/project');
      expect(result).toBe('path-to-project');
    });
  });

  describe('consecutive character handling', () => {
    it('collapses consecutive special characters into a single hyphen', () => {
      const result = sanitizeSessionName('my...project');
      expect(result).toBe('my-project');
    });

    it('collapses multiple different special characters', () => {
      const result = sanitizeSessionName('my...project___test');
      expect(result).toBe('my-project-test');
    });
  });

  describe('trimming behavior', () => {
    it('trims leading hyphens', () => {
      const result = sanitizeSessionName('-myproject');
      expect(result).toBe('myproject');
    });

    it('trims trailing hyphens', () => {
      const result = sanitizeSessionName('myproject-');
      expect(result).toBe('myproject');
    });

    it('trims both leading and trailing hyphens', () => {
      const result = sanitizeSessionName('-myproject-');
      expect(result).toBe('myproject');
    });
  });

  describe('fallback behavior', () => {
    it('falls back to "session" for an empty string', () => {
      const result = sanitizeSessionName('');
      expect(result).toBe('session');
    });

    it('falls back to "session" when input contains only special characters', () => {
      const result = sanitizeSessionName('...');
      expect(result).toBe('session');
    });

    it('falls back to "session" for whitespace-only input', () => {
      const result = sanitizeSessionName('   ');
      expect(result).toBe('session');
    });
  });
});

// ---------------------------------------------------------------------------
// getSessionName
// ---------------------------------------------------------------------------
describe('getSessionName', () => {
  const baseOptions: SessionNameOptions = {
    workspaceName: 'My Workspace',
    folderPath: '/home/user/my-project',
    customName: ''
  };

  describe('workspace strategy', () => {
    it('returns the sanitized workspace name when strategy is "workspace"', () => {
      // Arrange & Act
      const result = getSessionName('workspace', baseOptions);

      // Assert: Uses workspace name, sanitized
      expect(result).toBe('My-Workspace');
    });

    it('falls back to folder basename when workspaceName is undefined', () => {
      // Arrange
      const options: SessionNameOptions = {
        ...baseOptions,
        workspaceName: undefined
      };

      // Act
      const result = getSessionName('workspace', options);

      // Assert: Falls back to folder name
      expect(result).toBe('my-project');
    });

    it('returns "session" when workspaceName is empty string (no fallback for falsy values)', () => {
      // Arrange: Empty string is falsy but the code only falls back on undefined
      const options: SessionNameOptions = {
        ...baseOptions,
        workspaceName: ''
      };

      // Act
      const result = getSessionName('workspace', options);

      // Assert: Empty string is sanitized to 'session', no fallback for empty strings
      expect(result).toBe('session');
    });
  });

  describe('folder strategy', () => {
    it('returns the sanitized folder basename when strategy is "folder"', () => {
      // Arrange
      const options: SessionNameOptions = {
        ...baseOptions,
        workspaceName: 'ws'
      };

      // Act
      const result = getSessionName('folder', options);

      // Assert: Uses folder basename
      expect(result).toBe('my-project');
    });

    it('returns "session" when folderPath is undefined', () => {
      // Arrange
      const options: SessionNameOptions = {
        workspaceName: 'ws',
        folderPath: undefined,
        customName: ''
      };

      // Act
      const result = getSessionName('folder', options);

      // Assert: Fallback to session
      expect(result).toBe('session');
    });

    it('handles nested folder paths correctly', () => {
      // Arrange
      const options: SessionNameOptions = {
        workspaceName: 'ws',
        folderPath: '/home/user/my-nested/project/folder',
        customName: ''
      };

      // Act
      const result = getSessionName('folder', options);

      // Assert: Uses only the basename
      expect(result).toBe('folder');
    });
  });

  describe('custom strategy', () => {
    it('returns the sanitized custom name when strategy is "custom"', () => {
      // Arrange
      const options: SessionNameOptions = {
        ...baseOptions,
        customName: 'My Custom Name'
      };

      // Act
      const result = getSessionName('custom', options);

      // Assert: Uses custom name
      expect(result).toBe('My-Custom-Name');
    });

    it('falls back to workspace strategy when customName is empty', () => {
      // Arrange & Act
      const result = getSessionName('custom', baseOptions);

      // Assert: Falls back to workspace
      expect(result).toBe('My-Workspace');
    });

    it('returns "session" when customName contains only special chars (no fallback for "session")', () => {
      // Arrange: Special chars get sanitized to 'session', which is truthy so no fallback
      const options: SessionNameOptions = {
        ...baseOptions,
        customName: '...'
      };

      // Act
      const result = getSessionName('custom', options);

      // Assert: '...' sanitizes to 'session', which doesn't trigger fallback
      expect(result).toBe('session');
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
    // Arrange
    const launcher = createMockLauncher(['other-session', 'another-one']);

    // Act
    const result = await getUniqueSessionName('myapp', launcher);

    // Assert
    expect(result).toBe('myapp');
  });

  it('appends -2 when the base name already exists', async () => {
    // Arrange
    const launcher = createMockLauncher(['myapp']);

    // Act
    const result = await getUniqueSessionName('myapp', launcher);

    // Assert
    expect(result).toBe('myapp-2');
  });

  it('appends -3 when baseName and baseName-2 exist', async () => {
    // Arrange
    const launcher = createMockLauncher(['myapp', 'myapp-2']);

    // Act
    const result = await getUniqueSessionName('myapp', launcher);

    // Assert
    expect(result).toBe('myapp-3');
  });

  it('finds next available number in a populated sequence', async () => {
    // Arrange
    const launcher = createMockLauncher(['myapp', 'myapp-2', 'myapp-3', 'myapp-5']);

    // Act
    const result = await getUniqueSessionName('myapp', launcher);

    // Assert
    expect(result).toBe('myapp-4');
  });

  it('handles non-sequential gaps correctly', async () => {
    // Arrange
    const launcher = createMockLauncher(['myapp', 'myapp-3', 'myapp-4']);

    // Act
    const result = await getUniqueSessionName('myapp', launcher);

    // Assert: myapp-2 is available
    expect(result).toBe('myapp-2');
  });

  it('does not call listSessions more than necessary', async () => {
    // Arrange
    const launcher = createMockLauncher(['myapp']);

    // Act
    await getUniqueSessionName('myapp', launcher);

    // Assert: Only called once for collision check
    expect(launcher.listSessions).toHaveBeenCalledTimes(1);
  });
});
