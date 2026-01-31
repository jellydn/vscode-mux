import type { IMuxLauncher } from './types';
import { run } from '../utils';

export class TmuxLauncher implements IMuxLauncher {
  buildCommand(sessionName: string, cwd: string, autoAttach: boolean): string {
    if (autoAttach) {
      return `tmux new-session -A -s ${sessionName} -c ${cwd}`;
    }
    return `tmux new-session -s ${sessionName} -c ${cwd}`;
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
    try {
      await run('which', ['tmux']);
      return true;
    } catch {
      return false;
    }
  }
}
