#!/bin/bash
# Git Workflow Skill 安装脚本
# 用法: bash install.sh [target]
# target: cursor (默认) | claude-code | toder | all

TARGET=${1:-cursor}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 使用软链接安装（不复制文件，修改源文件立即生效）
install_symlink() {
    local dest="$1"
    if [ -L "$dest" ] && [ "$(readlink "$dest")" = "$SCRIPT_DIR" ]; then
        echo "[OK] Already linked: $dest -> $SCRIPT_DIR"
        return
    fi
    if [ -e "$dest" ]; then
        echo "[WARN] $dest 已存在（不是软链接），删除后重新创建软链接..."
        rm -rf "$dest"
    fi
    mkdir -p "$(dirname "$dest")"
    ln -s "$SCRIPT_DIR" "$dest"
    echo "[OK] Symlink created: $dest -> $SCRIPT_DIR"
}

case "$TARGET" in
    cursor)
        install_symlink "$HOME/.cursor/skills/git-workflow"
        ;;
    claude-code)
        install_symlink "$HOME/.claude/skills/git-workflow"
        ;;
    toder)
        install_symlink "$HOME/.toder/skills/git-workflow"
        ;;
    all)
        install_symlink "$HOME/.cursor/skills/git-workflow"
        install_symlink "$HOME/.claude/skills/git-workflow"
        install_symlink "$HOME/.toder/skills/git-workflow"
        ;;
    *)
        echo "Usage: bash install.sh [cursor|claude-code|toder|all]"
        exit 1
        ;;
esac

echo ""
echo "=== Git Workflow Skill 安装完成 ==="
echo "源目录: $SCRIPT_DIR"
echo "（软链接方式，修改源文件后所有工具自动同步，无需重新安装）"
echo ""
echo "验证: 在新对话中提问 '我要提交代码，怎么写 commit message？' 测试 skill 是否生效"
