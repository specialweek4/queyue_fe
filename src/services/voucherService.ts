import { apiFetch } from "./apiClient";
import type { Voucher } from "@/types";

/** 优惠券相关接口（对应 qupingque_be VoucherController / VoucherOrderController） */
export const voucherService = {
  /** 查询店铺优惠券列表 */
  listOfShop: (shopId: number) => apiFetch<Voucher[]>(`/voucher/list/${shopId}`),

  /** 秒杀抢购优惠券，成功返回订单 id */
  seckill: (voucherId: number) =>
    apiFetch<number>(`/voucher-order/seckill/${voucherId}`, {
      method: "POST"
    })
};
