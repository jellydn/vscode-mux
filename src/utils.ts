import { execFile } from 'node:child_process'
import { defineLogger } from 'reactive-vscode'
import { displayName } from './generated/meta'

export const logger = defineLogger(displayName)

export function checkBinaryExists(binary: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('which', [binary], (error) => {
      resolve(!error)
    })
  })
}
