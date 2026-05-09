#!/usr/bin/env node
/**
 * run_eval.js — 本地 Skill Eval 交互式打分工具
 *
 * 用法:
 *   node run_eval.js <eval_scenarios.csv>
 *
 * 功能:
 *   1. 读取 CSV 测试用例
 *   2. 逐个展示 prompt（让测试人员复制到 AI 工具中测试）
 *   3. 逐项输入 0/1 打分
 *   4. 输入整体质量分 1-5
 *   5. 自动生成 results/<DATE>.md 报告
 */

import { createInterface } from 'readline';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CSV 解析 ────────────────────────────────────────────────────────────────

function parseCsv(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    // 支持带引号的字段
    const fields = [];
    let field = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { fields.push(field); field = ''; continue; }
      field += ch;
    }
    fields.push(field);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (fields[i] || '').trim(); });
    return obj;
  });
}

function parseChecks(checksStr) {
  return checksStr.split('|').map(c => {
    const [name, expected] = c.split(':');
    return { name: name.trim(), expected: parseInt(expected || '1', 10) };
  });
}

// ── 交互 RL ─────────────────────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function askInt(question, min, max) {
  while (true) {
    const ans = (await ask(question)).trim();
    const n = parseInt(ans, 10);
    if (!isNaN(n) && n >= min && n <= max) return n;
    console.log(`  ⚠ 请输入 ${min}–${max} 之间的整数`);
  }
}

// ── 主流程 ───────────────────────────────────────────────────────────────────

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('用法: node run_eval.js <eval_scenarios.csv>');
  process.exit(1);
}

const cases = parseCsv(csvPath);
const skillDir = dirname(csvPath.startsWith('/') ? csvPath : join(process.cwd(), csvPath));
// skillDir = .../evals/ → 父目录
const repoRoot = dirname(skillDir.endsWith('evals') ? skillDir : skillDir);
const resultsDir = join(repoRoot.endsWith('evals') ? dirname(repoRoot) : repoRoot, 'evals', 'results');

console.log('\n══════════════════════════════════════════════════════');
console.log('  Skill Eval 交互式打分工具');
console.log('══════════════════════════════════════════════════════');
console.log(`  CSV 文件: ${basename(csvPath)}`);
console.log(`  用例数量: ${cases.length}`);
console.log(`  结果目录: ${resultsDir}`);
console.log('══════════════════════════════════════════════════════\n');

const testerName = (await ask('测试人 (留空用 anonymous): ')).trim() || 'anonymous';
const aiTool = (await ask('AI 工具 (Cursor/Claude/Copilot 等): ')).trim() || 'unknown';
const skillVersion = (await ask('Skill 版本 (git hash 或描述，留空跳过): ')).trim() || '-';

const results = [];

for (let i = 0; i < cases.length; i++) {
  const c = cases[i];
  const checks = parseChecks(c.expected_checks);
  const shouldTrigger = c.should_trigger === 'true';
  const isNeg = !shouldTrigger;

  console.log('\n──────────────────────────────────────────────────────');
  console.log(`  [${i + 1}/${cases.length}] ${c.id}  ${isNeg ? '(负例)' : '(正例)'}`);
  console.log('──────────────────────────────────────────────────────');
  console.log('\n  📋 请将以下 prompt 发送给 AI 工具，然后回来打分:\n');
  console.log(`  ┌─ prompt ${'─'.repeat(52)}`);
  console.log(`  │ ${c.prompt}`);
  console.log(`  └${'─'.repeat(55)}`);
  console.log();
  await ask('  (测试完成后按 Enter 开始打分...)');

  const itemResults = {};

  if (isNeg) {
    // 负例只打两项
    console.log('\n  负例检查 (1=通过, 0=误触发):');
    for (const chk of checks) {
      const v = await askInt(`    ${chk.name} [0/1]: `, 0, 1);
      itemResults[chk.name] = v;
    }
  } else {
    // 正例逐项打分
    console.log('\n  检查项 (1=满足, 0=未满足):');
    for (const chk of checks) {
      const v = await askInt(`    ${chk.name} [0/1]: `, 0, 1);
      itemResults[chk.name] = v;
    }
  }

  let qualityScore = null;
  let violation = '';
  let notes = '';

  if (!isNeg) {
    violation = (await ask('  must_not 违反？(留空=无, 否则描述): ')).trim();
    qualityScore = await askInt('  综合质量分 [1-5]: ', 1, 5);
    if (violation) {
      qualityScore = Math.max(1, qualityScore - 1);
      console.log(`  ⚠ must_not 命中，质量分降1级 → ${qualityScore}`);
    }
    notes = (await ask('  备注 (留空跳过): ')).trim();
  }

  const passCount = Object.values(itemResults).filter(v => v === 1).length;
  const totalCount = checks.length;
  const passRate = Math.round(passCount / totalCount * 100);

  results.push({ c, checks, itemResults, qualityScore, violation, notes, passCount, totalCount, passRate, isNeg });

  console.log(`\n  ✓ ${c.id}: ${passCount}/${totalCount} (${passRate}%)${qualityScore ? ' 质量分=' + qualityScore : ''}`);
}

rl.close();

// ── 生成报告 ─────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];
const posResults = results.filter(r => !r.isNeg);
const negResults = results.filter(r => r.isNeg);

const posPass = posResults.filter(r => r.passCount === r.totalCount).length;
const negPass = negResults.filter(r => r.passCount === r.totalCount).length;
const totalPass = posPass + negPass;
const totalAll = results.length;
const overallRate = Math.round(totalPass / totalAll * 100);
const avgQuality = posResults.length > 0
  ? (posResults.reduce((s, r) => s + (r.qualityScore || 0), 0) / posResults.length).toFixed(1)
  : '-';

let md = `# Eval Results — ${today}\n\n`;
md += `## 测试信息\n\n`;
md += `- **日期**: ${today}\n`;
md += `- **测试人**: @${testerName}\n`;
md += `- **AI 工具**: ${aiTool}\n`;
md += `- **Skill 版本**: ${skillVersion}\n\n`;
md += `---\n\n`;
md += `## 汇总\n\n`;
md += `| 总用例 | 正例全通 | 负例全通 | 总通过率 | 平均质量分 |\n`;
md += `|--------|---------|---------|---------|----------|\n`;
md += `| ${totalAll} | ${posPass} / ${posResults.length} | ${negPass} / ${negResults.length} | ${overallRate}% | ${avgQuality} / 5 |\n\n`;
md += `---\n\n`;

if (posResults.length > 0) {
  md += `## 正例详情\n\n`;
  for (const r of posResults) {
    md += `### ${r.c.id}\n\n`;
    md += `**输入**: ${r.c.prompt}\n\n`;
    md += `**检查项结果**: ${r.passCount}/${r.totalCount} (${r.passRate}%)\n\n`;
    md += `| 检查项 | 通过 | 备注 |\n|--------|------|------|\n`;
    for (const chk of r.checks) {
      const v = r.itemResults[chk.name];
      md += `| ${chk.name} | ${v ? '✅' : '❌'} | |\n`;
    }
    md += `\n**must_not 违反**: ${r.violation || '无'}\n\n`;
    md += `**质量分**: ${r.qualityScore} / 5\n\n`;
    if (r.notes) md += `**备注**: ${r.notes}\n\n`;
    md += `---\n\n`;
  }
}

if (negResults.length > 0) {
  md += `## 负例详情\n\n`;
  md += `| 用例 | 所有检查通过 | 结论 |\n|------|-------------|------|\n`;
  for (const r of negResults) {
    const passed = r.passCount === r.totalCount;
    md += `| ${r.c.id} | ${passed ? '✅' : '❌'} | ${passed ? '未误触发' : '❌ 误触发了 skill'} |\n`;
  }
  md += `\n---\n\n`;
}

md += `## 改进记录\n\n1. (填写)\n2. (填写)\n`;

if (!existsSync(resultsDir)) mkdirSync(resultsDir, { recursive: true });
const outPath = join(resultsDir, `${today}.md`);
writeFileSync(outPath, md, 'utf-8');

console.log('\n══════════════════════════════════════════════════════');
console.log(`  ✅ 报告生成: ${outPath}`);
console.log(`  总通过率: ${overallRate}% | 平均质量分: ${avgQuality}/5`);
console.log('══════════════════════════════════════════════════════\n');
