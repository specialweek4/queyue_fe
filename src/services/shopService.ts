import { apiFetch } from "./apiClient";
import type { Shop, ShopType } from "@/types";

/** 店铺相关接口（对应 qupingque_be ShopController / ShopTypeController） */
export const shopService = {
  /** 店铺类型列表 */
  typeList: () => apiFetch<ShopType[]>("/shop-type/list"),

  /** 按 id 查询店铺 */
  byId: (id: number) => apiFetch<Shop>(`/shop/${id}`),

  /** 按类型分页查询店铺 */
  byType: (typeId: number, current = 1) =>
    apiFetch<Shop[]>("/shop/of/type", {
      params: { typeId, current }
    }),

  /** 按名称关键字分页查询店铺 */
  byName: (name: string, current = 1) =>
    apiFetch<Shop[]>("/shop/of/name", {
      params: { name, current }
    })
};
