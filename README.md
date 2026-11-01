# Feishu Quiet Theme

飞书原生云文档与多维表格的本地主题备份。保留飞书的页面和编辑控件，通过 CSS 与本地 Canvas 字体适配改善显示。没有文档模型写入、数据采集或网络请求。

| 主题 | 当前版本 | 目录 |
| --- | --- | --- |
| Docs：正文、TOC、顶部导航、画板字体 | 1.4.0 | [docs](docs/) |
| Base：网格、记录详情、看板、Timeline / 甘特图 | 0.2.0 | [base](base/) |

## 安装

可以使用 Custom Style Script 扩展。两套主题分别建立规则，避免更新时相互覆盖：

1. URL：`https://your-tenant.larkoffice.com/`，把 `your-tenant` 替换为你的飞书租户子域名。
2. DOMAIN、TOP 开启，IFRAME 关闭。
3. Docs：STYLE 放入 `docs/theme.css`，SCRIPT 放入 `docs/board-font.js`。
4. Base：STYLE 放入 `base/theme.css`，SCRIPT 放入 `base/grid-font.js`。
5. 保存后刷新飞书页面。

也可在支持 MV3 的 Chromium 浏览器中，通过“加载已解压的扩展程序”先将对应 `manifest.json` 中的 `your-tenant` 替换为你的实际租户子域名，再分别选择 `docs/` 或 `base/`。不要同时用两种安装方式加载同一套主题。Canvas 脚本需要在页面 MAIN world 执行。

正文与导航字体为 **Cascadia Code**，中文后备为 **PingFang SC**；代码字体为 **Source Code Pro**。字体文件未包含在此仓库，需在系统中单独安装；缺失时会使用后备字体。

## 停用与恢复

停用对应 Custom Style Script 规则或主题扩展，然后刷新页面。此操作只回退本机显示。旧版主题源码位于 [archive](archive/)；归档版本不一定具有当前功能或兼容性。

## 验证

不需要安装依赖，使用 Node.js：

```sh
node docs/board-font.test.cjs
node base/grid-font.test.cjs
```

测试覆盖字体替换范围、emoji 后备字体、图标排除、整段宽度与 maxWidth 换算、绘制异常后的状态恢复及撤销。

## 备份范围与限制

备份日期：2026-11-01。仅包含主题源码、测试、扩展清单与可移植说明。没有上传实际文档、表格记录、页面截图、第三方飞书脚本、字体文件或浏览器个人配置。

源码依赖飞书现有 DOM 类名和 Canvas 渲染方式。升级后可能需要维护。字体替换保留原生文本测量和整段宽度，但逐字符字形位置可能不同；不能据此保证所有编辑光标、组件与浏览器完全一致。深色、移动端、嵌入式 Base、仪表盘和导出尚未完整验证。

[版本记录](CHANGELOG.md) · [文件校验清单](BACKUP.json)


公开版本使用示例租户域名，不包含个人浏览器 profile 信息；提交作者使用 GitHub noreply 邮箱。
