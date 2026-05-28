# Git Bisect & Reflog 使用指南

## Git Bisect — 二分法定位引入 Bug 的 Commit

### 基本流程

```bash
# 1. 启动 bisect
git bisect start

# 2. 标记当前 (HEAD) 为坏的
git bisect bad

# 3. 标记一个已知正常的 commit
git bisect good <known-good-commit>
# 例如：git bisect good v1.0.0

# 4. Git 自动 checkout 中间 commit，你测试后标记
git bisect good   # 如果这个 commit 正常
git bisect bad    # 如果这个 commit 有 bug

# 5. 重复步骤4，直到 git 告诉你：
#    "<commit> is the first bad commit"

# 6. 结束 bisect，回到原分支
git bisect reset
```

### 自动化 Bisect (git bisect run)

```bash
# 用脚本自动判断好坏（脚本返回 0=good, 非0=bad）
git bisect start HEAD <good-commit>
git bisect run ./test-script.sh

# test-script.sh 示例（编译+运行测试）
#!/bin/bash
make -j$(nproc) 2>/dev/null || exit 125  # 编译失败跳过（125=skip）
./run_test.sh                              # 测试失败返回非0
```

**返回值约定：**
| 返回值 | 含义 |
|--------|------|
| 0 | good（这个 commit 正常）|
| 1-124, 126-127 | bad（这个 commit 有 bug）|
| 125 | skip（无法测试，跳过）|

### Bisect 查看日志

```bash
# 查看 bisect 过程中的所有标记
git bisect log

# 重放之前的 bisect 过程
git bisect replay <log-file>
```

### 实用技巧

```bash
# 只在某个路径范围内 bisect（缩小范围）
git bisect start -- src/camera/

# bisect 到一半发现当前 commit 无法编译，跳过
git bisect skip

# 在 bisect 过程中查看还剩多少步
git bisect visualize  # 打开 gitk
```

---

## Git Reflog — 操作历史恢复

### 什么是 Reflog

Reflog 记录了 HEAD 和各分支 tip 的**每次移动**，包括：
- commit、amend、rebase、reset、checkout、merge、cherry-pick
- 即使 commit 不属于任何分支（被 reset 删除），reflog 仍保留引用（默认 90 天）

### 基本用法

```bash
# 查看 HEAD 的 reflog（所有操作历史）
git reflog

# 输出示例：
# abc1234 HEAD@{0}: commit: fix bug
# def5678 HEAD@{1}: rebase (finish): refs/heads/feature onto main
# 789abcd HEAD@{2}: reset: moving to HEAD~3

# 查看特定分支的 reflog
git reflog show feature/0527-1430

# 带时间戳
git reflog --date=relative
```

### 从 Reflog 恢复误删内容

#### 场景 1：误操作 `git reset --hard`

```bash
# 找到 reset 之前的 commit
git reflog
# 看到: abc1234 HEAD@{1}: commit: 我的修改（这是 reset 前的状态）

# 恢复
git reset --hard abc1234
# 或创建新分支保留
git branch recovery abc1234
```

#### 场景 2：误删分支

```bash
# 删了分支但想恢复
git reflog | grep "feature/my-branch"
# 或
git reflog --all | grep "my-branch"

# 找到最后一个 commit，重新创建分支
git branch feature/my-branch <commit-hash>
```

#### 场景 3：rebase 出错想回退

```bash
# 找到 rebase 之前的状态
git reflog
# 看到: xyz7890 HEAD@{5}: rebase (start): checkout main

# 回到 rebase 之前
git reset --hard HEAD@{5}
```

#### 场景 4：amend 后想找回原始 commit

```bash
# amend 前的 commit 还在 reflog 中
git reflog
# HEAD@{1} 就是 amend 之前的版本
git show HEAD@{1}  # 查看原始内容
```

### Reflog 时间语法

```bash
# 用时间表达式
git show HEAD@{2.hours.ago}
git show HEAD@{yesterday}
git show HEAD@{"2026-05-27 14:30:00"}
git diff HEAD@{0} HEAD@{1}  # 比较最近两次操作的差异
```

### ⚠️ Reflog 注意事项

| 限制 | 说明 |
|------|------|
| 本地独有 | reflog 不推送到远端，每台机器独立 |
| 有过期时间 | 默认 90 天（可配置 `gc.reflogExpire`）|
| `git gc` 后 | 未被引用的 commit 可能被清理 |
| clone 无 reflog | 新 clone 的仓库没有历史 reflog |

### 配置 Reflog 保留时间

```bash
# 延长到 180 天
git config --global gc.reflogExpire 180.days
# 对不可达的 commit 也保留 90 天（默认 30 天）
git config --global gc.reflogExpireUnreachable 90.days
```

## 最佳实践总结

| 场景 | 使用工具 | 操作 |
|------|----------|------|
| 定位哪个 commit 引入 bug | `git bisect` | start → good/bad → reset |
| 找回误删的 commit | `git reflog` | 找 hash → reset/branch |
| rebase 出错回退 | `git reflog` | 找 rebase 前状态 → reset --hard |
| 自动化 bug 定位（有测试脚本） | `git bisect run` | 脚本返回 0=good |
| 无法确定 good commit 在哪 | `git log --oneline` + bisect | 先看历史再选基准 |
