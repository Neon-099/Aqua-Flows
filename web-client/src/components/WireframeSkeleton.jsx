const cx = (...classes) => classes.filter(Boolean).join(' ');

export const Skeleton = ({ className = '' }) => (
  <div className={cx('animate-pulse rounded-xl bg-slate-200/80', className)} />
);

export const SkeletonGroup = ({ className = '', children }) => (
  <div className={cx('space-y-3', className)}>{children}</div>
);

