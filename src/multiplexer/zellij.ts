import { run, shellEscape } from '../utils';
import type { IMuxLauncher } from './types';

export class ZellijLauncher implements IMuxLauncher {
  buildCommand(sessionName: string, _cwd: string, autoAttach: boolean): string {
    const escapedName = shellEscape(sessionName);
    if (autoAttach) {
      return `zellij attach ${escapedName} -c`;
    }
    return `zellij -s ${escapedName}`;
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
