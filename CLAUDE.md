# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指引。

## 项目简介

**PPlay** 是一个 React Native（Expo 托管工作流）视频播放器 App，面向安卓平板/手机。它播放托管在**局域网静态文件服务器**（树莓派上的 nginx）上的儿童动画片。本仓库中没有后端——App 是一个瘦客户端，通过拉取 manifest 清单并经 HTTP 流式播放视频。

面向用户的字符串为中文。UI 为深色、iOS 风格的主题（背景 `#000`，强调色 `#0a84ff`）。

## 命令

```bash
npm start                 # expo start（开发服务器；菜单中可选 a/i/w）
npm run android           # expo start --android
npm run ios               # expo start --ios
npm run web               # expo start --web（react-native-web）

npx jest                  # 运行全部测试（jest-expo preset；无对应 npm script）
npx jest path/to/file.test.tsx          # 运行单个测试文件
npx jest -t "renders back button"       # 运行名称匹配的测试
npx tsc --noEmit          # 类型检查（tsconfig 继承自 expo/tsconfig.base，strict）

./build.sh                # 本地 APK 构建 = `eas build -p android --preview --local`
```

项目未配置 linter。测试使用 `jest-expo` preset，`jest.setup.ts` 中 mock 了 `async-storage`、`react-native-safe-area-context` 和 `expo-video`。

## 架构

### App 引导与 Provider 栈
`index.ts` → `App.tsx`。Provider 按以下顺序嵌套，该顺序决定了哪些 hook 在何处可用：
`GestureHandlerRootView` → `SafeAreaProvider` → `ServerProvider` → `RootNavigator`。

### 导航
`RootNavigator.tsx` 定义了一个包含两个页面的栈。`RootStackParamList`（`{ Home: undefined; Player: { series: Series } }`）是路由参数的唯一真相来源，两个页面都导入它以获得类型化的 `StackScreenProps`。Header 被隐藏（`headerShown: false`）；各页面自行渲染自己的界面外壳。

### 服务器契约（关键且不直观）
App 只与一个静态服务器通信，其 URL 由用户在运行时输入（`baseURL`，如 `http://192.168.1.100:8080`）：
- `GET ${baseURL}/manifest.json` — 目录清单（schema 见下）
- 图片：`${baseURL}/${series.cover}`（相对路径，如 `series-id/cover.jpg`）
- 视频：`${baseURL}/${episode.file}`（相对路径，如 `series-id/ep01.mp4`）

服务器必须支持 **HTTP Range 请求**（用于拖动进度）和 CORS。由于流量是局域网明文 HTTP，`app.json` 通过 `expo-build-properties` 设置了 `android.usesCleartextTraffic: true`。完整的 nginx 配置和磁盘上的目录布局见 `docs/superpowers/specs/2026-04-26-pplay-design.md`。

`manifest.json` 的结构（对应 `app/types.ts`）：
```json
{ "series": [
  { "id": "series-id", "title": "…", "cover": "series-id/cover.jpg",
    "episodes": [ { "id": "ep01", "title": "第 01 集", "file": "series-id/ep01.mp4" } ] }
] }
```

### 状态管理（Context + hooks，无 Redux）
- **`ServerContext`** — 持有 `baseURL` 并将其持久化到 AsyncStorage 键 `@server_ip`。setter 会对输入做归一化：若无 scheme 则补 `http://`，去除末尾斜杠，持久化失败时回滚。组件会自动重新拉取，因为 `useSeriesList` 依赖 `baseURL`。
- **`useSeriesList()`** — 拉取 manifest；返回 `{ series, loading, error, refetch }`。`refetch` 会让一个内部版本计数器自增（即 effect 的依赖）。当 `baseURL` 为空时，把 `series` 置为 `[]` 并完全跳过请求。
- **`usePlaybackState(seriesId)`** — 将上次观看的剧集读写到 AsyncStorage 键 `@last_episode_<seriesId>`。**只持久化剧集 ID，从不持久化某集内部的播放进度**（刻意的 YAGNI 取舍）。使用一个在 render 期间同步的 ref，使 `saveProgress` 能看到当前值而不受过期闭包影响。

### 视频播放（`VideoPlayer.tsx`）
使用 `expo-video` 的 `useVideoPlayer` + `VideoView`，并设置 **`nativeControls={false}`**——控制条是自定义实现的（播放/暂停、进度条、全屏、时间）。通过 `player.addListener('playingChange' | 'timeUpdate' | 'statusChange')` 订阅播放器事件。控制条使用 `Animated` 透明度，在 3 秒后自动隐藏；任意点击都会重新显示。
- **切换剧集时重新挂载：** `PlayerScreen` 给 `VideoPlayer` 传 `key={videoUri}`，因此切集会创建一个全新的播放器实例（播放器在 hook 创建时就被绑定）。不要尝试原地“换源”。
- 已启用新架构（`app.json` 中 `newArchEnabled: true`）。

### 响应式布局
各页面使用 `useWindowDimensions`。`PlayerScreen` 在横屏（视频 `flex:3` + 侧边栏 `flex:1`，并排）与竖屏（视频在顶部按 `aspectRatio: 16/9`，侧边栏在下方）之间切换。`HomeScreen` 计算动态网格列数（`numColumns()`）：横屏 ≥3 列，竖屏 ≥2 列，目标约 200dp 卡片宽度。给 `FlatList` 传 `key={cols}`，以便列数变化时重新布局。

### 测试约定
组件/hook/页面测试与代码并列放在就近的 `__tests__/` 目录下。测试依赖 `testID` props（如 `back-button`、`play-pause-button`、`episode-<id>-active`）——请继续为可交互元素添加 `testID`。`@testing-library/jest-native` 的匹配器在 `jest.setup.ts` 中被全局扩展。

## 约定
- **提交信息：** 约定式提交（conventional commits），scope 可选 —— `feat(player): …`、`fix(HomeScreen): …`、`chore: …`、`docs: …`。
- **TypeScript：** `strict: true`。类型优先使用 `type` 导入（`import type {…}`）——代码库一贯如此。
- **状态回滚模式：** 两个会写持久化的 hook（`ServerContext.setBaseURL`、`usePlaybackState.saveProgress`）都是先乐观更新状态，在 AsyncStorage 失败时再回滚——新增持久化状态时请遵循此模式。
