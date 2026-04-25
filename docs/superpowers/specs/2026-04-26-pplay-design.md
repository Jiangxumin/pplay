# PPlay — 设计文档

**日期：** 2026-04-26  
**状态：** 已确认  

---

## 1. 背景与目标

在家庭局域网内，使用树莓派 4B 作为内网视频服务器，存储儿童英语启蒙动画片（Number Blocks、Journey to the West、Rocket Girl 等）。Android 平板/手机上运行名为 **PPlay** 的 React Native Expo APP，通过局域网访问服务器播放视频。

**核心目标：**
- 最简技术路线，易于维护和添加新视频
- 支持 Android 平板 + 手机
- 记住每部动画的观看进度

---

## 2. 系统架构总览

```
树莓派 4B (192.168.x.x:8080)
    └── python3 -m http.server 8080
         ├── manifest.json
         └── <series-id>/
              ├── cover.jpg
              └── ep01.mp4, ep02.mp4, ...

Android 设备
    └── PPlay (React Native Expo)
         ├── ServerContext  ← 管理 baseURL
         ├── AsyncStorage   ← 持久化 IP + 每部剧进度
         ├── HomeScreen     ← 动画片网格
         └── PlayerScreen   ← 视频播放 + 选集侧边栏
```

---

## 3. 服务器端

### 3.1 运行方式

```bash
cd /media/videos
python3 -m http.server 8080
```

无需安装额外依赖，开箱即用。

### 3.2 目录结构

```
/media/videos/
├── manifest.json
├── numberblocks-s1/
│   ├── cover.jpg
│   ├── ep01.mp4
│   └── ep02.mp4
├── numberblocks-s2/
│   ├── cover.jpg
│   └── ep01.mp4
└── journey-to-the-west/
    ├── cover.jpg
    └── ep01.mp4
```

### 3.3 manifest.json 格式

```json
{
  "series": [
    {
      "id": "numberblocks-s1",
      "title": "Number Blocks 第一季",
      "cover": "numberblocks-s1/cover.jpg",
      "episodes": [
        { "id": "ep01", "title": "第 01 集", "file": "numberblocks-s1/ep01.mp4" },
        { "id": "ep02", "title": "第 02 集", "file": "numberblocks-s1/ep02.mp4" }
      ]
    }
  ]
}
```

**添加新动画流程：**
1. 新建目录，放入 `cover.jpg` 和视频文件
2. 在 `manifest.json` 的 `series` 数组末尾追加新条目
3. 无需重启服务器，APP 下次拉取即可看到

---

## 4. APP 端

### 4.1 技术栈

| 依赖 | 用途 |
|---|---|
| React Native Expo (managed) | 跨平台框架 |
| `expo-video` | 视频播放（Expo SDK 51+）|
| `@react-navigation/native` + `@react-navigation/stack` | 页面导航 |
| `@react-native-async-storage/async-storage` | 本地持久化 |

### 4.2 目录结构

```
pplay/
├── app/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   └── PlayerScreen.tsx
│   ├── context/
│   │   └── ServerContext.tsx
│   ├── hooks/
│   │   ├── useSeriesList.ts
│   │   └── usePlaybackState.ts
│   ├── components/
│   │   ├── SeriesCard.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── EpisodeSidebar.tsx
│   │   └── SettingsModal.tsx
│   └── navigation/
│       └── RootNavigator.tsx
├── assets/
└── app.json
```

### 4.3 状态管理

**ServerContext**（`app/context/ServerContext.tsx`）
- 提供 `baseURL: string` 和 `setBaseURL: (url: string) => void`
- `baseURL` 格式为完整 URL 前缀，含协议：`http://192.168.1.100:8080`
- 用户在设置框输入裸地址（如 `192.168.1.100:8080`），保存时自动补全 `http://` 前缀
- 初始化时从 AsyncStorage 读取 `@server_ip`，每次更改时写回

**AsyncStorage 键名约定：**
- `@server_ip` — 服务器完整 URL 前缀（如 `http://192.168.1.100:8080`）
- `@last_episode_<series_id>` — 每部动画最后观看的集 ID（仅记集数，不记集内时间位置）

**自定义 Hooks：**
- `useSeriesList()` — 从 `${baseURL}/manifest.json` 拉取数据，返回 `{ series, loading, error, refetch }`
- `usePlaybackState(seriesId)` — 读写该剧进度，返回 `{ lastEpisodeId, saveProgress(episodeId) }`

---

## 5. 页面设计

### 5.1 HomeScreen（主页）

**布局：**
- `FlatList` 网格，列数根据屏幕宽度自适应：
  - 平板横屏（宽 > 900px）：4 列
  - 平板竖屏 / 手机横屏（宽 600–900px）：3 列
  - 手机竖屏（宽 < 600px）：2 列
- 每个卡片：封面图（4:3 比例） + 下方标题文字 + 进度提示（"看到第 X 集" / "未开始"）
- 右上角齿轮图标 → 弹出 `SettingsModal`

**行为：**
- 若未设置 IP，展示"请先设置服务器地址"引导提示，不发起网络请求
- 点击卡片 → 导航到 `PlayerScreen`，传入完整 series 对象
- `manifest.json` 返回空数组（`"series": []`）时，展示"暂无视频"空状态占位

### 5.2 PlayerScreen（播放页）

**布局（横屏）：**
- 视频区（`flex: 3`）+ 选集侧边栏（`flex: 1`），横向并排

**布局（竖屏）：**
- 视频区占据屏幕上半部分（固定 `aspectRatio: 16/9`）
- 选集侧边栏移至视频下方，纵向列表铺满剩余空间（上下堆叠）
- 通过 `useWindowDimensions` 检测屏幕宽高比，动态切换布局

**视频区：**
- `expo-video` VideoView 组件，`contentFit="contain"`
- 点击屏幕切换控件显隐（使用 `Animated` 渐显渐隐）
- 自定义控件覆盖层（底部）：
  - 播放/暂停按钮
  - 可拖拽进度条（`Slider` 或自实现 PanResponder）
  - 当前时间 / 总时长
  - 全屏切换按钮（`expo-video` 原生全屏 API）
- 左上角返回按钮

**选集侧边栏：**
- `FlatList` 纵向列表，每项显示集数标题
- 当前播放集高亮
- 点击切换集数，同时更新 AsyncStorage 进度

**SettingsModal 触发刷新：** 保存 IP 后关闭弹窗，`ServerContext` 的 `baseURL` 更新，`useSeriesList` 监听 `baseURL` 变化自动重新 fetch。

**进度保存时机：**
- 用户在侧边栏点击切换集数时立即保存当前集 ID
- 用户按返回键离开播放页时保存当前集 ID
- 保存内容：集 ID（不含集内时间位置），写入 `@last_episode_<series_id>`
- 下次进入该动画的 PlayerScreen 时，自动定位到上次集数（从第一帧开始播）

> 布局断点（900px / 600px）均为 React Native 逻辑像素（dp），非物理像素。

### 5.3 SettingsModal（设置弹窗）

- 从主页右上角齿轮图标触发
- Modal 内容：文本输入框（placeholder: `192.168.1.100:8080`）+ 保存按钮
- 保存时写入 AsyncStorage 并更新 ServerContext
- 关闭后主页自动重新拉取 manifest

---

## 6. 错误处理

| 场景 | 处理 |
|---|---|
| 未配置服务器 IP | 主页显示引导提示，不发起网络请求 |
| manifest.json 请求失败 | 显示"无法连接服务器"+ 重试按钮 |
| manifest.json 格式错误 | 捕获 JSON parse 异常，显示友好错误信息 |
| 视频加载/播放失败 | 播放区显示错误提示，不崩溃 |
| 手机竖屏使用播放页 | 侧边栏移至视频下方（上下堆叠布局）|

---

## 7. 不在范围内（YAGNI）

- 视频下载/离线缓存
- 用户账户/多用户
- 搜索功能
- 自动扫描局域网服务器（mDNS）
- 从 APP 内管理/上传视频
- 字幕支持
