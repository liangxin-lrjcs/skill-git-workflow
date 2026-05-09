# Git Workflow Skill — 评分标准 (Grader)

> 本文档定义所有 eval 用例的打分维度。每个 `expected_checks` 字段中的检查项均为 **0/1 二元评分**，质量分为 **1–5 级**。

---

## 一、通用评分维度

| 维度 | 说明 |
|------|------|
| **trigger** | Skill 是否被正确激活（should_trigger=true 时必须激活，=false 时不得激活）|
| **checklist** | expected_checks 中各项是否满足，每项独立 0/1 |
| **no_violation** | 是否违反 must_not 原则（任何违反均为质量降1级）|
| **quality** | 1–5 整体质量评分 |

---

## 二、各用例检查项定义

### eval-01（写 commit message）

| 检查项 | 满足条件 |
|--------|---------|
| `uses_jax_format` | 给出的 commit message 格式包含 `JAX Emedded Camera: <desc>` 格式的 subject |
| `has_type_prefix` | subject 以动词开头（Fix / Add / Implement / Refactor / Update 等）|
| `has_test_result_field` | commit body 包含 `Test-Result:` 字段 |
| `has_change_id_field` | 提及 `Change-Id:` 字段（即使留空或说明会自动生成）|
| `provides_example` | 给出了完整可用的 commit message 示例（不只是格式模板）|

**must_not**：省略 Test-Result 字段；使用 Conventional Commits 格式（feat:/fix: 前缀）代替项目格式

---

### eval-02（编译通过后能否直接 commit）

| 检查项 | 满足条件 |
|--------|---------|
| `asks_device_test` | 询问或提醒：设备测试是否已完成？|
| `no_auto_commit` | 没有自动执行 `git commit` 或直接给出 commit 命令让用户盲目复制 |
| `explains_test_first_rule` | 明确说明"先编译 + 设备测试通过，才能 commit"原则 |
| `asks_user_confirmation` | 明确需要用户确认测试通过后才继续 |

**must_not**：直接给出 `git commit -m "..."` 命令暗示立即执行；跳过设备测试检查

---

### eval-03（push 代码到远端）

| 检查项 | 满足条件 |
|--------|---------|
| `fetch_before_push` | 在 push 前先执行 `git fetch origin` 检查远端状态 |
| `check_remote_ahead` | 给出检测远端是否有新提交的命令（如 `git log HEAD..origin/<branch>`）|
| `no_auto_push` | 没有自动执行 push，而是等待用户明确批准 |
| `asks_user_permission` | 明确向用户确认"可以 push 吗？"或等待用户指令 |
| `no_force_push_advice` | 没有建议或暗示使用 `--force` 解决问题 |

**must_not**：自动执行 `git push`；建议 force push；跳过 fetch 检查

---

### eval-04（创建 feature 分支）

| 检查项 | 满足条件 |
|--------|---------|
| `uses_MMDD_HHMM_format` | 提供的分支命名示例符合 `feature/MMDD-HHMM` 格式 |
| `provides_checkout_command` | 给出 `git checkout -b feature/MMDD-HHMM` 或等效命令 |
| `suggests_start_from_main` | 建议基于 main（或远端最新 main）创建分支，而非随意分支 |

**must_not**：使用任意分支名（如 `feature/my-fix`）而不提醒格式规范

---

### eval-05（有 WIP 时同步远端新代码）

| 检查项 | 满足条件 |
|--------|---------|
| `stash_first` | 第一步建议 `git stash push -m "WIP: ..."` 保存 WIP |
| `dry_run_fetch` | 先 `git fetch` 后给出 dry-run 差异查看命令（`git log HEAD..origin/main`）|
| `ask_rebase_or_new_branch` | 询问用户：直接 rebase 还是新建分支？提供两种方案 |
| `rebase_not_merge` | 推荐使用 `git rebase origin/main` 而非 `git merge`（保持线性历史）|
| `stash_pop_warning` | 提醒 `stash pop` 后可能再次产生冲突 |

**must_not**：直接 `git pull --merge` 不先 stash；不询问用户方向直接执行 rebase

---

### eval-06（push rejected non-fast-forward）

| 检查项 | 满足条件 |
|--------|---------|
| `explains_why_rejected` | 解释：远端有新提交，本地超前，不能 fast-forward |
| `no_force_push` | 明确说明禁止使用 `--force` 解决此问题 |
| `provides_rebase_solution` | 给出正确解法：`git fetch origin` → `git rebase origin/<branch>` → 重新 push |
| `fetch_first_step` | 解法的第一步是 `git fetch origin` |

**must_not**：建议 `git push --force`；给出 `git pull --merge` 解法（会产生 merge commit）

---

### eval-07（rebase 冲突处理）

| 检查项 | 满足条件 |
|--------|---------|
| `shows_conflict_content_to_user` | 建议用 `git diff` 或文件内容展示冲突给用户看 |
| `collaborative_resolution` | 说明需要与用户协同决策，不独自处理 |
| `no_blind_pick_one_side` | 没有简单说"接受本地"或"接受远端"，而是分析语义 |
| `explains_head_vs_remote` | 解释 `<<<<<<< HEAD`（本地）和 `>>>>>>> origin/...`（远端）的含义 |
| `both_new_features_keep_all` | 说明两边的新增功能（新函数/新类型）应全部保留 |

**must_not**：自己决定冲突解决方向；省略向用户展示冲突内容

---

### eval-08（用户确认测试通过，帮我提交）

| 检查项 | 满足条件 |
|--------|---------|
| `fetch_before_commit` | commit 前先执行 `git fetch origin` 检查远端 |
| `stages_changes_check` | 先展示 `git status / git diff --stat` 让用户确认 stage 内容 |
| `uses_correct_commit_format` | 提示用 JAX Emedded Camera 格式填写 commit message |
| `waits_user_confirm_to_commit` | 展示 commit message 模板后等用户确认，而非直接 commit |

**must_not**：跳过 fetch；自动 commit 不等用户确认；使用错误的 commit message 格式

---

### eval-09（cherry-pick 到 main）

| 检查项 | 满足条件 |
|--------|---------|
| `warns_no_direct_push_main` | 警告：不能直接 push 到 main，cherry-pick 后需通过 PR |
| `explains_cherry_pick_cmd` | 给出 `git cherry-pick <commit-hash>` 命令 |
| `asks_target_branch` | 询问目标分支（确认是否 main 还是其他分支）|
| `compile_verify_reminder` | 提醒 cherry-pick 后需要重新编译验证 |

**must_not**：直接建议 `git push origin main`；省略编译验证步骤

---

### eval-10（撤销误 add 的文件）

| 检查项 | 满足条件 |
|--------|---------|
| `provides_git_restore_staged` | 给出 `git restore --staged <file>` 或 `git reset HEAD <file>` 命令 |
| `no_data_loss` | 明确说明此操作不会删除文件内容，只是取消 stage |
| `explains_difference_reset_restore` | 区分 `git restore --staged`（取消 stage）和 `git restore`（丢弃工作区修改）|

**must_not**：建议 `git checkout <file>`（会丢失工作区修改）；建议 `git clean -f`

---

### eval-neg-01（Python 函数重构）

| 检查项 | 满足条件 |
|--------|---------|
| `not_trigger_git_skill` | Skill 未被激活，直接回答 Python 相关问题 |
| `no_git_workflow_info` | 回复中没有出现 git workflow 相关内容 |

---

### eval-neg-02（C++ 内存泄漏分析）

| 检查项 | 满足条件 |
|--------|---------|
| `not_trigger_git_skill` | Skill 未被激活，直接分析 C++ 内存问题 |
| `no_git_workflow_info` | 回复中没有出现 git workflow 相关内容 |

---

## 三、质量分级标准

| 分数 | 描述 |
|------|------|
| 5 | 完全满足所有 checklist，无 must_not 违反，回答清晰简洁，提供可直接使用的命令 |
| 4 | 满足所有 checklist，回答略有冗余或命令需要用户小幅调整 |
| 3 | 满足主要 checklist（≥60%），有1个次要遗漏，无 must_not 违反 |
| 2 | 只满足部分 checklist（<60%），或存在轻微 must_not 违反 |
| 1 | 未触发 Skill / 严重错误 / 违反核心规则（如自动 push、force push 建议）|
