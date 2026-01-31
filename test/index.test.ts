import type { IMuxLauncher } from '../src/multiplexer/types'
import { describe, expect, it, vi } from 'vitest'
import { TmuxLauncher } from '../src/multiplexer/tmux'
import { ZellijLauncher } from '../src/multiplexer/zellij'
import { getSessionName, getUniqueSessionName, sanitizeSessionName } from '../src/session-manager'

// ---------------------------------------------------------------------------
// sanitizeSessionName
// ---------------------------------------------------------------------------
describe('sanitizeSessionName', () => {
  it('passes through a clean alphanumeric name', () => {
    expect(sanitizeSessionName('myproject')).toBe('myproject')
  })

  it('replaces spaces with hyphens', () => {
    expect(sanitizeSessionName('my project')).toBe('my-project')
  })

  it('replaces dots with hyphens', () => {
    expect(sanitizeSessionName('my.project')).toBe('my-project')
  })

  it('replaces colons with hyphens', () => {
    expect(sanitizeSessionName('C:Users')).toBe('C-Users')
  })

  it('collapses consecutive special characters into a single hyphen', () => {
    expect(sanitizeSessionName('my...project')).toBe('my-project')
  })

  it('trims leading and trailing hyphens', () => {
    expect(sanitizeSessionName('-myproject-')).toBe('myproject')
  })

  it('falls back to "session" for an empty string', () => {
    expect(sanitizeSessionName('')).toBe('session')
  })

  it('falls back to "session" when input contains only special characters', () => {
    expect(sanitizeSessionName('...')).toBe('session')
  })
})

// ---------------------------------------------------------------------------
// getSessionName
// ---------------------------------------------------------------------------
describe('getSessionName', () => {
  it('returns the sanitized workspace name when strategy is "workspace"', () => {
    const result = getSessionName('workspace', {
      workspaceName: 'My Workspace',
      folderPath: '/home/user/project',
      customName: '',
    })
    expect(result).toBe('My-Workspace')
  })

  it('falls back to folder basename when strategy is "workspace" and workspaceName is undefined', () => {
    const result = getSessionName('workspace', {
      workspaceName: undefined,
      folderPath: '/home/user/my-project',
      customName: '',
    })
    expect(result).toBe('my-project')
  })

  it('returns the sanitized folder basename when strategy is "folder"', () => {
    const result = getSessionName('folder', {
      workspaceName: 'ws',
      folderPath: '/home/user/my.project',
      customName: '',
    })
    expect(result).toBe('my-project')
  })

  it('returns "session" when strategy is "folder" and folderPath is undefined', () => {
    const result = getSessionName('folder', {
      workspaceName: 'ws',
      folderPath: undefined,
      customName: '',
    })
    expect(result).toBe('session')
  })

  it('returns the sanitized custom name when strategy is "custom"', () => {
    const result = getSessionName('custom', {
      workspaceName: 'ws',
      folderPath: '/home/user/project',
      customName: 'My Custom Name',
    })
    expect(result).toBe('My-Custom-Name')
  })

  it('falls back to workspace strategy when strategy is "custom" and customName is empty', () => {
    const result = getSessionName('custom', {
      workspaceName: 'MyWorkspace',
      folderPath: '/home/user/project',
      customName: '',
    })
    expect(result).toBe('MyWorkspace')
  })
})

// ---------------------------------------------------------------------------
// getUniqueSessionName
// ---------------------------------------------------------------------------
function mockLauncher(sessions: string[]): IMuxLauncher {
  return {
    buildCommand: vi.fn(),
    listSessions: vi.fn().mockResolvedValue(sessions),
    killSession: vi.fn(),
    checkInstalled: vi.fn(),
  }
}

describe('getUniqueSessionName', () => {
  it('returns the base name when no collision exists', async () => {
    const launcher = mockLauncher(['other-session'])
    const result = await getUniqueSessionName('myapp', launcher)
    expect(result).toBe('myapp')
  })

  it('returns baseName-2 when the base name already exists', async () => {
    const launcher = mockLauncher(['myapp'])
    const result = await getUniqueSessionName('myapp', launcher)
    expect(result).toBe('myapp-2')
  })

  it('returns baseName-3 when both baseName and baseName-2 exist', async () => {
    const launcher = mockLauncher(['myapp', 'myapp-2'])
    const result = await getUniqueSessionName('myapp', launcher)
    expect(result).toBe('myapp-3')
  })
})

// ---------------------------------------------------------------------------
// TmuxLauncher.buildCommand
// ---------------------------------------------------------------------------
describe('tmuxLauncher.buildCommand', () => {
  const launcher = new TmuxLauncher()

  it('includes the -A flag when autoAttach is true', () => {
    const cmd = launcher.buildCommand('work', '/home/user/project', true)
    expect(cmd).toBe('tmux new-session -A -s work -c /home/user/project')
  })

  it('omits the -A flag when autoAttach is false', () => {
    const cmd = launcher.buildCommand('work', '/home/user/project', false)
    expect(cmd).toBe('tmux new-session -s work -c /home/user/project')
  })
})

// ---------------------------------------------------------------------------
// ZellijLauncher.buildCommand
// ---------------------------------------------------------------------------
describe('zellijLauncher.buildCommand', () => {
  const launcher = new ZellijLauncher()

  it('uses attach-or-create pattern when autoAttach is true', () => {
    const cmd = launcher.buildCommand('work', '/home/user/project', true)
    expect(cmd).toBe('zellij attach work || zellij -s work -c /home/user/project')
  })

  it('uses only the create command when autoAttach is false', () => {
    const cmd = launcher.buildCommand('work', '/home/user/project', false)
    expect(cmd).toBe('zellij -s work -c /home/user/project')
  })
})
