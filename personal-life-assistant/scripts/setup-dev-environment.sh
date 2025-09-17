#!/bin/bash

# 个人生活管家开发环境设置脚本

echo "=== 个人生活管家开发环境设置 ==="
echo

# 检查Docker是否安装
if ! command -v docker &> /dev/null
then
    echo "错误: Docker未安装"
    echo "请先从 https://docs.docker.com/desktop/ 安装Docker Desktop"
    exit 1
fi

echo "✓ Docker已安装"

# 检查Docker是否运行
if ! docker info &> /dev/null
then
    echo "错误: Docker未运行"
    echo "请启动Docker Desktop应用程序"
    exit 1
fi

echo "✓ Docker正在运行"

# 检查Supabase CLI是否安装
if ! command -v supabase &> /dev/null
then
    echo "安装Supabase CLI..."
    npm install -g supabase
fi

echo "✓ Supabase CLI已安装"

# 安装项目依赖
echo "安装项目依赖..."
npm install

# 启动Supabase本地环境
echo "启动Supabase本地环境..."
supabase start

# 应用数据库结构
echo "应用数据库结构..."
supabase db reset

echo
echo "=== 设置完成 ==="
echo
echo "您可以现在启动开发服务器:"
echo "npm run dev"
echo
echo "请先注册账户，然后登录使用应用"