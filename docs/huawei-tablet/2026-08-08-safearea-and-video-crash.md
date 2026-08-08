# 平板 / 设备适配（2026-08-08）

> 设备：华为 MatePad Pro、小米手机（验证），横屏/竖屏。
> 本文记录当天修复的两个问题：现象、原因、解决方法、验证。

---

## 问题一：刘海/摄像头遮挡视频（竖屏顶部、横屏侧边与侧边栏）

### 现象
- **竖屏**：顶部摄像头/刘海压住视频画面顶部，返回按钮（←）也被盖住、点不到。
- **横屏**：摄像头落到左侧或右侧边缘，压住视频角落或侧边栏（选集列表）第一项。

### 原因
`app.json` 开启了 `edgeToEdgeEnabled: true`，App 内容会画到状态栏、导航栏与挖孔/刘海之下。而播放器界面：
- 最初只给控制条底部做了 `bottom` 安全区避让，`top/left/right` 完全没避让；
- 横竖屏根容器都是普通 `View`，从屏幕坐标 (0,0) 开始 → 视频/按钮钻进刘海；
- `SafeAreaProvider` 只提供 context，**不会自动**加内边距，必须组件自己消费 inset。

### 解决
把所有安全区避让**统一收口**到 `PlayerScreen` 的容器，`VideoPlayer` 的浮层退回常量偏移（避免与容器双重叠加）：
- **竖屏容器**：`paddingTop = insets.top`（刘海）、`paddingBottom = insets.bottom`（手势导航）。
- **横屏容器**：四边 `padding`（侧边挖孔 + 状态/手势条）。
- `VideoPlayer` 的返回按钮、控制条改回常量偏移（顶部避让已由容器负责）。

要点：
- 用容器的 `paddingTop` 而非给视频加 `marginTop`——后者会改变 16:9 容器比例，被 `contentFit="contain"` 补出明显黑边（pillarbox）。
- 横屏给视频加侧边 padding 看似加黑条，但 16:9 视频在更宽的横屏区本就有 pillarbox 黑边，融为一体、几乎无感。

### 验证
- 单测：`PlayerScreen.safearea.test.tsx` 覆盖竖屏（top/bottom）与横屏（四边）的 padding 断言。
- 真机：竖屏视频在刘海下方、返回按钮可点；横屏视频与侧边栏都避开挖孔与系统条。

### 相关
- 提交：`efd411c`（竖屏顶部避让）、`746a539`（横屏/侧边栏 + 收口到容器）
- 文件：`app/screens/PlayerScreen.tsx`、`app/components/VideoPlayer.tsx`

---

## 问题二：expo-video 切换/重挂时崩溃「Cannot use shared object that was already released」

### 现象
- 横竖屏切换、切集、或代码热刷新后，播放器崩溃：
  ```
  ERROR Cannot set prop 'player' on view 'class expo.modules.video.SurfaceVideoView'
  → Caused by: Cannot use shared object that was already released
  ```

### 原因
expo-video 的 `VideoPlayer` 是 JSI `SharedObject`。组件卸载时 `useReleasingSharedObject` 会调用原生 `release()`；默认渲染面 `SurfaceVideoView` 在**卸载/重挂**（横竖屏切换、`key={videoUri}` 换集、Fast Refresh）时，一次 `setProp('player')` 可能落在 `release()` 之后 → 使用了已释放的共享对象。
这是 expo-video 的已知问题（GitHub expo#29950、#30994 等），错误信息里点名的 `SurfaceVideoView` 就是默认渲染面。

### 解决
给 `<VideoView>` 设置 `surfaceType="textureView"`（替代默认的 `surfaceView`/`SurfaceVideoView`）：
```jsx
// app/components/VideoPlayer.tsx
<VideoView ref={videoRef} player={player} style={styles.video}
  contentFit="contain" nativeControls={false} surfaceType="textureView" />
```
- `TextureView` 在卸载时不以同样的方式持有 player 引用，避开了释放竞态。
- 代价是失去硬件 overlay 路径（性能略降），对局域网动画片无感。
- 这是 expo-video 官方文档针对该错误的推荐规避方式。

### 验证
- 真机：横竖屏切换、切集不再崩溃。

### 相关
- 提交：`746a539`
- 文件：`app/components/VideoPlayer.tsx`
- 参考：[expo-video 文档（surfaceType）](https://docs.expo.dev/versions/latest/sdk/video/)、[expo#29950](https://github.com/expo/expo/issues/29950)、[expo#30994](https://github.com/expo/expo/issues/30994)

---

## 小结
两个问题分别属于「布局避让」和「三方库原生缺陷」：
- 安全区避让的关键是**让屏幕容器统一拥有 inset、子组件用常量偏移**，避免双重叠加；并优先用容器的 padding 而非改视频自身尺寸。
- expo-video 的 `SurfaceVideoView` 在频繁重挂场景下不稳，`textureView` 是当前最稳妥的规避，升级 expo-video 后可重新评估。
