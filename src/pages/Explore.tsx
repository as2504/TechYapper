import { useLibrary } from '../lib/content'
import { useMastery } from '../lib/mastery'
import { SearchBox } from '../components/SearchBox'
import { Legend, PeriodicTable } from '../components/PeriodicTable'

export default function Explore() {
  const lib = useLibrary()
  const { counts } = useMastery()
  const lit = counts[2] + counts[3]
  return (
    <div className="px-5 sm:px-10 lg:px-14 py-10 sm:py-14 max-w-[1100px]">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="display text-[38px] sm:text-[54px] font-semibold">The Periodic Table of Tech</h1>
          <p className="mt-3 text-muted"><span className="text-ink font-semibold">{lit} of {lib.techs.length}</span> lit up. Light them all.</p>
        </div>
        <div className="lg:w-[340px]"><SearchBox size="md" suggestions={false} /></div>
      </header>
      <div className="mt-10"><PeriodicTable /></div>
      <div className="mt-8 pt-5 border-t border-line"><Legend /></div>
    </div>
  )
}
