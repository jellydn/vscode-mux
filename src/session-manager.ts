import type { IMuxLauncher } from './multiplexer';
import { basename } from 'node:path';

export interface SessionNameOptions {
  workspaceName: string | undefined;
  folderPath: string | undefined;
  customName: string;
}

function resolveRaw(strategy: 'workspace' | 'folder' | 'custom', options: SessionNameOptions): string {
  switch (strategy) {
    case 'workspace':
      return options.workspaceName ?? resolveRaw('folder', options);
    case 'folder':
      return options.folderPath ? basename(options.folderPath) : 'session';
    case 'custom':
      return options.customName || resolveRaw('workspace', options);
  }
}

function sanitizeSessionName(name: string): string {
  return (
    name
      .replace(/[^a-z0-9-]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'session'
  );
}

export function getSessionName(strategy: 'workspace' | 'folder' | 'custom', options: SessionNameOptions): string {
  return sanitizeSessionName(resolveRaw(strategy, options));
}

export async function getUniqueSessionName(baseName: string, launcher: IMuxLauncher): Promise<string> {
  const sessions = await launcher.listSessions();
  if (!sessions.includes(baseName)) return baseName;

  let suffix = 2;
  while (sessions.includes(`${baseName}-${suffix}`)) suffix++;

  return `${baseName}-${suffix}`;
}
