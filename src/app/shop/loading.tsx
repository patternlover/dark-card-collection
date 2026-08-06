import { ListingSkeleton } from '@/components/ui/ListingSkeleton'

export default function Loading() {
  return (
    <div className="bg-black">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 lg:px-8 lg:pt-16">
        <ListingSkeleton />
      </div>
    </div>
  )
}
