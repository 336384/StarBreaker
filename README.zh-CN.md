# StarBreaker

> [English](README.md) · [简体中文](README.zh-CN.md)

[下载最新版本](https://github.com/diogotr7/StarBreaker/releases/latest)

用于读取和提取 Star Citizen 游戏文件的工具集。可处理 P4k 归档（Star Citizen 的资源包格式）、DataCore 数据库、CryEngine 资源、Wwise 音频以及角色文件。

[`master`](../../tree/master) 分支上还保留有一个旧版 C# 实现。

## Crate（Rust 包）

| Crate（Rust 包）       | 说明 |
| ---------------------- | ---- |
| `starbreaker-p4k`      | 从 `Data.p4k` 归档中读取和提取文件 |
| `starbreaker-datacore` | 解析 DataCore 二进制数据库（`.dcb`），查询记录，导出为 JSON/XML |
| `starbreaker-cryxml`   | 解码 CryEngine 二进制 XML |
| `starbreaker-chunks`   | 解析 CryEngine chunk 文件（`.cgf`、`.cga`、`.skin`、`.chr`） |
| `starbreaker-3d`       | 组装实体、角色与内部场景；导出为 GLB 或分解式 `.blend` 包 |
| `starbreaker-blend`    | 写出 Blender `.blend` 库文件（网格、空物体、灯光、层级） |
| `starbreaker-dds`      | 读取 DDS 纹理并解码块压缩格式 |
| `starbreaker-chf`      | 读写角色头部文件（`.chf`）—— [starchar](https://github.com/diogotr7/starchar) 背后的格式 |
| `starbreaker-dna`      | 解析面部绑定 DNA（`.dna`）文件 |
| `starbreaker-gfx`      | 检查 GFx/SWF UI 资源 |
| `starbreaker-ui`       | 从 SWF 中提取 UI 原子，并将飞船屏幕画布合成为图像 |
| `starbreaker-wwise`    | 解析 Wwise 音效库（`.bnk`）文件并解析音频事件链 |
| `starbreaker-wem`      | 将 Wwise 音频（`.wem`）解码为 Ogg Vorbis |
| `starbreaker-common`   | 共享类型、二进制读取器、游戏安装目录发现 |

## CLI

```
starbreaker <command> [options]
```

命令：`p4k`、`dcb`、`entity`、`skin`、`socpak`、`cryxml`、`dds`、`glb`、`chf`、`armour`、`wwise`、`nmc`、`ui`、`animation`、`riglogic`。

运行 `starbreaker <command> --help` 查看详情。

<details>
<summary><b>P4k 提取</b> —— 从游戏归档中提取并转换文件</summary>

### P4k 提取

```sh
# List files matching a pattern
starbreaker p4k list --filter '**/*.mtl'

# Extract everything under a ship's directory
starbreaker p4k extract -o ./out --filter '**/AEGS/Gladius/**'
```

#### 过滤

P4k 内的路径形如 `Data/Objects/Spaceships/Ships/AEGS/Gladius/texture.dds`。

| 模式                    | 匹配 |
| ----------------------- | ---- |
| `**/*.xml`              | 任意位置的所有 `.xml` 文件 |
| `**/AEGS/Gladius/**`    | 任意 `Gladius/` 目录下的所有内容（不限层级） |
| `**/AEGS/Gladius/*.mtl` | 仅 `Gladius/` 下直接包含的 `.mtl` 文件 |
| `**/ships/**`           | 任意 `ships/` 目录下的所有内容 |
| `**/*aurora*`           | 名称中包含 `aurora` 的任意文件 |

`*` 在单个目录内匹配。`**` 可跨任意数量的目录匹配。

#### 提取时转换文件

`--convert` 标志会在提取文件的同时转换它们。该标志可重复指定——一次即可组合多个转换器：

```sh
# Decode binary XML files (.mtl, .chrparams, .xml, etc.) to readable XML
starbreaker p4k extract -o ./out --filter '**/*.mtl' --convert cryxml

# Convert DDS textures to PNG (merges split mip siblings automatically)
starbreaker p4k extract -o ./out --filter '**/*.dds' --convert dds-png

# Get merged DDS files (for modding tools that need DDS format)
starbreaker p4k extract -o ./out --filter '**/*.dds' --convert dds-merge

# Everything at once — binary XML decoded, textures as both PNG and merged DDS
starbreaker p4k extract -o ./out --filter '**/AEGS/Gladius/**' --convert all
```

| 转换器      | 作用 |
| ----------- | ---- |
| `cryxml`    | CryXmlB 二进制转可读 XML |
| `dds-png`   | DDS 纹理转 PNG（自动合并 P4k 中拆分的 `.dds.1`/`.dds.2` mip） |
| `dds-merge` | DDS 拆分 mip 转单个合并后的 DDS 文件 |
| `all`       | 以上全部 |

示例输出：

```
Extracting 329 files...
[CONVERT] CryXML→XML, DDS→PNG, DDS→merged DDS
Pre-creating directories... 31 directories created.
[START] all cores threads
[DONE] Extracted 329/329 files in 0.6s
[DONE] Total: 91.3 MB | Avg throughput: 151.3 MB/s
[DONE] 196 files converted
```

</details>

<details>
<summary><b>实体导出</b> —— 将飞船和载具导出为 GLB</summary>

### 实体导出

将飞船或载具导出为 GLB 文件，并完成完整的 loadout 装配——几何体、骨架、材质和纹理。
名称是实体类名的子串，不区分大小写；最短匹配优先。
默认值为 `--lod 1`、`--mip 2`（纹理为 1/4 分辨率）以及 `--materials textures`：

```sh
# Export a Gladius
starbreaker entity export Gladius gladius.glb

# Lightweight export — flat material colours, no textures, lower LOD
starbreaker entity export Gladius gladius.glb --materials colors --lod 2

# Decomposed package (Packages/<name>/scene.json + shared Data/) for the Blender addon
starbreaker entity export Gladius ./export --kind decomposed

# Just print the loadout tree
starbreaker entity loadout Gladius

# Export an armour piece as worn (its female mesh, skinned to its bones)
starbreaker entity export cds_armor_heavy_arms_01_01_01 arms.glb --geometry-tag Female
```

第一条命令的输出：

```
Found 67 candidates, using shortest match: EntityClassDefinition.AEGS_Gladius

Loadout tree for EntityClassDefinition.AEGS_Gladius:
  G hardpoint_seat_access -> AEGS_Gladius_SCItem_SeatAccess
  G hardpoint_seat_pilot -> AEGS_Gladius_SCItem_Seat_Pilot
  G hardpoint_power_plant -> POWR_AEGS_S01_Regulus_SCItem
  G Hardpoint_cooler_left -> COOL_AEGS_S01_Bracer_SCItem
  G hardpoint_shield_generator_left -> SHLD_GODI_S01_AllStop_SCItem
  ...

Bundled export size: 37498672 bytes
Written to gladius.glb
```

</details>

<details>
<summary><b>角色导出</b> —— 将 <code>.chf</code> 角色导出为带骨骼的 GLB 或 <code>.blend</code> 包</summary>

### 角色导出

`chf to-glb` 导出整个角色：由 DNA 塑形的头部，连同其
眼睛、牙齿和 CHF 头部部件（头发、眉毛、睫毛、胡须），以及身体，
全部绑定在玩家 actor 骨架上。`chf to-package` 将同一套绑定写出为
分解式 `.blend` 包，并带上 CHF 的皮肤材质定制。
两者都能让角色换上一套 loadout，并烘焙面部和/或身体动画片段。

```sh
starbreaker chf to-glb masculinedefault.chf

# Dressed in a game loadout, playing a face idle
starbreaker chf to-glb masculinedefault.chf marine.glb \
  --loadout Data/Scripts/Loadouts/Character/Human/Armor/NPC/UEE/marine_Armor_Heavy.xml \
  --face-anim Data/Animations/Characters/Human/heads/male/ai/idlesets/happy/face/ai_civ_happy_idle_02_face.caf

# Decomposed .blend package for the Blender addon
starbreaker chf to-package masculinedefault.chf ./export
```

</details>

<details>
<summary><b>护甲导出</b> —— 护甲与服装，单件或整套穿戴</summary>

### 护甲导出

单件护甲按穿戴状态导出（其对应性别的网格，蒙皮到自身骨骼上）：

```sh
starbreaker entity export cds_armor_heavy_arms_01_01_01 arms.glb --geometry-tag Female
```

一套护甲由一个角色在同一骨架上穿戴——可以是 `--gender` 指定的游戏
默认角色，也可以是 `--chf` 指定的任意 `.chf`——被覆盖的身体
部位会略去（若只要护甲，在 Blender 中删除头部和身体即可）。
各部件使用精确的实体类名；每件都会装到接受它的端口上，
与游戏内一致：

```sh
starbreaker armour export marine.glb --gender male \
  --wear cds_undersuit_01_01_01 --wear cds_armor_heavy_core_01_01_01 \
  --wear cds_armor_heavy_arms_01_01_01 --wear cds_armor_heavy_legs_01_01_01

# Decomposed .blend package from a game loadout, playing a body idle
starbreaker armour export marine_pkg --kind package \
  --loadout Data/Scripts/Loadouts/Character/Human/Armor/NPC/UEE/marine_Armor_Heavy.xml \
  --body-anim Data/Animations/Characters/Human/male_v7/character_select_screen.dba \
  --body-anim-clip char_customizer_stand_idle_01
```

</details>

<details>
<summary><b>DataCore 查询</b> —— 查询并导出游戏数据库</summary>

### DataCore 查询

DataCore 是 Star Citizen 的二进制数据库，包含全部游戏定义——飞船、物品、武器、任务等。

#### 查询特定属性

使用 `dcb query`，借助点分隔的属性路径从记录中提取值：

```sh
# Get geometry paths for all Gladius entities
starbreaker dcb query \
  'EntityClassDefinition.Components[SGeometryResourceParams].Geometry.Geometry.Geometry.path' \
  --filter '*Gladius'
```

```
13 record(s) matched.
EntityClassDefinition.AEGS_Gladius    Objects\Spaceships\Ships\AEGS\Gladius\AEGS_Gladius.cga
EntityClassDefinition.Weapon_Rack_AEGS_Gladius    Objects/Spaceships/Ships/AEGS/Gladius/AEGS_Gladius_Gunrack.cga
EntityClassDefinition.Flair_Model_Aegis_Gladius   Objects/brush/planet/uee/flair_objects/model_spaceships/aegs_gladius/flair_aegs_gladius.cgf
...
```

```sh
# Get item types for Gladius components
starbreaker dcb query \
  'EntityClassDefinition.Components[SAttachableComponentParams].AttachDef.Type' \
  --filter '*AEGS_Gladius'
```

```
EntityClassDefinition.AEGS_Gladius    NOITEM_Vehicle
EntityClassDefinition.INTK_AEGS_Gladius   FuelIntake
EntityClassDefinition.HTNK_AEGS_Gladius   FuelTank
EntityClassDefinition.ARMR_AEGS_Gladius   Armor
...
```

```sh
# Dump full records as JSON (omit property path)
starbreaker dcb query EntityClassDefinition --filter '*AEGS_Gladius'
```

#### 批量导出

```sh
# Export all 57k+ records to JSON
starbreaker dcb extract --format json -o ./dcb_out

# Export only Gladius-related records
starbreaker dcb extract --format json -o ./dcb_out --filter '**/*gladius*'

# Use a .dcb file directly instead of extracting from P4k
starbreaker dcb extract --dcb Game2.dcb --format json -o ./dcb_out

# unp4k/unforge-compatible output, plus unforge's combined Game2.xml
# (every record, ~3 GB) for tools that read it, e.g. ScDataDumper
starbreaker dcb extract --format unp4k --combined -o ./import/Data
```

</details>

<details>
<summary><b>DDS 纹理</b> —— 检查、转换与合并纹理</summary>

### DDS 纹理

`dds info` 与 `dds decode` 可以直接从 P4k 归档读取。其余命令作用于已提取的文件。

```sh
# Show texture metadata (from P4k — no extraction needed)
starbreaker dds info Objects/Spaceships/Ships/AEGS/Gladius/textures/cockpit_details_diff.dds
```

```
Format:     BC1Unorm
Dimensions: 2048 x 2048
Cubemap:    false
Mip levels: 10 present (header declares 10)

Mip         Width     Height         Size
------------------------------------------
0            2048       2048      2.0 MiB
1            1024       1024    512.0 KiB
2             512        512    128.0 KiB
...
```

```sh
# Decode a DDS from P4k directly to PNG
starbreaker dds decode Objects/path/to/texture.dds texture.png

# Convert an extracted DDS to PNG
starbreaker dds to-png texture.dds

# Batch convert a directory of extracted DDS files
starbreaker dds to-png-all -i ./extracted/textures -o ./png_out

# Merge split DDS mips (.dds + .dds.1, .dds.2, ...) into a single file
starbreaker dds merge texture.dds
```

</details>

<details>
<summary><b>CryXML 转换</b> —— 将二进制 XML 解码为可读文本</summary>

### CryXML 转换

将 CryEngine 二进制 XML 文件转换为可读 XML：

```sh
# Single file
starbreaker cryxml convert material.mtl

# Batch convert a directory
starbreaker cryxml convert-all -i ./extracted -o ./xml_out --filter '*.mtl'
```

</details>

<details>
<summary><b>Wwise 音频</b> —— 提取并解码游戏音频</summary>

### Wwise 音频

从 Wwise 音效库中提取并解码音频：

```sh
# List events in a soundbank
starbreaker wwise events ship_sounds.bnk

# Extract a soundbank's WEM files, decoded to Ogg
starbreaker wwise extract ship_sounds.bnk -o ./audio --decode
```

</details>

## 应用

`app/` 中是一个 Tauri 桌面应用：前端为 React + TypeScript，后端为 Rust。它提供图形界面，用于浏览 P4k 内容与 DataCore 记录、导出飞船和 socpak 内部场景、构建并导出角色，以及播放音频。

## 构建

需要 Rust（edition 2024）。构建 Tauri 应用还需要 Node.js。

```sh
# CLI only
cargo build --release -p starbreaker

# Tauri app
cd app && npm install && npm run tauri build
```

<details>
<summary><b>游戏文件发现</b></summary>

CLI 和库会扫描已知的渠道根目录，并挑选最新的 `Data.p4k`，以此自动检测你的 Star Citizen 安装位置。

支持的默认根目录：

- Windows：`C:\Program Files\Roberts Space Industries\StarCitizen\`
- Linux 上通过 LUG Wine 或 Proton 安装：`~/Games/star-citizen/drive_c/Program Files/Roberts Space Industries/StarCitizen/`

如需覆盖上述默认值，请将 `.cargo/config.toml.example` 复制为 `.cargo/config.toml` 并设置你的路径：

```toml
[env]
SC_DATA_P4K = "D:\\Games\\StarCitizen\\LIVE\\Data.p4k"
```

也可以直接设置 `SC_DATA_P4K` / `SC_EXE` 环境变量。

</details>

## 致谢

没有以下项目，StarBreaker 就不可能存在

- **[unp4k](https://github.com/dolkensp/unp4k)** —— P4k 文件支持、DataCore 解码、CryXML
- **[scdatatools](https://gitlab.com/scmodding/frameworks/scdatatools)** —— Socpak 解码，以及如何将实体的各个部分组装到一起
- **[Blender-Tools](https://github.com/scorg-tools/Blender-Tools)** —— 材质处理，以及实体部件之间更多的组装
- **[CryEngine-Converter](https://github.com/Markemp/Cryengine-Converter)** —— 几何格式、CryChunk、#ivo 支持
