# Cherry-pick 与回退操作指南

## Cherry-pick 基本操作

### 单个 commit
```bash
# 从其他分支拿一个 commit 到当前分支
git cherry-pick <commit-hash>

# -x 参数：在 commit message 中自动记录来源 hash（推荐）
git cherry-pick -x <commit-hash>
# 生成的 message 末尾会附加：(cherry picked from commit abc1234)
```

### 批量 cherry-pick
```bash
# 连续范围（不包含 A，包含 B）
git cherry-pick A..B

# 包含 A（用 A^ 即 A 的父 commit）
git cherry-pick A^..B

# 多个不连续 commit
git cherry-pick <hash1> <hash2> <hash3>
```

### --no-commit 模式
```bash
# 不自动 commit，只把改动放入暂存区（适合合并多个 cherry-pick 为一个 commit）
git cherry-pick -n <hash1> <hash2>
git commit -m "feat: cherry-pick multiple fixes"
```

## Cherry-pick 冲突处理

```bash
# 1. cherry-pick 遇到冲突时会暂停
git cherry-pick <hash>
# CONFLICT (content): Merge conflict in src/foo.c

# 2. 手动解决冲突文件
# 编辑冲突文件，保留需要的内容

# 3. 标记已解决并继续
git add <resolved-file>
git cherry-pick --continue

# 放弃本次 cherry-pick
git cherry-pick --abort

# 跳过当前 commit（继续后续的）
git cherry-pick --skip
```

### 冲突策略选择
```bash
# 有冲突时默认保留 theirs（被 cherry-pick 的 commit）
git cherry-pick --strategy-option theirs <hash>

# 保留 ours（当前分支的内容）
git cherry-pick --strategy-option ours <hash>
```

## Partial Revert（只回退部分文件）

```bash
# 方法一：checkout 特定文件到之前的状态
git checkout <commit-before-bug>^ -- path/to/file.c
git commit -m "revert: 回退 file.c 到修复前状态"

# 方法二：使用 restore（Git 2.23+）
git restore --source=<commit> -- path/to/file.c
git add path/to/file.c
git commit -m "revert: partial revert of <commit>"

# 方法三：interactive revert（用 patch 模式）
git revert -n <commit>         # 不自动 commit
git reset HEAD                 # unstage 所有
git add -p path/to/file.c     # 只 stage 想回退的部分
git checkout -- .              # 丢弃不想回退的
git commit -m "revert: partial revert"
```

## Revert 操作

### 回退单个 commit
```bash
git revert <commit-hash>
# 会创建一个新 commit，内容是原 commit 的逆操作
```

### 回退 merge commit
```bash
# merge commit 有两个 parent，必须指定保留哪一个
# -m 1: 保留第一个 parent（通常是 main 分支）
# -m 2: 保留第二个 parent（通常是被合并的 feature 分支）
git revert -m 1 <merge-commit-hash>
```

### 批量回退
```bash
# 回退最近 3 个 commit（从新到旧逐个 revert）
git revert HEAD~2..HEAD

# 不自动 commit，合并成一个 revert commit
git revert -n HEAD~2..HEAD
git commit -m "revert: 批量回退最近3个commit"
```

### ⚠️ Revert 后再次 merge 的陷阱
```
# 场景：revert 了 feature 分支的 merge → 再次 merge 同一分支 → 发现改动不见了！
# 原因：git 认为这些 commit 已经在历史中了（被 revert 不等于没进来过）
# 解决：先 revert 那个 revert commit，再 merge
git revert <revert-commit-hash>   # revert the revert
git merge feature-branch           # 现在可以正常 merge
```

## 最佳实践

| 场景 | 推荐操作 | 原因 |
|------|----------|------|
| 拿其他分支的修复到当前分支 | `cherry-pick -x` | -x 记录来源便于追溯 |
| 回退已 push 的错误 commit | `git revert` | 不改变历史，安全 |
| 回退未 push 的本地 commit | `git reset --soft HEAD~1` | 保留改动在暂存区 |
| 只回退某个文件的修改 | `git restore --source` | 精确控制影响范围 |
| 从远古 commit 拿代码到当前 | `git cherry-pick -x` | 比手动 patch 更可靠 |
