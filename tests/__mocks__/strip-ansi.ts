export default function stripAnsi(str: string): string {
  return str.replace(/\u001b\[[0-9;]*m/g, '')
}