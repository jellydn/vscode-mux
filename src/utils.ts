import { execFile } from 'node:child_process';
import { platform } from 'node:process';
import { defineLogger } from 'reactive-vscode';
import { displayName } from './generated/meta';

export const logger = defineLogger(displayName);

export function checkBinaryExists(binary: string): Promise<boolean> {
  return new Promise((resolve) => {
    const checker = platform === 'win32' ? 'where' : 'which';
    execFile(checker, [binary], (error) => {
      if (error) return resolve(false);
      resolve(true);
    });
  });
}

export function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (error, stdout) => {
      if (error) return reject(error);
      resolve(stdout.trim());
    });
  });
}

export function shellEscape(value: string): string {
  if (value === '') return "''";
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

export function isWindows(): boolean {
  return platform === 'win32';
}
