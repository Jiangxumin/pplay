/**
 * LittleEars 是和 PPlay 同一台主机、端口 3000 的局域网音频播放系统。
 * PPlay 进入前台播放时，希望顺带让 LittleEars 停止，避免两套声音叠加。
 */

/**
 * 根据 PPlay 的 baseURL 推导出 LittleEars 的「停止」接口地址。
 * LittleEars 与配置的服务器同主机，仅端口不同（固定 3000）。
 * baseURL 为空或无法解析时返回 null。
 */
export function littleEarsStopUrl(baseURL: string): string | null {
  if (!baseURL) return null;
  let parsed: URL;
  try {
    parsed = new URL(baseURL);
  } catch {
    return null;
  }
  return `${parsed.protocol}//${parsed.hostname}:3000/api/stop`;
}

/**
 * 尝试请求 LittleEars 停止播放。只有和 LittleEars 在同一局域网时才可能成功；
 * 任何失败（不在同网 / 服务未启动）都静默忽略，不影响主流程。
 */
export async function stopLittleEars(baseURL: string): Promise<void> {
  const stopUrl = littleEarsStopUrl(baseURL);
  if (!stopUrl) return;
  try {
    await fetch(stopUrl, { method: 'POST' });
  } catch {
    // not on the same network, or LittleEars is down — ignore
  }
}
