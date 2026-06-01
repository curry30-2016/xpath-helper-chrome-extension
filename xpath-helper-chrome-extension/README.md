# XPath Helper Chrome Extension

一个功能强大的 Chrome 浏览器扩展，帮助开发者快速提取、编辑和测试网页元素的 XPath 表达式。

## 功能特性

- **Shift + 点击获取 XPath** - 按住 Shift 键点击页面元素，自动生成 XPath
- **实时高亮预览** - 匹配的元素在页面上高亮显示
- **相对/绝对路径切换** - 支持生成优化的相对路径和完整绝对路径
- **XPath 输入测试** - 手动输入 XPath 表达式，实时查看匹配结果
- **节点计数** - 显示匹配的节点数量
- **文本内容提取** - 一键提取所有匹配元素的文本内容
- **一键复制** - 快速复制 XPath 或提取的文本到剪贴板

## 安装方法

### 从源码安装（开发者模式）

1. 克隆或下载此仓库
   ```bash
   git clone https://github.com/YOUR_USERNAME/xpath-helper-chrome-extension.git
   ```

2. 打开 Chrome 浏览器，访问 `chrome://extensions`

3. 开启右上角的「开发者模式」

4. 点击「加载已解压的扩展程序」

5. 选择项目文件夹

## 使用方法

### 方法一：Shift + 点击

1. 点击工具栏上的扩展图标打开 Popup
2. 开启「启用选择」开关
3. 在页面上按住 **Shift** 键，点击任意元素
4. 自动生成并显示该元素的 XPath

### 方法二：手动输入

1. 点击工具栏上的扩展图标打开 Popup
2. 在输入框中输入 XPath 表达式
3. 按 Enter 键或等待自动匹配
4. 页面上会高亮显示匹配的元素

### 快捷键

- `Alt+Shift+X` - 打开扩展
- `Esc` - 退出选择模式

## 截图

<!-- 添加截图 -->
<!-- ![XPath Helper Screenshot](screenshots/screenshot1.png) -->

## 技术栈

- Chrome Extension Manifest V3
- 原生 JavaScript（无依赖）
- Chrome APIs: activeTab, scripting, storage

## 项目结构

```
xpath-helper-chrome-extension/
├── manifest.json           # 扩展配置
├── popup/
│   ├── popup.html         # 弹窗界面
│   ├── popup.css          # 弹窗样式
│   └── popup.js           # 弹窗逻辑
├── content/
│   ├── content.js         # 内容脚本
│   └── content.css        # 高亮样式
├── background/
│   └── service-worker.js  # 后台服务
├── icons/                 # 扩展图标
├── LICENSE
└── README.md
```

## 与其他扩展的区别

| 功能 | XPath Helper | SelectorsHub | ChroPath |
|------|--------------|--------------|----------|
| Shift+点击获取 | ✅ | ✅ | ✅ |
| 实时高亮 | ✅ | ✅ | ✅ |
| 相对/绝对切换 | ✅ | ✅ | ✅ |
| CSS Selector | ❌ | ✅ | ✅ |
| 轻量级 | ✅ | ❌ | ❌ |
| 无依赖 | ✅ | ❌ | ❌ |

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT License](LICENSE)

## 作者

如果觉得有用，请给个 Star ⭐
