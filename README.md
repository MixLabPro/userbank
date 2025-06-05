# UserBank

<div align="center">
  
**个人数据银行桌面应用**

[![Tauri](https://img.shields.io/badge/Tauri-2.0+-blue.svg)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18+-green.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

*从"数据寄存在各个平台" 到 "拥有自己的数据银行"*

[快速开始](#-快速开始) • [核心功能](#-核心功能) • [使用指南](#-使用指南) • [开发指南](#-开发指南)

</div>

---

## 🎯 什么是UserBank？

UserBank 全称是**Unified Smart Experience Records Bank**，一个基于**Tauri 2.0**构建的跨平台桌面应用。UserBank让你能够统一管理与AI交互产生的所有智能经验记录，通过现代化的桌面界面，安全地存储和管理你的个人数据。

### 🔗 UserBank Core集成

UserBank桌面应用内置了**UserBank Core**作为其数据引擎，提供完整的MCP（Model Context Protocol）支持：

- **MCP服务器**：内置标准化的MCP服务器，支持stdio和SSE两种通信模式
- **标准化接口**：通过MCP协议为所有支持的AI应用提供统一的数据访问接口
- **实时同步**：桌面应用的数据变更会实时同步到MCP服务，确保AI应用获取最新信息
- **无缝集成**：一键启动MCP服务，无需额外配置即可与Claude、ChatGPT等AI应用连接

这意味着你可以在UserBank桌面应用中管理数据，同时让所有AI助手通过MCP协议访问这些数据，实现真正的跨平台数据统一。

### 解决的问题

当你与不同AI助手（Claude、ChatGPT等）交互时，数据分散存储：

```
现状：数据分散 ❌
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Claude    │  │   ChatGPT   │  │   其他AI    │
│ 你的记忆A   │  │ 你的记忆B   │  │ 你的记忆C   │
│ 你的偏好A   │  │ 你的偏好B   │  │ 你的偏好C   │
└─────────────┘  └─────────────┘  └─────────────┘
```

### UserBank解决方案

```
UserBank：统一智能体验记录桌面应用 ✅
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Claude    │     │   ChatGPT   │     │   其他AI    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │      MCP协议      │      MCP协议      │
       │      标准接口     │      标准接口     │
       └───────────────────┼───────────────────┘
                          │
                  ┌───────▼────────┐
                  │   UserBank     │
                  │  桌面应用      │
                  │ ┌─────────────┐ │
                  │ │ 统一的记忆  │ │
                  │ │ 完整的偏好  │ │
                  │ │ 所有观点    │ │
                  │ │ 目标计划    │ │
                  │ │ 方法论等    │ │
                  │ └─────────────┘ │
                  └────────────────┘
```

## ✨ 核心功能

### 🖥️ 现代化桌面体验
- **Tauri 2.0驱动**：轻量级、高性能的跨平台桌面应用
- **React + TypeScript**：现代化的用户界面，响应式设计
- **原生性能**：接近原生应用的性能和体验

### 🔐 真正的数据主权
- **本地存储**：你的数据存储在你控制的地方，不是平台的"寄存品"
- **完整导出**：一键导出所有数据，包含元数据
- **MCP集成**：内置UserBank Core，提供标准化的MCP接口

### 🗃️ 9种数据类型管理
- **👤 个人档案**: 基本信息和身份档案
- **🧠 记忆管理**: AI交互记忆，支持6种类型分类
- **💭 观点记录**: 个人观点和立场记录
- **💡 深度洞察**: 洞察和感悟
- **🎯 目标管理**: 支持长短期规划
- **❤️ 个人偏好**: 偏好设置和管理
- **🛠️ 方法论**: 个人方法论和最佳实践
- **🔍 关注焦点**: 当前关注点和优先级管理
- **🔮 预测记录**: 预测记录和验证追踪

### 🎨 优雅的用户界面
- **现代化设计**：基于Radix UI和Tailwind CSS的精美界面
- **深色/浅色主题**：支持主题切换
- **响应式布局**：适配不同屏幕尺寸
- **直观操作**：简洁易用的交互设计

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Rust 1.70+
- 操作系统：Windows 10+、macOS 10.15+、Linux

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/MixLabPro/userbank.git
cd userbank
```

2. **安装依赖**
```bash
# 安装前端依赖
npm install

# 安装Tauri CLI（如果未安装）
npm install -g @tauri-apps/cli@next
```

3. **开发模式运行**
```bash
# 启动开发服务器
npm run tauri dev
```

4. **构建应用**
```bash
# 构建生产版本
npm run tauri build
```

### 首次使用

1. 启动应用后，首先设置你的个人档案
2. 开始记录你的记忆、观点和目标
3. 配置AI应用连接到UserBank的MCP服务

## 📊 数据模型

### 👤 个人档案
- 姓名、性别、性格描述
- 个人简介和头像
- 隐私级别控制

### 🧠 记忆管理
- **6种记忆类型**：经历、事件、学习、互动、成就、错误
- **重要程度评级**：1-10级重要性标记
- **关联信息**：相关人员、地点、时间
- **标签系统**：关键词标签便于检索

### 🎯 目标管理
- **4种目标类型**：长期、短期、计划、待办
- **状态追踪**：规划中、进行中、已完成、已放弃
- **截止日期**：时间管理和提醒

## 🛠️ 使用指南

### 基本操作

#### 1. 添加记忆
- 点击"新增记忆"按钮
- 选择记忆类型和重要程度
- 添加相关标签和描述
- 保存记录

#### 2. 管理目标
- 在目标页面创建新目标
- 设置目标类型和截止日期
- 跟踪目标进度
- 标记完成状态

#### 3. 记录观点
- 在观点页面记录个人立场
- 关联相关事件和人员
- 添加参考链接

#### 4. 数据搜索
- 使用全局搜索功能
- 按类型、标签、时间筛选
- 快速定位相关信息

## 🏗️ 开发指南

### 项目结构
```
userbank/
├── src/                    # React前端源码
│   ├── components/         # UI组件
│   ├── pages/             # 页面组件
│   ├── hooks/             # React Hooks
│   ├── services/          # 服务层
│   ├── types/             # TypeScript类型定义
│   └── utils/             # 工具函数
├── src-tauri/             # Tauri后端
│   ├── src/               # Rust源码
│   ├── icons/             # 应用图标
│   ├── binaries/          # 外部二进制文件
│   └── tauri.conf.json    # Tauri配置
├── public/                # 静态资源
└── package.json           # 项目配置
```

### 技术栈

**前端**
- React 18 + TypeScript
- Tailwind CSS + Radix UI
- React Router + React Query
- Vite构建工具

**后端**
- Tauri 2.0 (Rust)
- 集成UserBank Core
- SQLite数据库

### 开发命令

```bash
# 开发模式
npm run dev              # 启动前端开发服务器
npm run tauri dev        # 启动Tauri开发模式

# 构建
npm run build            # 构建前端
npm run tauri build      # 构建桌面应用

# 代码检查
npm run lint             # ESLint检查
```

## 🤝 贡献指南

我们欢迎各种形式的贡献：

1. **功能开发**: 添加新功能或改进现有功能
2. **UI/UX改进**: 优化用户界面和体验
3. **Bug修复**: 报告和修复问题
4. **文档完善**: 改进文档和使用指南
5. **测试用例**: 添加测试提高代码质量

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/MixLabPro/userbank.git
cd userbank

# 安装依赖
npm install

# 启动开发环境
npm run tauri dev
```

## 📚 相关资源

- **Tauri官方文档**: [https://tauri.app](https://tauri.app)
- **React文档**: [https://reactjs.org](https://reactjs.org)
- **MCP协议**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Radix UI**: [https://radix-ui.com](https://radix-ui.com)

## 📜 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

<div align="center">
  
**让AI真正了解你，从拥有自己的数据开始**

*UserBank - 你的个人数据银行桌面应用*

[GitHub](https://github.com/MixLabPro/userbank) • [Issues](https://github.com/MixLabPro/userbank/issues) • [Discussions](https://github.com/MixLabPro/userbank/discussions)

</div>