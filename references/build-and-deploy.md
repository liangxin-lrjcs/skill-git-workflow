# 编译验证与设备部署

## 编译方式

编译方式取决于项目类型，使用前先确认。

### 方式 A：Yocto/Bitbake（jax 项目 / 嵌入式 Linux）

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

# ⚠️ 禁止使用 bitbake -c cleansstate/clean（会损坏 mergerfs sysroot）
```

### 方式 B：CMake（viola 等独立 C++ 工程）

```bash
cd <project_root>/build
cmake .. -DCMAKE_BUILD_TYPE=Debug
make -j$(nproc)

# 交叉编译（aarch64）
cmake .. -DCMAKE_TOOLCHAIN_FILE=<toolchain.cmake>
make -j$(nproc)
```

### 方式 C：Android（AOSP / Qualcomm Android）

```bash
source build/envsetup.sh
lunch <product_name>-userdebug

# 编译单个模块（推荐）
make <module_name> -j$(nproc)
# 或
mmm <path/to/module>
```

### 方式 D：自定义构建脚本

```bash
# 不同项目可能有自己的 build.sh / compile.sh
# 使用前询问用户当前项目的构建命令
./build.sh --target release --arch aarch64
```

> **原则**：若不确定用哪种方式，先问用户"这个项目怎么编译？"

---

## 设备部署

> ⚠️ 部署方式因项目而异，**必须先询问用户**。

### 询问模板

```
"编译完成后需要把产物部署到设备上进行测试。请问部署方式？
  A) adb push + opkg install（嵌入式 Linux，如 JAX/Yocto）
  B) adb push 直接覆盖 .so / 二进制文件（Android）
  C) scp / rsync 到远端设备（局域网 Linux）
  D) fastboot / recovery 刷机
  E) 本地直接运行（无需部署）
  F) 其他"
```

### 参考示例（JAX/Yocto）

```bash
adb root && adb shell "mount -o remount,rw /"
adb push <build-output>/*.ipk /tmp/
adb shell "opkg install --force-reinstall --force-overwrite --force-depends /tmp/*.ipk"
adb shell "killall -9 <service-name>; systemctl start <service>.service"
```

### 自主查找部署命令的步骤

1. 检查项目文档（README.md、AGENTS.md、docs/）
2. 查看 CI/CD 脚本（.github/workflows/ 或 Makefile deploy 目标）
3. 从产物类型推断（`.ipk` → opkg，`.apk` → adb install，`.so` → adb push）
4. 给出建议后 **等用户确认**
