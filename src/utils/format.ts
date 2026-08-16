/**
 * 工具函数（沿用 hmdp 前端 common.js 中 util 的约定）
 */

/** 分转元：后端金额以“分”为单位存储，展示为“12.34”元 */
export function formatPrice(val?: number | string | null): string | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "string") {
    if (isNaN(Number(val))) return null;
    return formatPrice(Number(val));
  }
  if (!val) return null;
  const s = val + "";
  if (s.length === 0) return "0.00";
  if (s.length === 1) return "0.0" + val;
  if (s.length === 2) return "0." + val;
  const i = s.indexOf(".");
  if (i < 0) {
    return s.substring(0, s.length - 2) + "." + s.substring(s.length - 2);
  }
  const num = s.substring(0, i) + s.substring(i + 1);
  if (i === 1) return "0.0" + num;
  if (i === 2) return "0." + num;
  return num.substring(0, i - 2) + "." + num.substring(i - 2);
}

/** 折扣：payValue*10/actualValue，如 88 折 */
export function formatDiscount(payValue: number, actualValue: number): string {
  if (!actualValue) return "0折";
  const zhe = (payValue * 10) / actualValue;
  return zhe.toFixed(1).replace(/\.0$/, "") + "折";
}

/** 日期格式化：2021年3月12日 */
export function formatDate(value?: string | number | Date | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
}

/** 日期时间格式化：2021年3月12日 14:30 */
export function formatDateTime(value?: string | number | Date | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 秒杀时间段：3月12日 10:00 ~ 12:00 */
export function formatSeckillTime(beginTime?: string, endTime?: string): string {
  if (!beginTime || !endTime) return "";
  const b = new Date(beginTime);
  const e = new Date(endTime);
  if (isNaN(b.getTime()) || isNaN(e.getTime())) return "";
  return `${b.getMonth() + 1}月${b.getDate()}日 ${pad(b.getHours())}:${pad(b.getMinutes())} ~ ${pad(e.getHours())}:${pad(e.getMinutes())}`;
}

/** 距离展示：<1000m 显示 xm，否则 x.x km */
export function formatDistance(distance?: number | null): string {
  if (!distance) return "";
  return distance < 1000 ? distance.toFixed(1) + "m" : (distance / 1000).toFixed(1) + "km";
}

function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}
