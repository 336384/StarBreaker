# 桌面应用简体中文界面（zh-CN）

StarBreaker 桌面版（`app/`，Tauri + React）的用户界面已完成简体中文本地化，英文原文完整保留，
可在应用内随时切换，不影响任何导出/解析行为。

## 使用

- **切换语言**：启动页右上角、主界面侧边栏底部的语言切换器（English / 简体中文）。
- **记忆选择**：选择写入 `localStorage["starbreaker.language"]`，下次启动沿用。
- **首次启动**：没有保存过选择时，按系统语言自动判断（`zh-*` → 简体中文，其余 → English）。

## 实现

| 文件 | 作用 |
| --- | --- |
| `app/src/i18n/index.ts` | 运行时：`t()`、`tm()`、`useT()`、`useLanguage()`、`setLanguage()`、`LANGUAGES` |
| `app/src/i18n/zh-CN.json` | 中文词典，扁平映射「英文原文 → 中文译文」 |
| `app/src/components/language-switcher.tsx` | 语言切换器（启动页 / 侧边栏） |
| `app/tsconfig.json` | 打开 `resolveJsonModule`，让词典可以直接 `import` |

设计取向是 **gettext 风格：键就是英文原文**。这样：

- 调用处可读性最好 —— `t("Extract all matches…")`，不需要维护一套键名；
- 某个词条漏译时**自动回退英文**，不会出现空白或 `missing.key`；
- 后续上游新增英文文案时，界面仍然可用，只是那几句暂时是英文；
- 词典可以直接给非开发者编辑。

### 约定

- 占位符用单花括号：`t("{count} files", { count })` → `"{count} 个文件"`。
- 同一个英文词在不同语境需要不同译法时，加 `##context` 后缀：`t("Save##verb")`；
  查表时先精确匹配，再退化到 `##` 之前的部分。
- 组件里：`const t = useT();` **必须是组件函数体的第一条语句**。它内部走
  `useSyncExternalStore` 订阅语言变化，放在条件返回之后会违反 Hooks 规则并在切语言时崩溃。
- 非组件代码（store、命令封装）：直接 `import { t } from "../i18n"`，`t` 在调用时读取当前语言。
- **后端（Rust）通过事件传来的进度/阶段文本**用 `tm()`：查到就译，查不到原样显示
  （这些字符串由 Rust 侧产生，前端只做已知文案的映射）。

## 修改译文 / 新增词条

1. 改现有译文：直接编辑 `app/src/i18n/zh-CN.json` 的值，**不要改键**。
2. 新增界面文案：在组件里写 `t("English source")`，然后往词典加一条 `"English source": "中文"`。
3. 校验：
   ```sh
   cd app
   npm run build          # tsc 类型检查 + vite 打包
   ```

## 新增一门语言

1. 复制 `app/src/i18n/zh-CN.json` 为 `xx.json` 并翻译。
2. 在 `app/src/i18n/index.ts` 的 `dictionaries` 里注册，并在 `LANGUAGES` 里加一项（`label` 用该语言本身的写法）。
3. 切换器会自动多出一个按钮，无需改 UI 代码。

## 中文排版约定

- 中文与英文/数字之间加空格：`导出 GLB 模型`、`共 12 个文件`。
- 中文标点：`：，。；（）`，省略号 `…`，引号 `“ ”`。
- 按钮/标签 2–4 字、结尾不加句号；完整句子结尾加 `。`。
- 术语统一（摘录）：Entity → 实体，Loadout → 装配，Hardpoint → 挂点，Armor → 护甲，
  Texture → 贴图，Material → 材质，Mesh → 网格，Export → 导出，Extract → 提取。
  P4k、DataCore、Socpak、GLB、CHF、LOD、Mip、Wwise、DDS、CryXML、Blender 等专有名词不译。

## 规模

- 词典条目：304 条（`app/src/i18n/zh-CN.json`）。
- 接入 `t()` / `tm()` 的源文件：25 个（37 处 `useT()` 订阅点），覆盖 `app/src` 下全部 6 个视图与
  18 个组件，以及 `lib/commands.ts` 里的系统对话框标题。
- 少数文案来自**数据表经变量渲染**（如侧边栏模式列表、材质模式选项、Socpak 分类名），
  字典里同样有条目，只是静态扫描看不到调用点。

## 飞船 / 载具中文名

界面里的飞船名不是普通 UI 文案，而是来自 DataCore 记录，所以单独一张表：

`app/src/i18n/ship-names.zh-CN.json` —— 键是实体类名（小写，如 `aegs_gladius`），值是中文名
（`圣盾 短剑`）。内容来自游戏的 `vehicle_Name<CLASS>` / `vehicle_Name<CLASS>_short` 本地化键
（677 条：340 个全名 + 337 个短名），由 `app/src/lib/ship-names.ts` 消费：

- `shipName(className)`：只在界面语言为中文时返回中文名，其余返回 `undefined`；
- `entityLabel(className, displayName)`：中文名 → 游戏英文名 → 类名，逐级回退。

使用位置：3D/护甲导出列表（含中文搜索）、音频实体列表。查不到的新船自动显示英文名。
**导出产物的目录/包名仍用英文名**（`display_name`），避免中文路径进入 Blender 侧流水线。

表的来源文档里，少数行带有 `,P` 尾巴或 `L-` 截断（表格换行造成的），生成脚本已清理；
类名连字符不一致的情况（`KRIG_L-22_Alpha_Wolf` vs `krig_l22_alpha_wolf`）由查找逻辑做去连字符兜底。

## 覆盖范围

- **已覆盖**：桌面应用的全部界面文案 —— 启动/发现 P4k、P4k 浏览与搜索、DataCore 浏览与导出、
  3D / 护甲导出、Socpak 导出、角色构建、音频浏览与播放、Blender 插件安装/卸载、
  更新提示、右键菜单、系统文件对话框标题、空状态与错误提示。
- **未覆盖**（仍为英文）：
  - Rust 侧产生的运行时错误信息（`Err(...)` 直接显示在界面上，例如 P4k 打开失败的具体原因）；
  - CLI（`starbreaker --help` 及各子命令输出）；
  - Blender 插件自身的面板文案（`blender_addon/`）；
  - `website/` 文档站。

  这些位置需要各自的语言机制（Rust 侧需要 `rust-i18n` 之类，Python 侧需要
  `bpy.app.translations`），不在本次界面汉化的范围内。
