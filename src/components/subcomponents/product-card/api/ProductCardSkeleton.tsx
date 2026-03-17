// Shown while products are loading from the API

export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[4/3] bg-neutral-100 dark:bg-neutral-800" />

      {/* Body placeholder */}
      <div className="p-3.5 space-y-3">
        <div className="h-2.5 w-16 bg-neutral-100 dark:bg-neutral-800 rounded" />
        <div className="h-4 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded" />
        <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800 rounded" />
        <div className="h-5 w-20 bg-neutral-100 dark:bg-neutral-800 rounded" />
        <div className="flex gap-1">
          {[1,2,3].map(i => (
            <div key={i} className="h-4 w-10 bg-neutral-100 dark:bg-neutral-800 rounded" />
          ))}
        </div>
        <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full" />
        <div className="h-9 w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
      </div>
    </div>
  )
}