# Eval Results Template — YYYY-MM-DD

> 使用前请将文件名改为实际日期，如 `2026-05-29.md`

## 测试信息

- **日期**: YYYY-MM-DD
- **测试人**: @username
- **AI 工具**: Cursor / Claude / GitHub Copilot
- **Skill 版本**: (git commit hash)

---

## 汇总

| 总用例 | 正例通过 | 负例通过 | 总通过率 | 平均质量分 |
|--------|---------|---------|---------|-----------|
| 12 | ? / 10 | ? / 2 | ?% | ? / 5 |

---

## 正例详情

### eval-01 — 写 commit message

**输入**: 我要提交代码，怎么写 commit message？

**检查项结果**:
| 检查项 | 通过 | 备注 |
|--------|------|------|
| uses_jax_format | ⬜ | |
| has_type_prefix | ⬜ | |
| has_test_result_field | ⬜ | |
| has_change_id_field | ⬜ | |
| provides_example | ⬜ | |

**must_not 违反**: 无 / (描述)

**质量分**: ? / 5

**备注**: 

---

### eval-02 — 编译通过后能否直接 commit

**输入**: bitbake 编译通过了，可以直接 git commit 了吗？

**检查项结果**:
| 检查项 | 通过 | 备注 |
|--------|------|------|
| asks_device_test | ⬜ | |
| no_auto_commit | ⬜ | |
| explains_test_first_rule | ⬜ | |
| asks_user_confirmation | ⬜ | |

**must_not 违反**: 无

**质量分**: ? / 5

**备注**: 

---

### eval-03 — push 代码到远端

**输入**: 帮我 git push 代码到远端

**检查项结果**:
| 检查项 | 通过 | 备注 |
|--------|------|------|
| fetch_before_push | ⬜ | |
| check_remote_ahead | ⬜ | |
| no_auto_push | ⬜ | |
| asks_user_permission | ⬜ | |
| no_force_push_advice | ⬜ | |

**must_not 违反**: 无

**质量分**: ? / 5

**备注**: 

---

### eval-04 — 创建 feature 分支

**输入**: 我要创建一个新的 feature 分支

**检查项结果**:
| 检查项 | 通过 | 备注 |
|--------|------|------|
| uses_MMDD_HHMM_format | ⬜ | |
| provides_checkout_command | ⬜ | |
| suggests_start_from_main | ⬜ | |

**must_not 违反**: 无

**质量分**: ? / 5

**备注**: 

---

### eval-05 — 有 WIP 时同步远端

**输入**: 同事推了新代码，我的 WIP 改动还没提交，怎么更新到最新？

**检查项结果**:
| 检查项 | 通过 | 备注 |
|--------|------|------|
| stash_first | ⬜ | |
| dry_run_fetch | ⬜ | |
| ask_rebase_or_new_branch | ⬜ | |
| rebase_not_merge | ⬜ | |
| stash_pop_warning | ⬜ | |

**must_not 违反**: 无

**质量分**: ? / 5

**备注**: 

---

### eval-06 — push rejected non-fast-forward

**输入**: git push 失败，报错 rejected non-fast-forward

**检查项结果**:
| 检查项 | 通过 | 备注 |
|--------|------|------|
| explains_why_rejected | ⬜ | |
| no_force_push | ⬜ | |
| provides_rebase_solution | ⬜ | |
| fetch_first_step | ⬜ | |

**must_not 违反**: 无

**质量分**: ? / 5

**备注**: 

---

### eval-07 — rebase 冲突处理

**输入**: rebase 过程中出现冲突，怎么解决？

**检查项结果**:
| 检查项 | 通过 | 备注 |
|--------|------|------|
| shows_conflict_content_to_user | ⬜ | |
| collaborative_resolution | ⬜ | |
| no_blind_pick_one_side | ⬜ | |
| explains_head_vs_remote | ⬜ | |
| both_new_features_keep_all | ⬜ | |

**must_not 违反**: 无

**质量分**: ? / 5

**备注**: 

---

### eval-08 — 用户确认测试通过，帮我提交

**输入**: 编译成功了，我确认设备测试也通过了，可以提交了

**检查项结果**:
| 检查项 | 通过 | 备注 |
|--------|------|------|
| fetch_before_commit | ⬜ | |
| stages_changes_check | ⬜ | |
| uses_correct_commit_format | ⬜ | |
| waits_user_confirm_to_commit | ⬜ | |

**must_not 违反**: 无

**质量分**: ? / 5

**备注**: 

---

### eval-09 — cherry-pick 到 main

**输入**: 帮我把这次改动 cherry-pick 到 main 分支

**检查项结果**:
| 检查项 | 通过 | 备注 |
|--------|------|------|
| warns_no_direct_push_main | ⬜ | |
| explains_cherry_pick_cmd | ⬜ | |
| asks_target_branch | ⬜ | |
| compile_verify_reminder | ⬜ | |

**must_not 违反**: 无

**质量分**: ? / 5

**备注**: 

---

### eval-10 — 撤销误 add 的文件

**输入**: 我不小心 git add 了一个不该提交的文件，怎么撤销？

**检查项结果**:
| 检查项 | 通过 | 备注 |
|--------|------|------|
| provides_git_restore_staged | ⬜ | |
| no_data_loss | ⬜ | |
| explains_difference_reset_restore | ⬜ | |

**must_not 违反**: 无

**质量分**: ? / 5

**备注**: 

---

## 负例详情

### eval-neg-01 — Python 函数重构

**输入**: help me refactor this Python function to use list comprehension

| 检查项 | 通过 | 备注 |
|--------|------|------|
| not_trigger_git_skill | ⬜ | |
| no_git_workflow_info | ⬜ | |

**质量分**: N/A（负例只看是否误触发）

---

### eval-neg-02 — C++ 内存泄漏

**输入**: 这段 C++ 代码有内存泄漏，帮我分析一下

| 检查项 | 通过 | 备注 |
|--------|------|------|
| not_trigger_git_skill | ⬜ | |
| no_git_workflow_info | ⬜ | |

**质量分**: N/A

---

## 改进记录

本次测试发现的问题及后续改进计划：

1. (填写)
2. (填写)
