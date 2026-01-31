import type { IMuxLauncher } from './types';
import { run } from '../utils';

export class ZellijLauncher implements IMuxLauncher {
  buildCommand(sessionName: string, cwd: string, autoAttach: boolean): string {
    if (autoAttach) {
      return `zellij attach ${sessionName} || zellij -s ${sessionName} -c ${cwd}`;
    }
    return `zellij -s ${sessionName} -c ${cwd}`;
  }

  async listSessions(): Promise<string[]> {
    try {
      const stdout = await run('zellij', ['list-sessions', '-n']);
      return stdout.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  async killSession(sessionName: string): Promise<void> {
    await run('zellij', ['kill-session', '-s', sessionName]);
  }

  async checkInstalled(): Promise<boolean> {
    try {
      await run('which', ['zellij']);
      return true;
    } catch {
      return false;
    }
  }
}
