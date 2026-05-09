# Git Workflow — 30 秒速查

## 我要做什么？

| 任务 | 关键操作 |
|------|---------|
| 写 commit message | `SKILL.md → Commit Message 格式` |
| 创建 feature 分支 | `git checkout -b feature/$(date +%m%d-%H%M)` |
| 同步远端新代码（有WIP） | `git stash → fetch → rebase → stash pop` |
| push 代码 | `fetch 先检查 → 远端无更新 → push` |
| push 被拒绝（rejected） | `git fetch origin → git rebase origin/<branch> → push` |
| 冲突解决 | 展示给用户看 → 协同决策 → 新增功能全保留 |
| 撤销误 stage 的文件 | `git restore --staged <file>` |

## 核心规则（永远不违反）

```
✅ feature/MMDD-HHMM 分支命名
✅ commit 前: git fetch 检查远端
✅ push 前: git fetch 检查远端
✅ 编译通过 + 用户确认测试 → 才能 commit
✅ 用户明确批准 → 才能 push
✅ 冲突解决与用户协同，不自己盲目选

❌ 禁止 force push
❌ 禁止自主 commit / push
❌ 禁止直接 push main
❌ 禁止 git clean -xdf（Yocto 项目）
❌ 禁止 bitbake cleansstate
```

## commit message 模板

```
JAX Emedded Camera: <动词开头的一句话描述>

- 变更点1
- 变更点2

Test-Result:
1. <测试项>: <结果>

IssueID: To be determined
Change-Id: <自动生成或留空>
```
