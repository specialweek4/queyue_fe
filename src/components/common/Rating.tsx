import { StarIcon } from "@/components/icons/Icon";
import styles from "./Rating.module.css";

type RatingProps = {
  /** 0~5 分值（店铺 score 为 0~50，需先除以 10） */
  value: number;
  showScore?: boolean;
  size?: number;
};

/** 星级评分（支持半星展示），蜜金主题 */
const Rating = ({ value, showScore = false, size = 14 }: RatingProps) => {
  const clamped = Math.max(0, Math.min(5, value));
  const percent = (clamped / 5) * 100;

  return (
    <span className={styles.rating}>
      <span className={styles.stars} style={{ fontSize: size }}>
        <span className={styles.starsBack}>
          {[0, 1, 2, 3, 4].map(i => (
            <StarIcon key={i} size={size} />
          ))}
        </span>
        <span className={styles.starsFront} style={{ width: `${percent}%` }}>
          {[0, 1, 2, 3, 4].map(i => (
            <StarIcon key={i} size={size} />
          ))}
        </span>
      </span>
      {showScore ? <span className={styles.score}>{clamped.toFixed(1)}</span> : null}
    </span>
  );
};

export default Rating;
