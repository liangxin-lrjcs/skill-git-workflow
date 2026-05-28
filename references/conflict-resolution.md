# 冲突解决流程

## 基本操作

```bash
# 查看冲突文件
git status   # "both modified" 或 "Unmerged paths"

# 查看具体冲突内容
git diff <conflict-file>

# 解决后标记为已解决
git add <resolved-file>

# 继续当前操作
git merge --continue   # merge 冲突
git rebase --continue  # rebase 冲突
git cherry-pick --continue  # cherry-pick 冲突

# 放弃当前操作
git merge --abort
git rebase --abort
git cherry-pick --abort
```

## 冲突标记含义

```
<<<<<<< HEAD
（你本地的代码）
=======
（远端/对方的代码）
>>>>>>> origin/main
```

- `HEAD` 上方 = 当前分支（你的修改）
- `=======` 下方 = incoming（远端或被合并分支的修改）

## 处理原则

1. **每个冲突必须与用户协同解决**——不自动选择一方
2. 报告冲突文件列表和每个冲突块的两边含义
3. 两边独立功能 → 建议都保留
4. 同一行双方修改 → 合并语义（不是简单选一方）
5. 不确定时 → 问用户

## 策略选项

```bash
# 全部用本地的（仅在用户明确说"用我的"时）
git checkout --ours <file>
git add <file>

# 全部用远端的（仅在用户明确说"用远端的"时）
git checkout --theirs <file>
git add <file>
```

## Binary 文件冲突

二进制文件（如 .so/.ipk）无法文本合并：

```bash
# 只能选一方
git checkout --ours <binary-file>    # 保留本地版本
git checkout --theirs <binary-file>  # 使用远端版本
git add <binary-file>
```

必须询问用户选哪个版本。

## stash pop 冲突

```bash
# stash pop 冲突后：
# 1. 解决冲突文件
# 2. git add <file>
# 3. 不需要 git commit（直接继续工作）
# 4. stash 不会自动 drop，手动：git stash drop
```

## git rerere（解决重复冲突）

```bash
# 启用 rerere（记住冲突解决方式，下次自动应用）
git config --global rerere.enabled true

# 查看记录的解决方案
git rerere status
git rerere diff
```
