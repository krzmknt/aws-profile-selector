#!/usr/bin/env node
import fs from "fs";
import os from "os";
import path from "path";
import inquirer from "inquirer";
import autocomplete from "inquirer-autocomplete-prompt";
import Fuse from "fuse.js";
import chalk from "chalk";
import stripAnsi from "strip-ansi";
import stringWidth from "string-width";
import { Command } from "commander";

inquirer.registerPrompt("autocomplete", autocomplete); // ★追加
const { Separator } = inquirer;

/* ───── CLI ───── */
const cli = new Command()
  .option("--pure", "選択したプロファイル名だけを出力（シェル関数用）")
  .parse();
const { pure } = cli.opts();

/* ───── ~/.aws/config 読み込み ───── */
const cfg = path.join(os.homedir(), ".aws", "config");
if (!fs.existsSync(cfg)) {
  console.error(chalk.red(`Config not found: ${cfg}`));
  process.exit(1);
}
const lines = fs.readFileSync(cfg, "utf8").split(/\r?\n/);

/* ───── プロファイル手パース ───── */
const profiles = {};
let cur = null;
for (const ln of lines) {
  const sec = ln.match(/^\s*\[profile\s+([^\]]+)]/i);
  if (sec) {
    cur = sec[1].trim();
    profiles[cur] = {};
    continue;
  }
  if (!cur) continue;
  const kv = ln.match(/^\s*([^=]+?)\s*=\s*(.*?)\s*$/);
  if (kv) profiles[cur][kv[1].trim()] = kv[2].trim();
}

/* ───── 一覧生成 ───── */
const list = Object.entries(profiles)
  .map(([name, kv]) => ({
    name,
    accountId: kv.sso_account_id || "N/A",
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

if (!list.length) {
  console.error(chalk.red("No profiles found."));
  process.exit(1);
}

/* ───── 表示用ヘルパ ───── */
const colW = {
  name: Math.max(
    stringWidth("Profile"),
    ...list.map((p) => stringWidth(p.name)),
  ),
  acc: Math.max(
    stringWidth("Account ID"),
    ...list.map((p) => stringWidth(p.accountId)),
  ),
};
const pad = (s, w) => s + " ".repeat(w - stringWidth(stripAnsi(s)));

const line = (l, m, r) =>
  chalk.gray(l + "─".repeat(colW.name + 2) + m + "─".repeat(colW.acc + 2) + r);
const top = line("┌", "┬", "┐");
const mid = line("├", "┼", "┤");
const bottom = line("└", "┴", "┘");

const header =
  chalk.gray("│ ") +
  chalk.bold.white(pad("Profile", colW.name)) +
  chalk.gray(" │ ") +
  chalk.bold.white(pad("Account ID", colW.acc)) +
  chalk.gray(" │");

const row = (p) =>
  chalk.gray("│ ") +
  pad(p.name, colW.name) +
  chalk.gray(" │ ") +
  pad(p.accountId, colW.acc) +
  chalk.gray(" │");

/* ───── Fuse.js セットアップ ───── */
const fuse = new Fuse(list, {
  keys: ["name", "accountId"],
  threshold: 0.4,
});

/* ───── choice を動的生成 ───── */
const buildChoices = (items) => [
  new Separator(top),
  new Separator(header),
  new Separator(mid),
  ...items.map((p) => ({
    name: row(p), // 行自体は無色 → inquirer が反転ハイライト
    value: p.name,
    short: p.name,
  })),
  new Separator(bottom),
];

/* ───── prompt ───── */
const { picked } = await inquirer.prompt([
  {
    type: "autocomplete", // ★変更
    name: "picked",
    message: chalk.cyanBright("Select AWS profile:"),
    pageSize: 20,
    loop: false,
    source: async (_, input) => {
      if (!input) return buildChoices(list);
      const result = fuse.search(input).map((r) => r.item);
      return buildChoices(result);
    },
  },
]);

/* ───── 出力 ───── */
console.log(pure ? picked : `export AWS_PROFILE=${picked}`);
