# aws-profile-selector

**aws-profile-selector** is a fast, zero-dependency\* CLI that lets you browse every
profile declared in `~/.aws/config`, fuzzy-filter them as you type, and export the
selection to `AWS_PROFILE`—all in one key-stroke.

\* Only uses runtime dependencies already shipping in the `@inquirer/*` family and
`chalk`, so it installs quickly and keeps the bundle size tiny.

---

## ✨ Features

| Feature                | Details                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| **TUI picker**         | Arrow-keys to move / `ESC` to cancel / `Enter` to confirm                                           |
| **Fuzzy search**       | Powered by [Fuse.js](https://fusejs.io)                                                             |
| **Table layout**       | Fixed header + borders; column widths auto-fit to longest value                                     |
| **Cross-shell helper** | `aws-profile-selector-init --apply` adds an `awsp` function to bash / zsh / fish / PowerShell / cmd |
| **TypeScript + ESM**   | Modern codebase, strict typing, tree-shake friendly                                                 |
| **MIT licensed**       | Free for commercial & personal use                                                                  |

---

## 🚀 Installation

```bash
# Global (recommended)
npm i -g aws-profile-selector

# Local project
npm i --save-dev aws-profile-selector

```

## Usage

```bash
# ad-hoc
eval "$(aws-profile-selector)"         # sets AWS_PROFILE for current shell

# persistent helper
aws-profile-selector-init --apply      # injects awsp() into your rc file
source ~/.bashrc                       # reload
awsp                                   # launch picker any time

```

### Common flags

| Flag             | Effect                                      |
| ---------------- | ------------------------------------------- |
| `--pure`         | Print only the profile name (no `export …`) |
| `--pageSize <n>` | Rows per page (default 20)                  |
| `--help`         | Full option reference                       |

## How it works (modules)

1. config-reader.ts – parse ~/.aws/config ⇒ JS object
1. table-layout.ts – calculate column widths & borders
1. choice-builder.ts – Fuse-powered fuzzy filter ⇒ inquirer choices
1. selector-ui.ts – run @inquirer/search, handle ESC abort/arrow loop
1. bin/selector.ts – CLI glue & final output
1. bin/init.ts – add the convenient awsp shell function

Everything lives in src/, compiled by tsc to dist/.

## Development

```bash
git clone https://github.com/your-org/aws-profile-selector.git
cd aws-profile-selector
npm install

npm run build      # -> dist/
npm test           # Jest + ts-jest (ESM)
npm link           # symlink globally, try `aws-profile-selector`
```

### Release checklist

```bash
npm version patch|minor|major   # bump & git-tag
npm publish --access public     # prepublishOnly runs build
```

## Contributing

PRs & issues are welcome!
Please:

- keep one feature/fix per PR
- run `npm run lint` before committing
- include Jest tests for new logic
- keep table width ≤ 80 cols

## License

Released under the MIT License – see [LICENSE](./LICENSE) for full text.
Made with ☕ and ❤️ in Tokyo.
