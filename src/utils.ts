import { execFile } from 'node:child_process';
import { defineLogger } from 'reactive-vscode';
import { displayName } from './generated/meta';

export const logger = defineLogger(displayName);

export function checkBinaryExists(binary: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('which', [binary], (error) => {
      resolve(!error);
    });
  });
}

export function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout.trim());
    });
  });
}

export function shellEscape(value: string): string {
  if (value === '') return "''";
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}
