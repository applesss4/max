#!/bin/bash

# 数据库重置脚本
# 用于在本地Supabase环境中应用数据库结构

echo "正在重置Supabase数据库..."

# 应用数据库迁移
npx supabase db reset

if [ $? -eq 0 ]; then
    echo "数据库重置成功！"
    echo "您可以使用以下命令启动开发服务器："
    echo "npm run dev"
else
    echo "数据库重置失败，请检查错误信息。"
fi