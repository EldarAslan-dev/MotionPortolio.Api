import { Heart, MessageCircle } from "lucide-react";

function formatCount(n: number) {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1).replace(".", ",")} M`;
  }
  if (n >= 1000) {
    const v = n / 1000;
    return `${Number.isInteger(v) ? v : v.toFixed(1).replace(".", ",")} min`;
  }
  return String(n);
}

export function PostStats({
  likes,
  comments,
  liked,
  onLike,
  onComments,
}: {
  likes: number;
  comments: number;
  liked?: boolean;
  onLike?: () => void;
  onComments?: () => void;
}) {
  const likeInner = (
    <>
      <Heart fill={liked ? "currentColor" : "none"} strokeWidth={1.7} />
      <span>{formatCount(likes)}</span>
    </>
  );
  const commentInner = (
    <>
      <MessageCircle strokeWidth={1.7} />
      <span>{formatCount(comments)}</span>
    </>
  );

  return (
    <div className="post-stats">
      {onLike ? (
        <button type="button" className={`post-stat ${liked ? "is-on" : ""}`} onClick={onLike} aria-label="Like">
          {likeInner}
        </button>
      ) : (
        <span className={`post-stat ${liked ? "is-on" : ""}`}>{likeInner}</span>
      )}
      {onComments ? (
        <button type="button" className="post-stat" onClick={onComments} aria-label="Comments">
          {commentInner}
        </button>
      ) : (
        <span className="post-stat">{commentInner}</span>
      )}
    </div>
  );
}
