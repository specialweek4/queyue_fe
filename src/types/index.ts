/**
 * 与 qupingque_be（黑马点评风格后端）实体字段一一对应的前端类型
 */

/** 后端统一返回结构 Result{success, errorMsg, data, total} */
export interface Result<T> {
  success: boolean;
  errorMsg?: string | null;
  data?: T;
  total?: number | null;
}

/** 店铺类型 */
export interface ShopType {
  id: number;
  name: string;
  icon: string;
  sort: number;
}

/** 店铺 */
export interface Shop {
  id: number;
  name: string;
  typeId: number;
  images: string;
  area: string;
  address: string;
  x: number;
  y: number;
  avgPrice: number;
  sold: number;
  comments: number;
  score: number;
  openHours: string;
  createTime: string;
  updateTime: string;
  distance?: number;
}

/** 探店笔记 */
export interface Blog {
  id: number;
  shopId?: number;
  userId: number;
  /** 作者昵称（/blog/hot、/blog/{id} 返回） */
  icon?: string;
  name?: string;
  /** 当前登录用户是否点赞 */
  isLike?: boolean;
  title: string;
  images: string;
  content: string;
  liked: number;
  comments: number;
  createTime: string;
  updateTime: string;
}

/** 登录用户信息（UserDTO） */
export interface UserDTO {
  id: number;
  nickName: string;
  icon: string;
}

/** 用户完整信息（/user/{id} 约定返回） */
export interface User extends UserDTO {
  phone: string;
  createTime: string;
}

/** 用户详情（UserInfo） */
export interface UserInfo {
  userId: number;
  city: string;
  introduce: string;
  fans: number;
  followee: number;
  gender: boolean;
  birthday: string;
  credits: number;
  level: boolean;
  createTime?: string;
  updateTime?: string;
}

/** 优惠券 */
export interface Voucher {
  id: number;
  shopId: number;
  title: string;
  subTitle: string;
  rules: string;
  /** 支付金额（分） */
  payValue: number;
  /** 抵扣金额（分） */
  actualValue: number;
  /** 0 普通券 / 1 秒杀券 */
  type: number;
  status: number;
  stock: number;
  beginTime?: string;
  endTime?: string;
  createTime?: string;
  updateTime?: string;
}

/** 关注流分页返回（滚动分页） */
export interface ScrollResult {
  list: Blog[];
  minTime: number;
  offset: number;
}

/** 登录表单（手机号 + 验证码 或 手机号 + 密码） */
export interface LoginForm {
  phone: string;
  code?: string;
  password?: string;
}

/** 签到状态（/user/sign/count 返回） */
export interface SignCount {
  /** 今日是否已签到 */
  today: boolean;
  /** 连续签到天数：今日已签为截至今天；今日未签为截至昨天 */
  streak: number;
  /** 本月累计已签天数（断签不清零） */
  monthDays: number;
}
