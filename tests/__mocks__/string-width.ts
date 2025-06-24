export default function stringWidth(str: string): number {
  return str.replace(/\u001b\[[0-9;]*m/g, '').length
}