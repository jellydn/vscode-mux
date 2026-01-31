import { basename } from 'node:path';
import { cwd, env } from 'node:process';
import { type Terminal, TerminalProfile, window, workspace } from 'vscode';

import { getLauncher } from './multiplexer';
import { findMatchingSession, getSessionName, getUniqueSessionName } from './session-manager';
import { logger } from './utils';

export const SESSION_NAME_PREFIX = 'CodeMux: ';

const LOGIN_SHELLS = new Set(['bash', 'zsh', 'fish', 'sh']);
let cachedSessionName: string | undefined;
let cachedBaseName: string | undefined;

interface CodemuxConfig {
  multiplexer: 'tmux' | 'zellij';
  autoAttach: boolean;
  strategy: 'workspace' | 'folder' | 'custom';
  customName: string;
  attachIfExists: boolean;
}

function getConfig(): CodemuxConfig {
  const codemuxConfig = workspace.getConfiguration('codemux');
  return {
    multiplexer: codemuxConfig.get('multiplexer', 'tmux'),
    autoAttach: codemuxConfig.get('autoAttach', true),
    strategy: codemuxConfig.get('sessionNameStrategy', 'workspace'),
    customName: codemuxConfig.get('customSessionName', ''),
    attachIfExists: codemuxConfig.get('attachIfExists', true)
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
        const { multiplexer, autoAttach, strategy, customName } = getConfig();

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

async function resolveKillTargetTerminal(): Promise<Terminal | undefined> {
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
  const { multiplexer, autoAttach, strategy, customName, attachIfExists } = getConfig();
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

  let sessionName: string;
  if (attachIfExists) {
    const matchedSession = await findMatchingSession(baseName, launcher);
    sessionName = matchedSession ?? (await getUniqueSessionName(baseName, launcher));
  } else {
    sessionName = await getUniqueSessionName(baseName, launcher);
  }

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
