# 华为 MatePad / HarmonyOS 适配（2026-08-09）

> 设备：华为 MatePad Pro，HarmonyOS 4.2.0，横屏使用为主。
> 本文记录当天修复的两个问题：现象、原因、解决方法、验证。

---

## 问题一：回前台后 manifest 不更新（新视频不出现）

### 现象
- 在服务器新增视频（更新 `manifest.json`）后，App 在 MatePad 上「切后台再回来」「锁屏再解锁」都**不刷新**，新视频不出现。
- 只有进入设置、把服务器地址改成另一个 IP 再保存，新视频才出现。
- 同一局域网下小米手机正常。

### 排查过程
1. 先怀疑 HarmonyOS 不触发 `AppState` 事件，于是在屏幕上加调试面板记录 `AppState` 事件。
2. 日志显示：`change → active`、`focus`、`foreground → refresh` 都正常触发，`refetch()` 确实被调用了 —— **事件层没问题，先前假设被证伪**。
3. 「换 IP 才生效」是关键线索：缓存是**按 URL 为键**的；同一 URL 的 refetch 命中缓存返回旧数据，换了 IP（URL 变了）才真正请求到新数据。

### 原因
HarmonyOS 的网络层对 GET 响应做了**按 URL 缓存**。`useSeriesList` 回前台刷新时请求的还是同一个 `${baseURL}/manifest.json`，命中缓存，拿到旧的 manifest。

### 解决
给 manifest 请求加防缓存时间戳，让每次请求 URL 都唯一：
```js
// app/hooks/useSeriesList.ts
fetch(`${baseURL}/manifest.json?t=${Date.now()}`)
```
- 时间戳使每次 URL 不同 → 击穿任何按 URL 的缓存层。
- nginx 对静态文件会忽略 `?t=` 查询参数，照常返回 `manifest.json`。
- 相比 `Cache-Control: no-cache` 请求头更可靠（RN 的 XHR/OkHttp 不一定遵守，系统级缓存更可能忽略头）。

### 验证
- 单测：新增「manifest URL 防缓存」回归用例，断言每次 fetch 的 URL 形如 `manifest.json?t=<数字>` 且两次不同。
- 真机：MatePad 上加视频后回前台，新视频正常出现。

### 相关
- 提交：`6b174cc`
- 文件：`app/hooks/useSeriesList.ts`
- 附带：`AppState` 同时监听 `change` 与 `focus`（部分 ROM 上 `change` 不可靠时的兜底），1.5s 节流去重；诊断用的屏幕调试面板已移除。

---

## 问题二：横屏虚拟键盘遮挡服务器地址输入框

### 现象
- MatePad 横屏，点「设置」→ 点服务器地址输入框，弹出的虚拟键盘**盖住了输入框**，看不到也无法确认输入。

### 原因
设置弹窗用 `justifyContent: 'center'` 垂直居中；横屏下键盘占据很大一块竖向空间，把居中的弹窗顶到了键盘下方。又因为开启了 `edgeToEdgeEnabled`，系统**不会自动**调整弹窗位置。

### 解决
把模态外层容器从 `View` 换成 `KeyboardAvoidingView`：
```jsx
// app/components/SettingsModal.tsx
<KeyboardAvoidingView style={styles.overlay} behavior="padding">
  <View style={styles.box}>...</View>
</KeyboardAvoidingView>
```
- `behavior="padding"` 在键盘弹出时给容器加底部内边距，配合居中布局，把弹窗重新居中到**键盘上方**。
- 对居中弹窗，`padding` 比 `height` 更可预测（`height` 会改容器高度、引起内容重排）。

### 验证
- 真机：MatePad 横屏点输入框，输入框被顶到键盘上方，可见、可输入。

### 相关
- 提交：`715fc53`
- 文件：`app/components/SettingsModal.tsx`

---

## 小结
两个问题都不是「代码逻辑错」，而是**设备/系统差异**：HarmonyOS 的 HTTP 缓存策略、平板横屏下键盘与 edge-to-edge 的交互。共同经验是——真机日志先于猜测，「换 IP 才生效」这类现象往往是指向缓存问题的指纹。
