# Electron Spine Viewer

![File Import](./preview.gif)



[English](#english) | [中文](#中文)


---

## English

A Spine animation viewer built with Electron + React + TypeScript, supporting Spine 3.8 and 4.0+ versions.

### ✨ Features

- 🎬 **Multi-version Support**: Supports Spine 3.8 and 4.0+ animation files
- 🖥️ **Cross-platform**: Built on Electron, supports Windows, macOS, and Linux
- 🎨 **Modern UI**: Built with React + TypeScript + Tailwind CSS
- 📁 **Drag & Drop**: Support for dragging and dropping Spine files (.skel, .json, .atlas, .png)
- 🎭 **Animation Control**: Real-time skin and animation switching
- 🔄 **Live Preview**: WebGL rendering with smooth animation playback
- 📊 **State Management**: Redux Toolkit for application state management

### 🚀 Quick Start

#### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

#### Installation

```bash
npm install
```

#### Development

```bash
npm run dev
```

This will start the development server and open the Electron application window.

#### Build

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Built application files will be saved in the `out` directory.

### 📁 Project Structure

```
electron-spine-viewer/
├── src/
│   ├── main/                 # Electron main process
│   ├── renderer/             # Renderer process (React app)
│   │   └── src/
│   │       ├── components/   # React components
│   │       ├── Layout/       # Layout components
│   │       ├── lib/          # Third-party libraries and utilities
│   │       │   ├── spine3.8/ # Spine 3.8 related files
│   │       │   └── spine4.0/ # Spine 4.0 related files
│   │       ├── store/        # Redux store
│   │       └── types/        # TypeScript type definitions
│   └── preload/              # Preload scripts
├── resources/                # Application resources
├── build/                    # Build configuration
└── out/                      # Build output
```

### 🎮 Usage

#### Import Spine Files

1. Drag and drop Spine files into the application window, or use the file picker
2. Supported file formats:
   - `.skel` - Spine binary files
   - `.json` - Spine JSON files
   - `.atlas` - Texture atlas files
   - `.png` - Texture image files

#### Control Animation

- **Skin Switching**: Select different skins in the left panel
- **Animation Playback**: Choose animations to play
- **Version Detection**: The app automatically detects Spine file versions and switches to the appropriate renderer

### 🛠️ Tech Stack

#### Frontend
- **React 19** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Redux Toolkit** - State management
- **React Hook Form** - Form handling
- **Zod** - Data validation

#### Desktop Application
- **Electron** - Cross-platform desktop app framework
- **Electron Vite** - Build tool
- **Electron Builder** - Application packaging

#### Spine Integration
- **Spine WebGL 3.8** - Custom integration
- **Spine WebGL 4.0+** - Official npm package
- **WebGL** - Graphics rendering

### 🔧 Development

#### Code Quality

```bash
# Code formatting
npm run format

# Code linting
npm run lint

# Type checking
npm run typecheck
```

#### Available Scripts

- `npm run dev` - Start development mode
- `npm run build` - Build the application
- `npm run start` - Preview build results
- `npm run build:unpack` - Build unpacked version

### 📦 Build Configuration

The application uses `electron-builder` for packaging, with configuration in `electron-builder.yml`.

#### Build Options

- **Windows**: Generates `.exe` installer
- **macOS**: Generates `.dmg` installer
- **Linux**: Generates `.AppImage` and `.deb` packages

### 🤝 Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 🙏 Acknowledgments

- [Spine](https://esotericsoftware.com/) - 2D skeletal animation tool
- [Electron](https://www.electronjs.org/) - Cross-platform desktop app framework
- [React](https://reactjs.org/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

### 📞 Support

If you encounter issues or have suggestions, please:

1. Check the [Issues](../../issues) page
2. Create a new Issue describing the problem
3. Provide detailed error information and reproduction steps

---

## 中文

基于 Electron + React + TypeScript 构建的 Spine 动画查看器，支持 Spine 3.8 和 4.0+ 版本。

### ✨ 特性

- 🎬 **多版本支持**: 支持 Spine 3.8 和 4.0+ 版本的动画文件
- 🖥️ **跨平台**: 基于 Electron，支持 Windows、macOS 和 Linux
- 🎨 **现代化 UI**: 使用 React + TypeScript + Tailwind CSS 构建
- 📁 **文件拖拽**: 支持拖拽导入 Spine 文件（.skel、.json、.atlas、.png）
- 🎭 **动画控制**: 实时切换皮肤和动画
- 🔄 **实时预览**: WebGL 渲染，流畅的动画播放
- 📊 **状态管理**: 使用 Redux Toolkit 管理应用状态

### 🚀 快速开始

#### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

#### 安装依赖

```bash
npm install
```

#### 开发模式

```bash
npm run dev
```

这将启动开发服务器，同时打开 Electron 应用窗口。

#### 构建应用

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

构建后的应用文件将保存在 `out` 目录中。

### 📁 项目结构

```
electron-spine-viewer/
├── src/
│   ├── main/                 # Electron 主进程
│   ├── renderer/             # 渲染进程 (React 应用)
│   │   └── src/
│   │       ├── components/   # React 组件
│   │       ├── Layout/       # 布局组件
│   │       ├── lib/          # 第三方库和工具
│   │       │   ├── spine3.8/ # Spine 3.8 相关文件
│   │       │   └── spine4.0/ # Spine 4.0 相关文件
│   │       ├── store/        # Redux store
│   │       └── types/        # TypeScript 类型定义
│   └── preload/              # 预加载脚本
├── resources/                # 应用资源
├── build/                    # 构建配置
└── out/                      # 构建输出
```

### 🎮 使用说明

#### 导入 Spine 文件

1. 将 Spine 文件拖拽到应用窗口中，或使用文件选择器
2. 支持的文件格式：
   - `.skel` - Spine 二进制文件
   - `.json` - Spine JSON 文件
   - `.atlas` - 纹理图集文件
   - `.png` - 纹理图片文件

#### 控制动画

- **皮肤切换**: 在左侧面板中选择不同的皮肤
- **动画播放**: 选择要播放的动画
- **版本检测**: 应用会自动检测 Spine 文件版本并切换到对应的渲染器

### 🛠️ 技术栈

#### 前端
- **React 19** - 用户界面框架
- **TypeScript** - 类型安全的 JavaScript
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Redux Toolkit** - 状态管理
- **React Hook Form** - 表单处理
- **Zod** - 数据验证

#### 桌面应用
- **Electron** - 跨平台桌面应用框架
- **Electron Vite** - 构建工具
- **Electron Builder** - 应用打包

#### Spine 集成
- **Spine WebGL 3.8** - 自定义集成
- **Spine WebGL 4.0+** - 官方 npm 包
- **WebGL** - 图形渲染

### 🔧 开发

#### 代码质量

```bash
# 代码格式化
npm run format

# 代码检查
npm run lint

# 类型检查
npm run typecheck
```

#### 脚本说明

- `npm run dev` - 启动开发模式
- `npm run build` - 构建应用
- `npm run start` - 预览构建结果
- `npm run build:unpack` - 构建未打包版本

### 📦 构建配置

应用使用 `electron-builder` 进行打包，配置文件位于 `electron-builder.yml`.

#### 构建选项

- **Windows**: 生成 `.exe` 安装包
- **macOS**: 生成 `.dmg` 安装包
- **Linux**: 生成 `.AppImage` 和 `.deb` 包

### 🤝 贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

### 🙏 致谢

- [Spine](https://esotericsoftware.com/) - 2D 骨骼动画工具
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

### 📞 支持

如果你遇到问题或有建议，请：

1. 查看 [Issues](../../issues) 页面
2. 创建新的 Issue 描述问题
3. 提供详细的错误信息和复现步骤

---

**注意**: 本项目仅用于学习和研究目的。使用 Spine 运行时需要遵守 Esoteric Software 的许可协议。