import { basename } from 'node:path';
import { cwd, env } from 'node:process';
import { TerminalProfile, window, workspace } from 'vscode';

import { getLauncher } from './multiplexer';
import { getSessionName, getUniqueSessionName } from './session-manager';
import { logger } from './utils';

export const SESSION_NAME_PREFIX = 'CodeMux: ';

let suppressMissingNotification = false;
const LOGIN_SHELLS = new Set(['bash', 'zsh', 'fish', 'sh']);
let cachedSessionName: string | undefined;
let cachedBaseName: string | undefined;

interface CodemuxConfig {
  multiplexer: 'tmux' | 'zellij';
  autoAttach: boolean;
  strategy: 'workspace' | 'folder' | 'custom';
  customName: string;
  useCommandMode: boolean;
}

function getConfig(): CodemuxConfig {
  const codemuxConfig = workspace.getConfiguration('codemux');
  return {
    multiplexer: codemuxConfig.get('multiplexer', 'tmux'),
    autoAttach: codemuxConfig.get('autoAttach', true),
    strategy: codemuxConfig.get('sessionNameStrategy', 'workspace'),
    customName: codemuxConfig.get('customSessionName', ''),
    useCommandMode: codemuxConfig.get('useCommandMode', false)
  };
}

function getShellArgs(shellPath: string, command: string): string[] {
  const shellName = basename(shellPath);
  if (LOGIN_SHELLS.has(shellName)) return ['-l', '-c', command];
  return ['-c', command];
}

async function resolveSessionName(
  baseName: string,
  launcher: ReturnType<typeof getLauncher>,
  autoAttach: boolean
): Promise<string> {
  if (!autoAttach) return getUniqueSessionName(baseName, launcher);

  if (cachedSessionName && cachedBaseName === baseName) return cachedSessionName;

  const uniqueName = await getUniqueSessionName(baseName, launcher);
  cachedSessionName = uniqueName;
  cachedBaseName = baseName;
  return uniqueName;
}

export function createTerminalProfileProvider() {
  return {
    async provideTerminalProfile() {
      const shellPath = env.SHELL || '/bin/bash';

      try {
        const { multiplexer, autoAttach, strategy, customName, useCommandMode } = getConfig();
        if (useCommandMode) return new TerminalProfile({ shellPath });

        const launcher = getLauncher(multiplexer);
        const installed = await launcher.checkInstalled();

        if (!installed) {
          logger.info(`${multiplexer} not found, falling back to shell`);
          void showMissingMultiplexerNotification(multiplexer);
          return new TerminalProfile({ shellPath });
        }

        const folderPath = workspace.workspaceFolders?.[0]?.uri.fsPath;
        const baseName = getSessionName(strategy, {
          workspaceName: workspace.name || undefined,
          folderPath,
          customName
        });

        const sessionName = await resolveSessionName(baseName, launcher, autoAttach);
        const workspaceCwd = folderPath || cwd();
        const command = launcher.buildCommand(sessionName, workspaceCwd, autoAttach);

        return new TerminalProfile({
          name: `${SESSION_NAME_PREFIX}${sessionName}`,
          shellPath,
          shellArgs: getShellArgs(shellPath, command),
          cwd: workspaceCwd
        });
      } catch (error) {
        logger.error('Failed to create terminal profile', error);
        window.showErrorMessage('Failed to create CodeMux terminal profile.');
        return new TerminalProfile({ shellPath });
      }
    }
  };
}

export async function handleKillSession(): Promise<void> {
  const terminal = window.activeTerminal;
  if (!terminal) {
    window.showErrorMessage('No active terminal.');
    return;
  }

  if (!terminal.name.startsWith(SESSION_NAME_PREFIX)) {
    window.showErrorMessage('Active terminal is not a CodeMux session.');
    return;
  }

  const sessionName = terminal.name.slice(SESSION_NAME_PREFIX.length);
  const { multiplexer } = getConfig();
  const launcher = getLauncher(multiplexer);

  try {
    await launcher.killSession(sessionName);
    terminal.dispose();
    window.showInformationMessage(`Session "${sessionName}" killed.`);
  } catch (error) {
    logger.error('Failed to kill session', error);
    window.showErrorMessage(`Failed to kill session "${sessionName}".`);
  }
}

export async function handleNewSession(): Promise<void> {
  const { multiplexer, autoAttach, strategy, customName } = getConfig();
  const launcher = getLauncher(multiplexer);
  const installed = await launcher.checkInstalled();

  if (!installed) {
    showMissingMultiplexerNotification(multiplexer);
    return;
  }

  const folderPath = workspace.workspaceFolders?.[0]?.uri.fsPath;
  const baseName = getSessionName(strategy, {
    workspaceName: workspace.name || undefined,
    folderPath,
    customName
  });

  const sessionName = await resolveSessionName(baseName, launcher, autoAttach);
  const workspaceCwd = folderPath || cwd();
  const command = launcher.buildCommand(sessionName, workspaceCwd, autoAttach);

  const terminal = window.createTerminal({
    name: `${SESSION_NAME_PREFIX}${sessionName}`,
    cwd: workspaceCwd
  });

  terminal.show();
  terminal.sendText(command);
}

async function showMissingMultiplexerNotification(multiplexer: string): Promise<void> {
  if (suppressMissingNotification) return;

  const result = await window.showWarningMessage(
    `${multiplexer} not found. Install it to use CodeMux.`,
    `Don't show again`
  );

  if (result === `Don't show again`) suppressMissingNotification = true;
}
