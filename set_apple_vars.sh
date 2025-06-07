#!/bin/bash

# 快速设置Apple开发相关环境变量

# 检测当前shell类型
if [[ $SHELL == *"zsh"* ]]; then
    CONFIG_FILE="$HOME/.zshrc"
else
    CONFIG_FILE="$HOME/.bash_profile"
    [ ! -f "$CONFIG_FILE" ] && CONFIG_FILE="$HOME/.bashrc"
fi

# 备份配置文件
cp "$CONFIG_FILE" "${CONFIG_FILE}.bak_$(date +%Y%m%d)"

# 读取输入
read -p "请输入Apple ID: " APPLE_ID
read -s -p "请输入Apple密码: " APPLE_PASSWORD
echo
read -p "请输入Apple Team ID: " APPLE_TEAM_ID

# 写入环境变量
echo -e "\n# Apple开发相关环境变量" >> "$CONFIG_FILE"
echo "export APPLE_ID=\"$APPLE_ID\"" >> "$CONFIG_FILE"
echo "export APPLE_PASSWORD=\"$APPLE_PASSWORD\"" >> "$CONFIG_FILE"
echo "export APPLE_TEAM_ID=\"$APPLE_TEAM_ID\"" >> "$CONFIG_FILE"

# 立即生效
source "$CONFIG_FILE"

echo -e "\n环境变量设置完成！"
echo "APPLE_ID: $APPLE_ID"
echo "APPLE_TEAM_ID: $APPLE_TEAM_ID"
echo "密码已设置但出于安全考虑不显示"