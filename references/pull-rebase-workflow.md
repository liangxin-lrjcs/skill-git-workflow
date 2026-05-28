# Pull + Rebase 工作流（完整流程）

> 场景：远端有新提交（同事推了代码），你本地有 WIP 修改，需要把远端最新变更合并进来。

## Step 0：确认操作方式

**必须先询问用户！**

| 场景 | 建议 |
|------|------|
| feature 分支时间较长、远端变化大 | 基于最新 main 新建分支，cherry-pick 自己的提交 |
| 小改动、仅有 1-2 个文件冲突 | 直接在当前分支 rebase |
| 远端强更新（别人 force push） | reset 到远端，重新 cherry-pick |

```
[询问用户]：
"远端有新提交，你的本地也有修改。建议方案：
  A) 在当前分支直接 rebase（适合冲突少的情况）
  B) 新建分支 feature/MMDD-HHMM，基于最新 main 重新开始
  你更倾向哪种方式？"
```

---

## Step 1：保存本地 WIP

```bash
git status && git diff --stat
git stash push -m "WIP: <当前工作描述>"
git status   # 应显示 clean working tree
git stash list
```

---

## Step 2：Fetch + Dry-run

```bash
git fetch origin
git log HEAD..origin/main --oneline    # 远端新提交
git diff HEAD origin/main --stat       # 改了哪些文件
```

**报告给用户**：远端 N 个新提交，涉及的文件，与 stash 是否重叠。

---

## Step 3：Rebase

```bash
# 方案 A：直接 rebase
git rebase origin/main

# 方案 B：新建分支
git checkout origin/main -b feature/$(date +%m%d-%H%M)
```

---

## Step 4：解决冲突（与用户协同）

```bash
git status              # "both modified" = 冲突文件
git diff <conflict-file>
```

**冲突处理原则**：

1. 对每个冲突文件报告：文件名、冲突块、两边含义
2. 解释：`<<<<<<< HEAD` 是本地的，`>>>>>>> origin/main` 是远端的
3. 提出建议但由用户决定
4. **永远不自动选择一方覆盖另一方**

```bash
# 解决后
git add <resolved-file>
git rebase --continue

# 跳过某 commit（需用户确认！）
git rebase --skip

# 放弃 rebase
git rebase --abort
```

---

## Step 5：Pop stash

```bash
git stash pop
git status   # 检查是否有冲突
# 有冲突则按 Step 4 流程再次协同解决
# stash pop 冲突不需要 git commit，直接继续工作即可
```

---

## Step 6：重新编译验证

rebase + pop 后代码已变，**必须重新编译**。编译方式见 [build-and-deploy.md](build-and-deploy.md)。

---

## Checklist

```
- [ ] Step 0: 用户已选择操作方式?
- [ ] Step 1: git stash 成功，working tree clean?
- [ ] Step 2: fetch 完成，差异已报告给用户?
- [ ] Step 3: rebase 完成（或所有冲突已解决）?
- [ ] Step 4: 所有冲突已与用户协同解决?
- [ ] Step 5: stash pop 成功（或 pop 冲突已解决）?
- [ ] Step 6: 重新编译通过?
```
