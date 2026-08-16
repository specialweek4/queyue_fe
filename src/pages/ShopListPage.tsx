import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import Thumb from "@/components/common/Thumb";
import Rating from "@/components/common/Rating";
import EmptyState from "@/components/common/EmptyState";
import { shopService } from "@/services/shopService";
import { useToast } from "@/context/ToastContext";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { formatDistance } from "@/utils/format";
import { LocationIcon } from "@/components/icons/Icon";
import type { Shop, ShopType } from "@/types";
import styles from "./ShopListPage.module.css";

type SortKey = "" | "distance" | "comments" | "score";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "", label: "默认" },
  { key: "distance", label: "距离" },
  { key: "comments", label: "人气" },
  { key: "score", label: "评分" }
];

const ShopListPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const typeId = Number(searchParams.get("type") || 0);
  const typeName = searchParams.get("name") || "";
  const keyword = searchParams.get("q") || "";

  const [types, setTypes] = useState<ShopType[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("");
  const loadingRef = useRef(false);

  const title = keyword ? `搜索：${keyword}` : typeName || "雀探";

  // 类型列表
  useEffect(() => {
    let cancelled = false;
    shopService
      .typeList()
      .then(data => {
        if (!cancelled) setTypes(data ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  /** 拉取一页：搜索按名称、有类型按类型、无类型返回全部店铺 */
  const fetchPage = useCallback(
    async (page: number) => {
      if (keyword) {
        return (await shopService.byName(keyword, page)) ?? [];
      }
      if (typeId > 0) {
        return (await shopService.byType(typeId, page)) ?? [];
      }
      // 全部店铺：按名称查询且不带关键字，后端返回全量
      return (await shopService.byName("", page)) ?? [];
    },
    [keyword, typeId]
  );

  const loadMore = useCallback(async () => {
    if (loadingRef.current || finished) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await fetchPage(current + 1);
      if (data.length === 0) {
        setFinished(true);
      } else {
        setShops(prev => [...prev, ...data]);
        setCurrent(prev => prev + 1);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载店铺失败");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [fetchPage, current, finished, toast]);

  // 切换类型 / 关键字时：重置列表并加载第一页
  useEffect(() => {
    let cancelled = false;
    loadingRef.current = true;
    setLoading(true);
    setShops([]);
    setCurrent(1);
    setFinished(false);
    fetchPage(1)
      .then(data => {
        if (cancelled) return;
        if (data.length === 0) {
          setFinished(true);
        } else {
          setShops(data);
        }
      })
      .catch(err => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "加载店铺失败");
      })
      .finally(() => {
        if (!cancelled) {
          loadingRef.current = false;
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage, toast]);

  useInfiniteScroll(null, loadMore, { disabled: loading || finished });

  const sortedShops = useMemo(() => {
    if (!sortBy) return shops;
    const list = [...shops];
    if (sortBy === "distance") {
      list.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else if (sortBy === "comments") {
      list.sort((a, b) => (b.comments ?? 0) - (a.comments ?? 0));
    } else if (sortBy === "score") {
      list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
    return list;
  }, [shops, sortBy]);

  const selectType = (t: ShopType) => {
    if (!keyword && String(typeId) === String(t.id)) return;
    setSearchParams({ type: String(t.id), name: t.name });
  };

  const selectAll = () => {
    if (!keyword && typeId === 0) return;
    setSearchParams({});
  };

  const header = (
    <PageHeader
      title={title}
      subtitle={keyword ? "为你找到以下相关店铺" : "发现附近好店，尽在雀探"}
    />
  );

  return (
    <AppLayout variant="cardless" header={header}>
      <section className={styles.hero}>
        <div>
          <h2 className={styles.heroTitle}>发现附近好店</h2>
          <p className={styles.heroSub}>探店笔记、优惠券、真实评价，尽在趣评雀</p>
        </div>
        <div className={styles.heroStamps}>
          <span className={styles.stampCyan}>点评</span>
          <span className={styles.stampGreen}>探店</span>
          <span className={styles.stampSky}>优惠</span>
        </div>
      </section>

      <section className={styles.typeSection}>
        <div className={styles.typeGrid}>
          <button
            type="button"
            className={!keyword && typeId === 0 ? `${styles.typeBox} ${styles.typeActive}` : styles.typeBox}
            onClick={selectAll}
          >
            <span className={styles.typeView}>
              <span className={styles.typeAllIcon}>
                <LocationIcon size={24} />
              </span>
            </span>
            <span className={styles.typeText}>全部</span>
          </button>
          {types.map(t => (
            <button
              key={t.id}
              type="button"
              className={
                !keyword && String(typeId) === String(t.id)
                  ? `${styles.typeBox} ${styles.typeActive}`
                  : styles.typeBox
              }
              onClick={() => selectType(t)}
            >
              <span className={styles.typeView}>
                <Thumb src={`/imgs/${t.icon}`} alt={t.name} kind="shop" />
              </span>
              <span className={styles.typeText}>{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.sortBar}>
        {sortOptions.map(option => (
          <button
            key={option.key || "default"}
            type="button"
            className={sortBy === option.key ? `${styles.sortItem} ${styles.sortActive}` : styles.sortItem}
            onClick={() => setSortBy(sortBy === option.key ? "" : option.key)}
          >
            {option.label}
          </button>
        ))}
        <span className={styles.sortHint}>共 {shops.length} 家</span>
      </div>

      {sortedShops.length === 0 && !loading ? (
        <EmptyState
          icon={<LocationIcon size={28} />}
          title="没有找到相关店铺"
          description="换个类型或关键词试试吧"
        />
      ) : (
        <div className={styles.waterfall}>
          {sortedShops.map(shop => {
            const image = (shop.images || "").split(",")[0];
            return (
              <article key={shop.id} className={styles.card} onClick={() => navigate(`/shop/${shop.id}`)}>
                <div className={styles.cardImg}>
                  <Thumb src={image} alt={shop.name} kind="shop" />
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTitle} title={shop.name}>
                    {shop.name}
                  </div>
                  <div className={styles.rateRow}>
                    <Rating value={(shop.score ?? 0) / 10} showScore size={13} />
                    <span className={styles.comments}>{shop.comments}条评价</span>
                  </div>
                  <div className={styles.chips}>
                    <span className={styles.area}>{shop.area}</span>
                    {shop.distance ? <span className={styles.distance}>{formatDistance(shop.distance)}</span> : null}
                  </div>
                  <div className={styles.addressRow}>
                    <LocationIcon size={12} />
                    <span>{shop.address}</span>
                  </div>
                  <div className={styles.cardFoot}>
                    <span className={styles.avg}>￥{shop.avgPrice}/人</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className={styles.loadingRow}>
        {loading ? <span className={styles.loading}>加载中…</span> : null}
        {finished && shops.length > 0 ? <span className={styles.finished}>— 已经到底啦 —</span> : null}
      </div>
    </AppLayout>
  );
};

export default ShopListPage;
