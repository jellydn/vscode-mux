import { cwd, env } from 'node:process'
import { TerminalProfile, window, workspace } from 'vscode'

import { getLauncher } from './multiplexer'
import { getSessionName, getUniqueSessionName } from './session-manager'
import { logger } from './utils'

export const SESSION_NAME_PREFIX = 'CodeMux: '

// Track whether "don't show again" was clicked for missing multiplexer
let suppressMissingNotification = false

export function createTerminalProfileProvider() {
  return {
    async provideTerminalProfile() {
      const codemuxConfig = workspace.getConfiguration('codemux')
      const multiplexer = codemuxConfig.get<'tmux' | 'zellij'>('multiplexer', 'tmux')!
      const autoAttach = codemuxConfig.get<boolean>('autoAttach', true)!
      const strategy = codemuxConfig.get<'workspace' | 'folder' | 'custom'>('sessionNameStrategy', 'workspace')!
      const customName = codemuxConfig.get<string>('customSessionName', '')!

      const launcher = getLauncher(multiplexer)
      const installed = await launcher.checkInstalled()

      if (!installed) {
        logger.info(`${multiplexer} not found, falling back to shell`)
        showMissingMultiplexerNotification(multiplexer)
        return new TerminalProfile({ shellPath: env.SHELL || '/bin/bash' })
      }

      const workspaceFolders = workspace.workspaceFolders
      const folderPath = workspaceFolders?.[0]?.uri.fsPath

      const baseName = getSessionName(strategy, {
        workspaceName: workspace.name || undefined,
        folderPath,
        customName,
      })

      const sessionName = await getUniqueSessionName(baseName, launcher)
      const workspaceCwd = folderPath || cwd()
      const command = launcher.buildCommand(sessionName, workspaceCwd, autoAttach)
      const shell = env.SHELL || '/bin/bash'

      return new TerminalProfile({
        name: `${SESSION_NAME_PREFIX}${sessionName}`,
        shellPath: shell,
        shellArgs: ['-c', command],
        cwd: workspaceCwd,
      })
    },
  }
}

export async function handleKillSession(): Promise<void> {
  const terminal = window.activeTerminal
  if (!terminal) {
    window.showErrorMessage('No active terminal.')
    return
  }

  if (!terminal.name.startsWith(SESSION_NAME_PREFIX)) {
    window.showErrorMessage('Active terminal is not a CodeMux session.')
    return
  }

  const sessionName = terminal.name.slice(SESSION_NAME_PREFIX.length)
  const codemuxConfig = workspace.getConfiguration('codemux')
  const multiplexer = codemuxConfig.get<'tmux' | 'zellij'>('multiplexer', 'tmux')!
  const launcher = getLauncher(multiplexer)

  try {
    await launcher.killSession(sessionName)
    terminal.dispose()
    window.showInformationMessage(`Session "${sessionName}" killed.`)
  }
  catch (error) {
    logger.error('Failed to kill session', error)
    window.showErrorMessage(`Failed to kill session "${sessionName}".`)
  }
}

async function showMissingMultiplexerNotification(multiplexer: string): Promise<void> {
  if (suppressMissingNotification)
    return

  const result = await window.showWarningMessage(
    `${multiplexer} not found. Install it to use CodeMux.`,
    `Don't show again`,
  )

  if (result === `Don't show again`)
    suppressMissingNotification = true
}
