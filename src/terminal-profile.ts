import { basename } from 'node:path';
import { cwd, env } from 'node:process';
import { type Terminal, TerminalProfile, window, workspace } from 'vscode';

import { getLauncher } from './multiplexer';
import { getSessionName, getUniqueSessionName } from './session-manager';
import { isWindows, logger } from './utils';

export const SESSION_NAME_PREFIX = 'CodeMux: ';

const LOGIN_SHELLS = new Set(['bash', 'zsh', 'fish', 'sh']);

interface CodemuxConfig {
  multiplexer: 'tmux' | 'zellij';
  autoAttach: boolean;
  strategy: 'workspace' | 'folder' | 'custom';
  customName: string;
  attachIfExists: boolean;
  windowsSupport: 'disabled' | 'enabled';
}

function getConfig(): CodemuxConfig {
  const codemuxConfig = workspace.getConfiguration('codemux');
  return {
    multiplexer: codemuxConfig.get('multiplexer', 'tmux'),
    autoAttach: codemuxConfig.get('autoAttach', true),
    strategy: codemuxConfig.get('sessionNameStrategy', 'workspace'),
    customName: codemuxConfig.get('customSessionName', ''),
    attachIfExists: codemuxConfig.get('attachIfExists', true),
    windowsSupport: codemuxConfig.get('windowsSupport', 'disabled')
  };
}

function getShellArgs(shellPath: string, command: string): string[] {
  if (isWindows()) {
    const isPowershell = shellPath.toLowerCase().includes('powershell');
    if (isPowershell) return ['-NoLogo', '-NoProfile', '-Command', command];
    return ['/c', command];
  }

  const shellName = basename(shellPath);
  if (LOGIN_SHELLS.has(shellName)) return ['-l', '-c', command];
  return ['-c', command];
}

function resolveShellPath(): string {
  if (isWindows()) return env.COMSPEC || 'cmd.exe';
  return env.SHELL || '/bin/bash';
}

function getFolderPath(): string | undefined {
  return workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function getBaseSessionName(strategy: CodemuxConfig['strategy'], customName: string): string {
  return getSessionName(strategy, {
    workspaceName: workspace.name || undefined,
    folderPath: getFolderPath(),
    customName
  });
}

async function resolveSessionName(
  baseName: string,
  launcher: ReturnType<typeof getLauncher>,
  autoAttach: boolean,
  attachIfExists: boolean
): Promise<string> {
  if (!autoAttach) return getUniqueSessionName(baseName, launcher);

  if (attachIfExists) {
    const sessions = await launcher.listSessions();
    if (sessions.includes(baseName)) return baseName;
  }

  return getUniqueSessionName(baseName, launcher);
}

async function checkMultiplexer(config: CodemuxConfig): Promise<ReturnType<typeof getLauncher> | null> {
  if (isWindows() && config.windowsSupport === 'disabled') {
    showWindowsDisabledNotification();
    return null;
  }

  const launcher = getLauncher(config.multiplexer);
  const installed = await launcher.checkInstalled();

  if (!installed) {
    logger.info(`${config.multiplexer} not found, falling back to shell`);
    void showMissingMultiplexerNotification(config.multiplexer);
    return null;
  }

  return launcher;
}

export function createTerminalProfileProvider() {
  return {
    async provideTerminalProfile() {
      const shellPath = resolveShellPath();

      try {
        const config = getConfig();
        const launcher = await checkMultiplexer(config);
        if (!launcher) return new TerminalProfile({ shellPath });

        const folderPath = getFolderPath() || cwd();
        const baseName = getBaseSessionName(config.strategy, config.customName);
        const sessionName = await resolveSessionName(baseName, launcher, config.autoAttach, config.attachIfExists);

        const command = launcher.buildCommand(sessionName, folderPath, config.autoAttach);

        return new TerminalProfile({
          name: `${SESSION_NAME_PREFIX}${sessionName}`,
          shellPath,
          shellArgs: getShellArgs(shellPath, command),
          cwd: folderPath
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
  const terminal = await resolveKillTargetTerminal();
  if (!terminal) return;

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

export async function resolveKillTargetTerminal(): Promise<Terminal | undefined> {
  const activeTerminal = window.activeTerminal;
  if (activeTerminal?.name.startsWith(SESSION_NAME_PREFIX)) return activeTerminal;

  const codemuxTerminals = window.terminals.filter((terminal) => terminal.name.startsWith(SESSION_NAME_PREFIX));

  if (codemuxTerminals.length === 0) {
    window.showErrorMessage('No CodeMux sessions found.');
    return;
  }

  if (codemuxTerminals.length === 1) return codemuxTerminals[0];

  const selection = await window.showQuickPick(
    codemuxTerminals.map((terminal) => ({
      label: terminal.name,
      terminal
    })),
    { placeHolder: 'Select a CodeMux session to kill' }
  );

  return selection?.terminal;
}

export async function handleNewSession(): Promise<void> {
  const config = getConfig();
  const launcher = await checkMultiplexer(config);
  if (!launcher) return;

  const folderPath = getFolderPath() || cwd();
  const baseName = getBaseSessionName(config.strategy, config.customName);
  const sessionName = await resolveSessionName(baseName, launcher, config.autoAttach, config.attachIfExists);

  const command = launcher.buildCommand(sessionName, folderPath, config.autoAttach);

  const terminal = window.createTerminal({
    name: `${SESSION_NAME_PREFIX}${sessionName}`,
    cwd: folderPath
  });

  terminal.show();
  terminal.sendText(command);
}

async function showMissingMultiplexerNotification(multiplexer: string): Promise<void> {
  const codemuxConfig = workspace.getConfiguration('codemux');
  const suppressMissing = codemuxConfig.get<boolean>('suppressMissingNotification', false);
  if (suppressMissing) return;

  const result = await window.showWarningMessage(
    `${multiplexer} not found. Install it to use CodeMux.`,
    `Don't show again`
  );

  if (result === `Don't show again`) {
    await codemuxConfig.update('suppressMissingNotification', true);
  }
}

let didWarnWindowsDisabled = false;

function showWindowsDisabledNotification(): void {
  if (didWarnWindowsDisabled) return;
  didWarnWindowsDisabled = true;
  window.showWarningMessage(
    'CodeMux is disabled on Windows by default. Enable "codemux.windowsSupport" to attempt using it.'
  );
}
