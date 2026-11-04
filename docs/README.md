# Docs 1.5.0

- 正文：Cascadia Code / PingFang SC，15px / 1.65；列表间距 3px / 1.55。
- 文档标题 28px，章节 24 / 21 / 18 / 16px。
- TOC 13px，与正文同款字体；当前项使用不占布局空间的 2×18px 背景标记。
- 顶部导航文字统一字体，保留原生图标。
- 行内与块代码：Source Code Pro，13px。
- 表格正文 14px，使用 Avenir Next / PingFang SC，长列表适度增加间距；使用飞书首行标记区分表头底色和字重。
- 画板：只对原生画板文字画布及已识别的画板缓存适配字体，保留字号、字重和整段占用宽度。

范围：该域名的 `/docx/`、`/wiki/` 页面；CSS 通过 `.garr-container-docx` 限定文档区域。Canvas 适配不修改 `measureText`，绘制后恢复状态，不改远端画板节点。

本机曾在 Chrome、Vivaldi、Floorp、Zen 保存此版本。Chrome、Floorp、Zen 已有实页验证；Vivaldi 仅完成设置核对。曾实测 TOC 定位、空白评论框打开、画板全屏与缩放；不同验证发生在不同迭代，并非逐项覆盖所有浏览器。Firefox 系浏览器可能显示飞书自身的兼容性提示。

完整安装与停用方式见仓库根目录。画板逐字符编辑光标尚未全面验证。
