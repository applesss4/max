# 部署指南

本文档说明如何正确部署本应用到Vercel或其他云平台。

## 环境变量配置

在部署到线上环境时，需要正确配置以下环境变量：

### 必需的环境变量

1. `NEXT_PUBLIC_OPENWEATHER_API_KEY` - OpenWeather API密钥
2. `NEXT_PUBLIC_SUPABASE_URL` - Supabase项目URL
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase匿名访问密钥
4. `SUPABASE_SERVICE_ROLE_KEY` - Supabase服务角色密钥
5. `NEXT_PUBLIC_SHOW_NEWS` - 控制是否显示新闻功能 (true/false)

## Vercel部署配置

### 1. 在Vercel中设置环境变量

1. 登录到您的Vercel账户
2. 进入您的项目设置页面
3. 点击"Settings"标签
4. 在左侧菜单中选择"Environment Variables"
5. 添加以下环境变量：

```
NEXT_PUBLIC_OPENWEATHER_API_KEY=您的OpenWeather API密钥
NEXT_PUBLIC_SUPABASE_URL=您的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=您的Supabase匿名访问密钥
SUPABASE_SERVICE_ROLE_KEY=您的Supabase服务角色密钥
NEXT_PUBLIC_SHOW_NEWS=true
```

### 2. 获取OpenWeather API密钥

1. 访问 [OpenWeatherMap](https://openweathermap.org/api)
2. 注册账户或登录
3. 进入"API keys"页面
4. 创建一个新的API密钥或使用现有的密钥
5. 将密钥复制并添加到Vercel环境变量中

### 3. 获取Supabase凭证

1. 登录到您的 [Supabase](https://supabase.com/) 账户
2. 进入您的项目
3. 点击左侧的"Project Settings"
4. 在"API"标签下找到以下信息：
   - Project URL
   - anon key
   - service_role key

## 本地开发环境配置

在本地开发时，请确保在项目根目录下创建 `.env.local` 文件，并添加以下内容：

```env
# OpenWeather API Key
NEXT_PUBLIC_OPENWEATHER_API_KEY=您的OpenWeather API密钥

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=您的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=您的Supabase匿名访问密钥
SUPABASE_SERVICE_ROLE_KEY=您的Supabase服务角色密钥

# 控制是否在仪表板上显示新闻功能
NEXT_PUBLIC_SHOW_NEWS=true
```

## 常见问题排查

### 1. "OpenWeather API密钥未配置"错误

**问题**: 在浏览器控制台看到"OpenWeather API密钥未配置"错误。

**解决方案**:
- 检查Vercel项目设置中的环境变量是否正确配置
- 确保环境变量名称完全匹配：`NEXT_PUBLIC_OPENWEATHER_API_KEY`
- 重新部署应用以使环境变量生效

### 2. 天气数据不显示

**问题**: 天气数据无法加载或显示。

**解决方案**:
- 检查API密钥是否有效
- 确认网络连接正常
- 查看浏览器控制台的详细错误信息

### 3. 环境变量在本地工作但在线上不工作

**问题**: 应用在本地开发环境中正常工作，但在部署后出现问题。

**解决方案**:
- 确保在Vercel中正确设置了环境变量
- 检查环境变量前缀是否为`NEXT_PUBLIC_`（客户端需要访问的变量必须使用此前缀）
- 重新部署应用

## 部署步骤

1. 确保所有环境变量已正确配置
2. 提交代码到Git仓库
3. 在Vercel中连接Git仓库并部署
4. 部署完成后，检查应用功能是否正常

## 注意事项

- 环境变量名称区分大小写
- 客户端可访问的环境变量必须以`NEXT_PUBLIC_`开头
- 修改环境变量后需要重新部署应用才能生效
- 不要在代码中硬编码敏感信息