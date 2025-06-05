# UserBank

<div align="center">
  
**Personal Data Bank Desktop Application**

[![Tauri](https://img.shields.io/badge/Tauri-2.0+-blue.svg)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18+-green.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

*From "Data Hosted on Various Platforms" to "Owning Your Own Data Bank"*

[Quick Start](#-quick-start) • [Core Features](#-core-features) • [User Guide](#-user-guide) • [Development Guide](#-development-guide)

</div>

---

## 🎯 What is UserBank?

UserBank stands for **Unified Smart Experience Records Bank**, a cross-platform desktop application built on **Tauri 2.0**. UserBank enables you to uniformly manage all intelligent experience records generated from AI interactions, securely storing and managing your personal data through a modern desktop interface.

### 🔗 UserBank Core Integration

The UserBank desktop application has **UserBank Core** built-in as its data engine, providing complete MCP (Model Context Protocol) support:

- **MCP Server**: Built-in standardized MCP server supporting both stdio and SSE communication modes
- **Standardized Interface**: Provides unified data access interface for all supported AI applications through MCP protocol
- **Real-time Sync**: Data changes in the desktop application sync in real-time to MCP services, ensuring AI applications get the latest information
- **Seamless Integration**: One-click MCP service startup with no additional configuration needed to connect with Claude, ChatGPT, and other AI applications

This means you can manage data in the UserBank desktop application while allowing all AI assistants to access this data through the MCP protocol, achieving true cross-platform data unification.

### Problems Solved

When you interact with different AI assistants (Claude, ChatGPT, etc.), data is scattered across platforms:

```
Current State: Scattered Data ❌
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Claude    │  │   ChatGPT   │  │  Other AI   │
│ Your Memory A│  │ Your Memory B│  │ Your Memory C│
│ Your Pref A  │  │ Your Pref B  │  │ Your Pref C  │
└─────────────┘  └─────────────┘  └─────────────┘
```

### UserBank Solution

```
UserBank: Unified Smart Experience Records Desktop App ✅
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Claude    │     │   ChatGPT   │     │  Other AI   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │   MCP Protocol    │   MCP Protocol    │
       │ Standard Interface│ Standard Interface│
       └───────────────────┼───────────────────┘
                          │
                  ┌───────▼────────┐
                  │   UserBank     │
                  │ Desktop App    │
                  │ ┌─────────────┐ │
                  │ │ Unified     │ │
                  │ │ Memories    │ │
                  │ │ Complete    │ │
                  │ │ Preferences │ │
                  │ │ All Views   │ │
                  │ │ Goals Plans │ │
                  │ │ Methods etc │ │
                  │ └─────────────┘ │
                  └────────────────┘
```

## ✨ Core Features

### 🖥️ Modern Desktop Experience
- **Tauri 2.0 Powered**: Lightweight, high-performance cross-platform desktop application
- **React + TypeScript**: Modern user interface with responsive design
- **Native Performance**: Near-native application performance and experience

### 🔐 True Data Sovereignty
- **Local Storage**: Your data is stored where you control it, not as "deposits" on platforms
- **Complete Export**: One-click export of all data including metadata
- **MCP Integration**: Built-in UserBank Core providing standardized MCP interface

### 🗃️ 9 Data Type Management
- **👤 Personal Profile**: Basic information and identity profile
- **🧠 Memory Management**: AI interaction memories with 6 type classifications
- **💭 Viewpoint Records**: Personal viewpoints and stance records
- **💡 Deep Insights**: Insights and realizations
- **🎯 Goal Management**: Support for long and short-term planning
- **❤️ Personal Preferences**: Preference settings and management
- **🛠️ Methodologies**: Personal methodologies and best practices
- **🔍 Focus Areas**: Current focus points and priority management
- **🔮 Prediction Records**: Prediction records and verification tracking

### 🎨 Elegant User Interface
- **Modern Design**: Beautiful interface based on Radix UI and Tailwind CSS
- **Dark/Light Themes**: Theme switching support
- **Responsive Layout**: Adapts to different screen sizes
- **Intuitive Operations**: Clean and easy-to-use interaction design

## 🚀 Quick Start

### Requirements

- Node.js 18+
- Rust 1.70+
- Operating System: Windows 10+, macOS 10.15+, Linux

### Installation Steps

1. **Clone Project**
```bash
git clone https://github.com/MixLabPro/userbank.git
cd userbank
```

2. **Install Dependencies**
```bash
# Install frontend dependencies
npm install

# Install Tauri CLI (if not installed)
npm install -g @tauri-apps/cli@next
```

3. **Run in Development Mode**
```bash
# Start development server
npm run tauri dev
```

4. **Build Application**
```bash
# Build production version
npm run tauri build
```

### First Use

1. After starting the application, first set up your personal profile
2. Begin recording your memories, viewpoints, and goals
3. Configure AI applications to connect to UserBank's MCP service

## 📊 Data Models

### 👤 Personal Profile
- Name, gender, personality description
- Personal bio and avatar
- Privacy level control

### 🧠 Memory Management
- **6 Memory Types**: Experience, Event, Learning, Interaction, Achievement, Mistake
- **Importance Rating**: 1-10 level importance marking
- **Associated Information**: Related people, places, time
- **Tag System**: Keyword tags for easy retrieval

### 🎯 Goal Management
- **4 Goal Types**: Long-term, Short-term, Plan, Todo
- **Status Tracking**: Planning, In Progress, Completed, Abandoned
- **Deadlines**: Time management and reminders

## 🛠️ User Guide

### Basic Operations

#### 1. Adding Memories
- Click "Add Memory" button
- Select memory type and importance level
- Add relevant tags and description
- Save record

#### 2. Managing Goals
- Create new goals in the Goals page
- Set goal type and deadline
- Track goal progress
- Mark completion status

#### 3. Recording Viewpoints
- Record personal stances in the Viewpoints page
- Associate with relevant events and people
- Add reference links

#### 4. Data Search
- Use global search functionality
- Filter by type, tags, time
- Quickly locate relevant information

## 🏗️ Development Guide

### Project Structure
```
userbank/
├── src/                    # React frontend source code
│   ├── components/         # UI components
│   ├── pages/             # Page components
│   ├── hooks/             # React Hooks
│   ├── services/          # Service layer
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── src-tauri/             # Tauri backend
│   ├── src/               # Rust source code
│   ├── icons/             # Application icons
│   ├── binaries/          # External binaries
│   └── tauri.conf.json    # Tauri configuration
├── public/                # Static assets
└── package.json           # Project configuration
```

### Tech Stack

**Frontend**
- React 18 + TypeScript
- Tailwind CSS + Radix UI
- React Router + React Query
- Vite build tool

**Backend**
- Tauri 2.0 (Rust)
- Integrated UserBank Core
- SQLite database

### Development Commands

```bash
# Development mode
npm run dev              # Start frontend development server
npm run tauri dev        # Start Tauri development mode

# Build
npm run build            # Build frontend
npm run tauri build      # Build desktop application

# Code checking
npm run lint             # ESLint check
```

## 🤝 Contributing Guide

We welcome all forms of contributions:

1. **Feature Development**: Add new features or improve existing ones
2. **UI/UX Improvements**: Optimize user interface and experience
3. **Bug Fixes**: Report and fix issues
4. **Documentation**: Improve documentation and user guides
5. **Test Cases**: Add tests to improve code quality

### Development Environment Setup

```bash
# Clone project
git clone https://github.com/MixLabPro/userbank.git
cd userbank

# Install dependencies
npm install

# Start development environment
npm run tauri dev
```

## 📚 Related Resources

- **Tauri Official Documentation**: [https://tauri.app](https://tauri.app)
- **React Documentation**: [https://reactjs.org](https://reactjs.org)
- **MCP Protocol**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Radix UI**: [https://radix-ui.com](https://radix-ui.com)

## 📜 License

MIT License - See [LICENSE](LICENSE) file for details

---

<div align="center">
  
**Let AI truly understand you, starting with owning your own data**

*UserBank - Your Personal Data Bank Desktop Application*

[GitHub](https://github.com/MixLabPro/userbank) • [Issues](https://github.com/MixLabPro/userbank/issues) • [Discussions](https://github.com/MixLabPro/userbank/discussions)

</div>