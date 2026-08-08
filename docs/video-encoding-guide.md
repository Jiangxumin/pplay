# PPlay 服务器视频编码格式建议

> 局域网静态文件服务 + Android（expo-video / ExoPlayer）流式播放。
> 目标：清晰度够、播放不卡、目标设备零兼容风险、服务器不实时转码。

## 结论

| 维度 | 推荐 | 备选（省流量） |
|---|---|---|
| 容器 | **MP4**（`+faststart`） | — |
| 视频编码 | **H.264 (AVC) High Profile** | HEVC (H.265) |
| 像素格式 | **yuv420p**（8-bit） | — |
| 音频 | **AAC LC，立体声，128 kbps** | — |
| 分辨率 | 1080p 或 720p（跟随源片） | — |
| 码率（动画片） | **2–3 Mbps** | 1–1.5 Mbps（HEVC） |

**一句话**：`H.264 High + AAC，装进 faststart 的 MP4，码率 2 Mbps 左右`。

选 H.264 + MP4 的理由：所有 Android 设备都有 H.264 硬件解码器，ExoPlayer 对 MP4 的 seek 支持最成熟，服务器只需直接吐文件、不转码。

## 关键点：`+faststart`

MP4 的 `moov` atom 存着时长和**关键帧索引**。

- 默认放在文件**末尾** → 播放器要先拉尾部才能解析索引 → 首帧慢、拖动进度条卡顿。
- `+faststart` 把 `moov` 挪到**开头** → 秒开、seek 即时响应。

PPlay 靠 HTTP Range 请求做进度拖动，**`+faststart` 是 seek 流畅的前提，转码时必选**。

## 推荐参数

| 参数 | 推荐值 | 说明 |
|---|---|---|
| `-profile:v` | `high` | 主流设备硬解都支持 |
| `-level` | `4.1`（1080p）/ `3.1`（720p） | 留硬解余量 |
| `-crf` | `23`；动画片 `24~26` | 恒定质量，值越大体积越小。动画大片平涂色块，CRF 调高依然清晰 |
| `-preset` | `slow` | 慢一点换更小体积；**别在树莓派上转** |
| `-pix_fmt` | `yuv420p` | 最大兼容，避免 10-bit 在旧设备花屏 |

CRF 模式下码率自动按画面复杂度分配，无需手设 `-b:v`。

## 转码命令

**单文件**

```bash
ffmpeg -i input.mkv \
  -c:v libx264 -profile:v high -level 4.1 -preset slow -crf 24 \
  -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ac 2 \
  -movflags +faststart \
  output.mp4
```

**批量**（保留目录结构，已转好的自动跳过）

```bash
#!/usr/bin/env bash
# 用法: ./batch-encode.sh <源目录> <输出目录>
set -euo pipefail
SRC="${1:?}"; OUT="${2:?}"
find "$SRC" -type f \( -iname '*.mkv' -o -iname '*.avi' -o -iname '*.mov' -o -iname '*.mp4' \) |
while IFS= read -r src; do
  rel="${src#"$SRC"/}"; out="$OUT/${rel%.*}.mp4"
  mkdir -p "$(dirname "$out")"
  [[ -f "$out" && "$out" -nt "$src" ]] && { echo "skip: $rel"; continue; }
  echo "==> $rel"
  ffmpeg -y -i "$src" -c:v libx264 -profile:v high -level 4.1 -preset slow -crf 24 \
    -pix_fmt yuv420p -c:a aac -b:a 128k -ac 2 -movflags +faststart "$out"
done
```

## 硬件加速（本机已验证）

本机 `ffmpeg -hwaccels` 同时支持 `cuda` 和 `qsv`：NVENC 已实测可用（RTX 4070）；QSV 已编译进 ffmpeg，但需先升级 ffmpeg 才能用（见下）。

### 首选：NVIDIA NVENC（CUDA）极速方案

本机 RTX 4070（8GB，驱动 580.126.09）就绪，转码速度约为 libx264 slow 的 5~10 倍，动画片画质无肉眼差异：

```bash
ffmpeg -i input.mkv \
  -c:v h264_nvenc -rc vbr -cq 23 -preset p5 \
  -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ac 2 \
  -movflags +faststart \
  output.mp4
```

- `-cq 23`：恒质量档（约等效 x264 CRF 20~22），动画片可 `-cq 25`
- `-preset p5`：速度/质量平衡；要更小体积用 `p6`，要更快用 `p4`
- HEVC 对应编码器：`hevc_nvenc`（`-cq 28`）
- 批量脚本只需把 `-c:v libx264 … -crf 24` 换成 `-c:v h264_nvenc -rc vbr -cq 24 -preset p5`

### 备用：Intel QSV（N 卡驱动出问题时）

本机 Core Ultra 9 185H（Arc 核显）的 `h264_qsv` 虽已编译进 ffmpeg，但 **ffmpeg 4.4.2（Ubuntu 22.04 自带）运行时直接报 `MFX session unsupported (-3)`** —— 4.4 的 QSV 栈不支持 Meteor Lake 核显，启用前需：

1. 升级 ffmpeg 到 6.1+（如 johnvansickle 静态构建或 Ubuntu PPA）
2. 安装核显驱动：`sudo apt install intel-media-va-driver-non-free`

升级后用法：

```bash
ffmpeg -i input.mkv \
  -c:v h264_qsv -global_quality 24 -preset veryslow \
  -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ac 2 \
  -movflags +faststart \
  output.mp4
```

- `-global_quality 24`：QSV 恒质量档，24≈CRF 24
- HEVC 对应编码器：`hevc_qsv`（`-global_quality 28`）

## 进阶：HEVC（H.265）省流量

同等画质比 H.264 省 **30~50% 流量**，1080p 动画片可压到 1–1.5 Mbps。

- ✅ 流量更省，适合 Wi-Fi 信号弱或存储紧张。
- ⚠️ 需目标设备**支持 HEVC 硬解**；旧设备会软解卡顿或播放失败。

把上面的 `-c:v` 行换成：

```bash
  -c:v libx265 -preset slow -crf 28 \
  -pix_fmt yuv420p -tag:v hvc1 \
```

> HEVC 的 CRF 尺度与 H.264 不同：`crf 28` 大致相当于 H.264 `crf 23` 的画质。
> 建议先用 H.264 全量转，再挑一两部在目标平板实测 HEVC，确认硬解流畅后再推广。

## 注意

- **不要用 MKV/WebM**：多音轨/字幕轨与 `expo-video` 偶有兼容问题，MP4 最省心。
- **不要在树莓派上转码**：`-preset slow` 在树莓派 4B 上极慢，在 PC 上转好后拷过去。
