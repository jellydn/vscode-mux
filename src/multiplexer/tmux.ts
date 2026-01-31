import type { IMuxLauncher } from './types';
import { checkBinaryExists, run, shellEscape } from '../utils';

export class TmuxLauncher implements IMuxLauncher {
  buildCommand(sessionName: string, cwd: string, autoAttach: boolean): string {
    const escapedName = shellEscape(sessionName);
    const escapedCwd = shellEscape(cwd);
    if (autoAttach) {
      return `tmux new-session -A -s ${escapedName} -c ${escapedCwd}`;
    }
    return `tmux new-session -s ${escapedName} -c ${escapedCwd}`;
  }

  async listSessions(): Promise<string[]> {
    try {
      const stdout = await run('tmux', ['list-sessions', '-F', '#{session_name}']);
      return stdout.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  async killSession(sessionName: string): Promise<void> {
    await run('tmux', ['kill-session', '-t', sessionName]);
  }

  async checkInstalled(): Promise<boolean> {
    return checkBinaryExists('tmux');
  }
}
