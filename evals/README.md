# evals/README.md

## 目录结构

```
evals/
├── eval_scenarios.csv    ← 测试用例（10正 + 2负）
├── grader.md             ← 每个用例的评分标准
└── results/
    ├── template.md       ← 空白结果模板
    └── YYYY-MM-DD-*.md   ← 实际测试结果（按日期命名）
```

## 快速运行 eval

```bash
# 安装 Node.js（需要 v16+）
npm run eval
```

## 评分方式

1. 复制 `results/template.md` 为 `results/YYYY-MM-DD-<model>.md`
2. 用 AI 工具测试每个 prompt
3. 对照 `grader.md` 打分（0/1 per check + 1-5 质量分）
4. 记录结果

## 通过标准

- 正例 10 个全部通过 (≥90% checklist 满足)
- 负例 2 个全部不误触发
- 平均质量分 ≥ 4.0
