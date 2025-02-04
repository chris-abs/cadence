import { Muted } from '../Typography'

export const NoResults = ({ type, query }: { type: string; query: string }) => (
  <div className="flex items-center gap-2 p-4">
    <Muted className="italic">
      No {type}s matching "{query}"
    </Muted>
  </div>
)
