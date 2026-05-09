---
name: git-workflow
description: >
  Manages git workflow for JAX Embedded Camera project on Qualcomm embedded Linux platform.
  Use when the user mentions git commit, git push, git pull, branch creation, feature branch,
  commit message, code review, merge, rebase, cherry-pick, stash, conflict resolution, git log,
  git diff, git status, or any version control operation. Also trigger when the user asks
  about when to commit, how to write commit messages, branch naming rules, whether to push now,
  how to create a feature branch, how to submit a patch, or how to handle git merge conflicts.
  Special rules apply: never auto-commit or auto-push; only commit after Docker build
  succeeds AND user confirms device test passes; never force push; never use git clean -xdf
  on the Yocto build directory; never use cleansstate/clean on spcam.
argument-hint: "[operation: commit|push|pull|branch|merge|log] [--dry-run]"
---

# JAX Embedded Camera — Git Workflow

本 Skill 管理 JAX 嵌入式相机项目的 Git 工作流，核心原则：**先编译、先测试、再提交，永远不自主 push**。

---

## ⚠️ 强制规则（违反即终止操作，必须先询问用户）

| 规则 | 说明 |
|------|------|
| **禁止自主 commit** | 代码修改完成后不得自动 commit，必须用户明确确认测试通过后才能 commit |
| **禁止自主 push** | 即使 commit 完成，push 也需要用户单独明确批准 |
| **禁止 force push** | 禁止 `git push --force` 或 `git push -f`，尤其是 main/master 分支 |
| **禁止 git clean -xdf** | Yocto build 目录下禁止强制清理，会破坏 sysroot |
| **禁止 bitbake cleansstate/clean** | 见 AGENTS.md，会导致 mergerfs 权限错误损坏 sysroot |
| **禁止直接 push main** | 所有修改必须在 feature 分支完成，严禁直接推送 main/master |

---

## 工作流概览

```
1. 创建 feature 分支 (feature/MMDD-HHMM)
   ↓
2. 开发 + 修复 Bug
   ↓
3. Docker 编译验证 → MUST 通过
   ↓
4. adb push 到设备 + 用户测试 → MUST 用户确认通过
   ↓
5. [等待用户明确说"可以提交"] → git add + git commit
   ↓
6. [等待用户明确说"可以推送"] → git push origin feature/MMDD-HHMM
```

---

## 分支命名规则

| 类型 | 格式 | 示例 |
|------|------|------|
| 功能开发 | `feature/MMDD-HHMM` | `feature/0522-1430` |
| Bug 修复 | `feature/MMDD-HHMM` | `feature/0523-0930` |
| 热修复 | `hotfix/MMDD-HHMM` | `hotfix/0522-2100` |

```bash
# 创建并切换 feature 分支
git checkout -b feature/$(date +%m%d-%H%M)

# 查看当前分支
git branch -v

# 示例：基于 main 创建分支
git checkout main && git pull origin main
git checkout -b feature/0522-1430
```

---

## Commit Message 格式

项目固定格式（必须严格遵守）：

```
JAX Emedded Camera: <一句话描述，动词开头，<72字符>

- 变更点1：说明做了什么，为什么这样做
- 变更点2：说明做了什么，为什么这样做
- 变更点3：（如适用）

Test-Result:
1. <测试项目>: <结果描述>
2. <测试项目>: <结果描述>

IssueID: To be determined
Change-Id: <由 git hook 自动生成，或留空>
```

### 真实示例

```
JAX Emedded Camera: Fix IMU boot race with async SEESalt init

Make init() non-blocking by spawning background thread, recreate
see_salt instance on each retry to refresh sensor list cache

Test-Result:
Device reboot verified, IMU sensors found on 2nd attempt (~3s),
service startup not blocked, 500Hz streaming OK

IssueID: To be determined
Change-Id: Ic98c3dd7819ba0c23a557fd1efba9c757b1b0aa7
```

### 类型前缀参考（subject 第一个动词）

| 场景 | 推荐动词 |
|------|----------|
| 新功能 | Add, Implement, Support |
| Bug 修复 | Fix, Resolve, Correct |
| 重构 | Refactor, Simplify, Extract |
| 性能 | Optimize, Reduce, Improve |
| 配置/文档 | Update, Revise |
| 删除/清理 | Remove, Clean up |

---

## 编译验证（commit 的前提条件）

**仅当编译通过后才能请用户确认是否 commit。编译方式取决于具体项目，使用前先确认当前项目类型。**

### 方式 A：Yocto/Bitbake（jax 项目 / 嵌入式 Linux 发行版）

```bash
# 标准编译（首选）
docker exec -u scm jax /bin/bash -c \
  "cd ~/zjycode/jax/LE.PRODUCT.11.0/apps_proc/ && \
   source poky/oe-init-build-env build-qti-distro-fullstack-debug && \
   bitbake -c package_write_ipk spcam"

# 强制重编（bitbake 未检测到变更时）
docker exec -u scm jax /bin/bash -c \
  "cd ~/zjycode/jax/LE.PRODUCT.11.0/apps_proc/ && \
   source poky/oe-init-build-env build-qti-distro-fullstack-debug && \
   bitbake -c compile -f spcam && bitbake -c package_write_ipk spcam"

# 注意：禁止使用 bitbake -c cleansstate/clean（会损坏 mergerfs sysroot）
```

### 方式 B：CMake（viola 等独立 C++ 工程）

```bash
# 在 build 目录编译
cd <project_root>/build
cmake .. -DCMAKE_BUILD_TYPE=Debug    # 或 Release
make -j$(nproc)

# 若使用交叉编译工具链（aarch64）
cmake .. -DCMAKE_TOOLCHAIN_FILE=<toolchain.cmake>
make -j$(nproc)
```

### 方式 C：Android（AOSP / Qualcomm Android）

```bash
# 初始化编译环境
source build/envsetup.sh
lunch <product_name>-userdebug     # 例如 lunch kona-userdebug

# 编译整个 system（耗时长，谨慎使用）
make -j$(nproc)

# 编译单个模块（推荐）
make <module_name> -j$(nproc)
# 或
mmm <path/to/module>
```

### 方式 D：自定义构建脚本

```bash
# 不同项目可能有自己的 build.sh / compile.sh
# 使用前询问用户当前项目的构建命令
# 示例：
./build.sh --target release --arch aarch64
# 或
bash scripts/compile.sh <module>
```

> **判断原则**：若不确定用哪种方式，先问用户"这个项目怎么编译？"，不要猜测。

---

## 设备部署（编译 + 测试循环）

```bash
# Push IPK 到设备并安装
adb root && adb shell "mount -o remount,rw /"

adb push \
  /mnt/tmp/zjycode/jax/LE.PRODUCT.11.0/apps_proc/build-qti-distro-fullstack-debug/tmp-glibc/deploy/ipk/aarch64/spcam_0.0-r0_aarch64.ipk \
  /mnt/tmp/zjycode/jax/LE.PRODUCT.11.0/apps_proc/build-qti-distro-fullstack-debug/tmp-glibc/deploy/ipk/aarch64/spcam-dev_0.0-r0_aarch64.ipk \
  /tmp/

adb shell "opkg install --force-reinstall --force-overwrite --force-depends \
  /tmp/spcam_0.0-r0_aarch64.ipk /tmp/spcam-dev_0.0-r0_aarch64.ipk"

# 重启服务
adb shell "killall -9 spcam_main_server 2>/dev/null; sleep 1; systemctl start spcam.service"
```

---

## Commit 操作（仅用户确认后执行）

```bash
# 查看当前变更
git status
git diff --stat

# Stage 变更
git add -p          # 交互式逐块 stage（推荐，避免误提交）
# 或
git add <file>      # 指定文件

# 阶段性 commit（编译通过但测试未完全时）
git commit -m "WIP: [简短描述]"   # 仅内部临时使用，测试完成前不 push

# 正式 commit（用户确认测试通过后）
git commit
# 编辑器弹出时按上方格式填写 commit message
```

---

## Push 操作（仅用户明确批准后执行）

```bash
# push 当前 feature 分支到远端
git push origin feature/MMDD-HHMM

# 首次 push（设置 upstream）
git push -u origin feature/MMDD-HHMM

# 查看远端分支列表
git branch -r

# 跟踪远端变化（不合并）
git fetch --all
```

---

## 常用 Git 操作速查

```bash
# 查看最近提交
git log --oneline -10

# 查看某提交的完整内容
git show <commit-hash>

# 查看文件变更历史
git log --follow -p <file>

# 暂存当前工作
git stash push -m "WIP: <描述>"
git stash list
git stash pop

# 从 main 拉最新代码（不合并到当前分支）
git fetch origin main

# 将 main 最新提交合并到当前分支
git merge origin/main
# 或者 rebase（保持线性历史）
git rebase origin/main

# 创建 patch 文件（给对方应用）
git format-patch HEAD~1
git format-patch <from-commit>..<to-commit>

# 应用 patch
git am <patch-file>
```

---

## 冲突解决流程

```bash
# 发生冲突时
git status   # 查看冲突文件

# 手动编辑冲突文件（查找 <<<<<<< HEAD）
# 编辑后：
git add <resolved-file>
git commit   # 完成合并提交

# 放弃合并，回到合并前状态
git merge --abort
# 或 rebase 时
git rebase --abort
```

---

## 禁止操作（详细清单）

```bash
# ❌ 以下命令禁止使用：
git push --force                    # 破坏远端提交历史
git push -f origin main             # 力推主分支，绝对禁止
git push origin main                # 直接推 main，禁止
git clean -xdf                      # 删除 .gitignore 外所有文件（损坏 build）
git reset --hard HEAD~N             # 丢失提交，需用户明确确认才可执行
git commit --amend                  # 修改已 push 的提交（会造成冲突）

# ❌ Yocto 禁止操作：
bitbake -c cleansstate spcam        # 导致 mergerfs 权限错误损坏 sysroot
bitbake -c clean spcam              # 同上
```

---

## 拉取远端最新代码（Pull + Rebase 工作流）

> 场景：远端有新提交（同事推了代码），你本地有 WIP 修改，需要把远端最新变更合并进来。

### Step 0：确认是否要在当前分支操作还是新建分支

**必须先询问用户！** 不同场景有不同推荐：

| 场景 | 建议 |
|------|------|
| feature 分支时间较长、远端变化大 | **推荐**：基于最新 main 新建分支，cherry-pick 自己的提交 |
| 小改动、仅有 1-2 个文件冲突 | **可以**：直接在当前分支 rebase |
| 远端强更新（别人 force push 了 main） | **必须**：reset 到远端，重新 cherry-pick 自己的提交 |

```
[询问用户]：
"远端有新提交，你的本地也有修改。建议方案：
  A) 在当前分支直接 rebase（适合冲突少的情况）
  B) 新建分支 feature/MMDD-HHMM，基于最新 main 重新开始（适合差异较大的情况）
  你更倾向哪种方式？"
```

---

### Step 1：保存本地 WIP（git stash）

```bash
# 查看当前未提交修改
git status
git diff --stat

# 暂存所有修改（含未 stage 的文件）
git stash push -m "WIP: <当前工作描述>"

# 确认 stash 成功
git status   # 应该显示 clean working tree
git stash list
```

---

### Step 2：获取远端最新代码（dry-run 先看看差异）

```bash
# 先 fetch，不合并（dry-run，只查看）
git fetch origin

# 查看与远端 main 的差异（不执行合并）
git log HEAD..origin/main --oneline    # 远端有哪些新提交
git diff HEAD origin/main --stat       # 新提交改了哪些文件
```

**在 dry-run 结果出来后，报告给用户**：
- 远端有 N 个新提交
- 涉及的文件列表
- 是否与当前 stash 的文件有重叠（重叠 = 后续 pop 时可能再次冲突）

---

### Step 3：执行 Rebase

```bash
# 方案 A：直接 rebase 到远端 main
git rebase origin/main

# 方案 B：新建分支（如用户选择 B 路）
git checkout origin/main -b feature/$(date +%m%d-%H%M)
```

---

### Step 4：逐个解决 Rebase 冲突（关键步骤，必须与用户协同）

```bash
# 查看当前冲突文件
git status    # 显示 "both modified"

# 查看具体冲突内容（每个文件都要看，汇报给用户）
git diff <conflict-file>
```

**冲突处理原则（必须先给用户看，让用户评估）：**

```
对每个冲突文件，向用户报告：
1. 文件名
2. 冲突的代码块（<<<<<<< HEAD ... ======= ... >>>>>>> origin/main）
3. 解释：<<<<<<< HEAD 是本地的，>>>>>>> origin/main 是远端的
4. 提出建议（但由用户做最终决定）：
   - 两边独立功能 → 两边都保留
   - 同一行被双方修改 → 合并语义（不是简单选一方）
   - 远端新增了新函数，本地也新增了新函数 → 全部保留
   - 不存在"谁覆盖谁" → 除非用户明确说要丢弃某些改动
```

```bash
# 解决完一个文件后：
git add <resolved-file>

# 继续 rebase（解决完所有冲突后）
git rebase --continue

# 如果某个 commit 解决不了，跳过（需用户确认！）
git rebase --skip   # ⚠️ 会丢失这个提交，需用户批准

# 完全放弃 rebase，回到 rebase 前状态
git rebase --abort
```

---

### Step 5：Pop stash（可能再次冲突）

> ⚠️ 如果 stash 里的文件和 rebase 带来的改动有重叠，pop 时会再次冲突，需再解决一次。

```bash
git stash pop

# 检查是否有冲突
git status

# 如果有冲突，按 Step 4 的流程再次与用户协同解决
# 解决后 git add <file>（注意：stash pop 冲突不需要 git commit，直接继续工作即可）
```

---

### Step 6：验证 + 编译（强制）

rebase + stash pop 完成后，本地代码已经变化，**必须重新编译验证**：

```bash
# 按项目类型选择编译方式（见「编译验证」章节）
# 确认编译通过后，再告知用户继续测试
```

---

### 全流程 checklist

```
Pull + Rebase 流程进度:
- [ ] Step 0: 询问用户：直接 rebase 还是新建分支？
- [ ] Step 1: git stash push -m "WIP: ..." （保存本地修改）
- [ ] Step 2: git fetch + dry-run 查看远端差异，报告给用户
- [ ] Step 3: git rebase origin/main（或新建分支）
- [ ] Step 4: 逐文件分析冲突，给用户报告 + 建议，等用户决策后解决
- [ ] Step 5: git stash pop，处理 pop 冲突（如有）
- [ ] Step 6: 重新编译验证，通过后告知用户继续测试
```

---

## 关键检查点（每次操作前）

```
Git 操作前自查:
- [ ] 当前在 feature 分支，不在 main? (git branch)
- [ ] Docker 编译已通过? (bitbake 返回 0)
- [ ] 用户已确认设备测试通过? (测试反馈)
- [ ] 用户明确说"可以提交"? (才能 commit)
- [ ] 用户明确说"可以推送"? (才能 push)
```
