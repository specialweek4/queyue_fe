import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import Thumb from "@/components/common/Thumb";
import Rating from "@/components/common/Rating";
import EmptyState from "@/components/common/EmptyState";
import { shopService } from "@/services/shopService";
import { voucherService } from "@/services/voucherService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatPrice, formatDiscount, formatSeckillTime } from "@/utils/format";
import { ClockIcon, TicketIcon, ChatIcon, LocationIcon, RightIcon } from "@/components/icons/Icon";
import type { Shop, Voucher } from "@/types";
import styles from "./ShopDetailPage.module.css";

/** 网友评价示例数据（与 hmdp 前端一致，后端评价接口待实现） */
const demoTags = ["味道赞(19)", "牛肉赞(16)", "菜品不错(11)", "回头客(4)", "分量足(4)", "停车方便(3)", "海鲜棒(3)", "饮品赞(3)", "朋友聚餐(6)"];
const demoComments = [
  { user: "叶小乙", level: "Lv5", score: 4.5, text: "某平台上买的券，价格可以当工作餐吃，虽然价格便宜，但是这家店一点都没有..." },
  { user: "雀跃用户_01", level: "Lv4", score: 4, text: "环境很清爽，上菜速度快，招牌菜没有踩雷，下次还会再来。" },
  { user: "爱溜达的猫", level: "Lv6", score: 5, text: "周末人比较多建议提前取号，套餐性价比很高，服务态度也不错。" }
];

const ShopDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();

  const [shop, setShop] = useState<Shop | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [seckilling, setSeckilling] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const shopId = Number(id);
    shopService
      .byId(shopId)
      .then(data => {
        if (!cancelled) setShop(data);
      })
      .catch(err => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "加载店铺失败");
      });
    voucherService
      .listOfShop(shopId)
      .then(data => {
        if (!cancelled) setVouchers(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setVouchers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  const isNotBegin = (v: Voucher) => (v.beginTime ? new Date(v.beginTime).getTime() > Date.now() : false);
  const isEnd = (v: Voucher) => (v.endTime ? new Date(v.endTime).getTime() < Date.now() : false);

  const handleSeckill = async (v: Voucher) => {
    if (authLoading || !user) {
      toast.error("请先登录");
      navigate("/login", { state: { from: `/shop/${id}` } });
      return;
    }
    if (isNotBegin(v)) {
      toast.error("优惠券抢购尚未开始！");
      return;
    }
    if (isEnd(v)) {
      toast.error("优惠券抢购已经结束！");
      return;
    }
    if ((v.stock ?? 0) < 1) {
      toast.error("库存不足，请刷新再试试！");
      return;
    }
    setSeckilling(true);
    try {
      const orderId = await voucherService.seckill(v.id);
      toast.success(`抢购成功，订单id：${orderId}`);
      setVouchers(prev => prev.map(item => (item.id === v.id ? { ...item, stock: (item.stock ?? 1) - 1 } : item)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "抢购失败");
    } finally {
      setSeckilling(false);
    }
  };

  const images = (shop?.images || "").split(",").filter(Boolean);

  const header = <PageHeader title="店铺详情" back right={<button type="button" className={styles.shareBtn}>···</button>} />;

  return (
    <AppLayout variant="cardless" header={header}>
      {!shop ? (
        <EmptyState icon={<LocationIcon size={28} />} title="店铺不存在" description="该店铺可能已下线" />
      ) : (
        <>
          <section className={styles.infoCard}>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>{shop.name}</h2>
              <Rating value={(shop.score ?? 0) / 10} showScore size={15} />
              <span className={styles.comments}>{shop.comments}条评价</span>
            </div>
            {images.length > 0 ? (
              <div className={styles.images}>
                {images.map((img, i) => (
                  <div key={i} className={styles.imageItem}>
                    <Thumb src={img} alt={`${shop.name} 图片${i + 1}`} kind="shop" />
                  </div>
                ))}
              </div>
            ) : null}
            <div className={styles.addressRow}>
              <LocationIcon size={16} />
              <span>{shop.address}</span>
              <span className={styles.area}>{shop.area}</span>
            </div>
            <div className={styles.openRow}>
              <ClockIcon size={16} />
              <b>营业时间</b>
              <span>{shop.openHours || "暂无"}</span>
              <button type="button" className={styles.detailLink}>
                查看详情 <RightIcon size={13} />
              </button>
            </div>
          </section>

          <section className={styles.voucherSection}>
            <div className={styles.sectionTitle}>
              <span className={styles.ticketIcon}>
                <TicketIcon size={14} />
              </span>
              <b>代金券</b>
            </div>
            {vouchers.length === 0 ? (
              <EmptyState icon={<TicketIcon size={28} />} title="暂无代金券" description="本店优惠券正在准备中" />
            ) : (
              <div className={styles.voucherList}>
                {vouchers.map(v => {
                  const disabled = isNotBegin(v) || isEnd(v) || (v.stock ?? 0) < 1;
                  return (
                    <div key={v.id} className={styles.voucherBox}>
                      <div className={styles.voucherLeft}>
                        <div className={styles.voucherTitle}>{v.title}</div>
                        <div className={styles.voucherSub}>{v.subTitle}</div>
                        <div className={styles.voucherPrice}>
                          <span className={styles.priceSymbol}>￥</span>
                          <span className={styles.priceValue}>{formatPrice(v.payValue)}</span>
                          <span className={styles.discount}>{formatDiscount(v.payValue, v.actualValue)}</span>
                        </div>
                      </div>
                      <div className={styles.voucherRight}>
                        {v.type ? (
                          <div className={styles.seckillBox}>
                            <button
                              type="button"
                              className={`${styles.seckillBtn} ${disabled || seckilling ? styles.disabledBtn : ""}`}
                              disabled={disabled || seckilling}
                              onClick={() => void handleSeckill(v)}
                            >
                              限时抢购
                            </button>
                            <div className={styles.stock}>
                              剩余 <b>{v.stock ?? 0}</b> 张
                            </div>
                            <div className={styles.time}>{formatSeckillTime(v.beginTime, v.endTime)}</div>
                          </div>
                        ) : (
                          <button type="button" className={styles.buyBtn} disabled>
                            抢购
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className={styles.commentSection}>
            <div className={styles.sectionTitle}>
              <span className={styles.chatIcon}>
                <ChatIcon size={14} />
              </span>
              <b>网友评价</b>
              <span className={styles.demoNote}>（示例内容）</span>
            </div>
            <div className={styles.tagList}>
              {demoTags.map(tag => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className={styles.commentList}>
              {demoComments.map((comment, i) => (
                <div key={i} className={styles.commentBox}>
                  <div className={styles.commentInfo}>
                    <div className={styles.commentUser}>
                      {comment.user} <span>{comment.level}</span>
                    </div>
                    <Rating value={comment.score} size={12} />
                    <div className={styles.commentText}>{comment.text}</div>
                  </div>
                </div>
              ))}
              <button type="button" className={styles.viewAll}>
                查看全部评价 <RightIcon size={13} />
              </button>
            </div>
          </section>

          <footer className={styles.copyright}>copyright ©2026 qupingque.com · 雀跃</footer>
        </>
      )}
    </AppLayout>
  );
};

export default ShopDetailPage;
