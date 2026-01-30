#!/usr/bin/env node
import { appendFileSync, existsSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ansi } from '../src/ansi.js'

/* ------------------------------------------------------------------ */
/* 1. CLI                                                              */
/* ------------------------------------------------------------------ */

interface CliOpt {
  shell?: string
  apply?: boolean
}

/** Simple CLI argument parser */
function parseArgs(): CliOpt {
  const args = process.argv.slice(2)
  let shell: string | undefined
  let apply = false

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '-s' || args[i] === '--shell') && args[i + 1]) {
      shell = args[++i]
    } else if (args[i] === '-a' || args[i] === '--apply') {
      apply = true
    }
  }

  return { shell, apply }
}

const { shell, apply } = parseArgs()

/* ------------------------------------------------------------------ */
/* 2. シェル判定                                                        */
/* ------------------------------------------------------------------ */

type Shell = 'bash' | 'zsh' | 'fish' | 'powershell'

function detectShell(): Shell {
  if (shell) return shell as Shell

  if (process.platform === 'win32') {
    return 'powershell'
  }
  const sh = process.env.SHELL ?? ''
  if (sh.endsWith('bash')) return 'bash'
  if (sh.endsWith('zsh')) return 'zsh'
  if (sh.endsWith('fish')) return 'fish'
  return 'bash'
}

const targetShell: Shell = detectShell()

/* ------------------------------------------------------------------ */
/* 3. シェル別スニペット                                               */
/* ------------------------------------------------------------------ */

const snippets: Record<Shell, string> = {
  bash: `

# >>> aws-profile-selector start >>>
awsps() {
  tmp=$(mktemp)
  aws-profile-selector "$@" --out "$tmp" || { rm -f "$tmp"; return; }
  prof=$(<"$tmp")
  rm -f "$tmp"
  [ -z "$prof" ] && return
  export AWS_PROFILE="$prof"
  echo "AWS_PROFILE=$AWS_PROFILE"
}
bind -x '"\\C-t":awsps'
# <<< aws-profile-selector end <<<

`,

  zsh: `

# >>> aws-profile-selector start >>>
awsps() {
  tmp=$(mktemp)
  aws-profile-selector "$@" --out "$tmp" || { rm -f "$tmp"; return; }
  prof=$(<"$tmp"); rm -f "$tmp"
  [ -z "$prof" ] && return
  export AWS_PROFILE="$prof"
  echo "AWS_PROFILE=$AWS_PROFILE"
}
bindkey -s '^T' 'awsps\n'
# <<< aws-profile-selector end <<<

`,

  fish: `

# >>> aws-profile-selector start >>>
function awsps
    set -l tmp (mktemp)
    aws-profile-selector $argv --out $tmp
    or begin; rm -f $tmp; return; end
    set -l prof (cat $tmp)
    rm -f $tmp
    test -z "$prof"; and return
    set -gx AWS_PROFILE $prof
    echo (set_color green)"AWS_PROFILE=$AWS_PROFILE"(set_color normal)
end
function bind_awsps
    awsps
    commandline -f repaint
end
bind \\ct bind_awsps
# <<< aws-profile-selector end <<<

`,

  powershell: `

# >>> aws-profile-selector start >>>
function awsps  {
  $file = New-TemporaryFile
  aws-profile-selector @Args --out $file.FullName
  if ($LASTEXITCODE -ne 0) { Remove-Item $file; return }
  $prof = Get-Content $file -Raw; Remove-Item $file
  if ($prof) { $env:AWS_PROFILE = $prof; Write-Host "AWS_PROFILE=$($env:AWS_PROFILE)" }
}
# <<< aws-profile-selector end <<<

`,
}

const snippet = snippets[targetShell].trimStart()

/**
 * 4. 適用 or 出力
 */
if (!apply) {
  console.log(ansi.cyan(`# --- Add the following to your ${targetShell} rc ---\n`))
  console.log(snippet)
  process.exit(0)
}

try {
  const home = os.homedir()
  let rcPath: string

  switch (targetShell) {
    case 'bash':
      rcPath = path.join(home, '.bashrc')
      break
    case 'zsh':
      rcPath = path.join(home, '.zshrc')
      break
    case 'fish':
      rcPath = path.join(home, '.config/fish/config.fish')
      break
    case 'powershell':
      rcPath = path.join(home, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1')
      break
  }

  if (!existsSync(rcPath)) writeFileSync(rcPath, '', { flag: 'a' })
  appendFileSync(rcPath, `\n${snippet}\n`)
  console.log(ansi.green(`✓ Added awsp helper to ${rcPath}`))
  console.log(ansi.yellow(`To remove, delete the snippet from ${rcPath}:\n`))
  console.log(ansi.yellow(snippet))
  console.log(
    ansi.yellow(
      `\nNote: You may need to restart your shell or run 'source ${rcPath}' to apply changes.`,
    ),
  )
} catch (err) {
  console.error(ansi.red(`Failed to write rc: ${(err as Error).message}`))
  process.exit(1)
}
