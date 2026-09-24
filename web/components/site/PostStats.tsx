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

function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-6.4-4.2-9.2-8C.9 10.4 1.3 6.8 4.1 5.3 6.2 4.2 8.7 4.9 12 8c3.3-3.1 5.8-3.8 7.9-2.7 2.8 1.5 3.2 5.1.3 7.7C18.4 16.8 12 21 12 21z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 12a8 8 0 0 1-8 8 8.7 8.7 0 0 1-3.6-.8L4 21l1.4-4.3A8 8 0 1 1 20 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      <HeartIcon filled={liked} />
      <span>{formatCount(likes)}</span>
    </>
  );
  const commentInner = (
    <>
      <CommentIcon />
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
