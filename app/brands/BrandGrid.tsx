'use client'

import { useState } from 'react'
import RadarChart from '../_components/RadarChart'

interface BrandData {
  brand: string
  industry: string
  scores: Record<string, number>
  imageFile: string | null
}

const DIMENSIONS = ['Sincerity', 'Excitement', 'Competence', 'Sophistication', 'Ruggedness']

type SortKey = 'brand' | 'industry' | typeof DIMENSIONS[number]

export default function BrandGrid({ brands }: { brands: BrandData[] }) {
  const [sortBy, setSortBy] = useState<SortKey>('brand')
  const [sortAsc, setSortAsc] = useState(true)
  const [filterIndustry, setFilterIndustry] = useState<string>('')
  const [selectedBrand, setSelectedBrand] = useState<BrandData | null>(null)
  const [compareBrand, setCompareBrand] = useState<BrandData | null>(null)

  const industries = [...new Set(brands.map(b => b.industry))].sort()

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortBy(key)
      setSortAsc(key === 'brand' || key === 'industry')
    }
  }

  const filtered = filterIndustry
    ? brands.filter(b => b.industry === filterIndustry)
    : brands

  const sorted = [...filtered].sort((a, b) => {
    let cmp: number
    if (sortBy === 'brand') cmp = a.brand.localeCompare(b.brand)
    else if (sortBy === 'industry') cmp = a.industry.localeCompare(b.industry)
    else cmp = (a.scores[sortBy] ?? 0) - (b.scores[sortBy] ?? 0)
    return sortAsc ? cmp : -cmp
  })

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <select
          value={filterIndustry}
          onChange={e => setFilterIndustry(e.target.value)}
          className="text-xs font-mono px-2 py-1.5 border border-zinc-200 rounded bg-white"
        >
          <option value="">All Industries ({brands.length})</option>
          {industries.map(ind => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
        {selectedBrand && (
          <span className="text-xs font-mono text-zinc-500">
            Selected: <strong>{selectedBrand.brand}</strong>
            <button onClick={() => setSelectedBrand(null)} className="ml-1 text-zinc-400 hover:text-zinc-600">&times;</button>
          </span>
        )}
        {compareBrand && (
          <span className="text-xs font-mono text-zinc-500">
            vs: <strong>{compareBrand.brand}</strong>
            <button onClick={() => setCompareBrand(null)} className="ml-1 text-zinc-400 hover:text-zinc-600">&times;</button>
          </span>
        )}
      </div>

      {/* Comparison radar charts */}
      {selectedBrand && (
        <div className="mb-8 flex flex-wrap gap-6 items-start">
          <div className="text-center">
            {selectedBrand.imageFile && (
              <img
                src={`/api/brand-image/${encodeURIComponent(selectedBrand.imageFile)}`}
                alt={selectedBrand.brand}
                className="w-16 h-16 object-contain mx-auto mb-2"
              />
            )}
            <p className="text-xs font-mono font-semibold text-zinc-700 mb-1">{selectedBrand.brand}</p>
            <RadarChart
              data={selectedBrand.scores}
              width={240}
              height={240}
              maxValue={5}
              fillColor="#18181b"
              strokeColor="#18181b"
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <div className="mt-2 space-y-0.5">
              {DIMENSIONS.map(d => (
                <div key={d} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-24 text-zinc-500 text-right">{d}</span>
                  <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-800 rounded-full" style={{ width: `${((selectedBrand.scores[d] ?? 0) / 5) * 100}%` }} />
                  </div>
                  <span className="text-zinc-600 w-6">{selectedBrand.scores[d]?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {compareBrand && (
            <div className="text-center">
              {compareBrand.imageFile && (
                <img
                  src={`/api/brand-image/${encodeURIComponent(compareBrand.imageFile)}`}
                  alt={compareBrand.brand}
                  className="w-16 h-16 object-contain mx-auto mb-2"
                />
              )}
              <p className="text-xs font-mono font-semibold text-zinc-700 mb-1">{compareBrand.brand}</p>
              <RadarChart
                data={compareBrand.scores}
                width={240}
                height={240}
                maxValue={5}
                fillColor="#dc2626"
                strokeColor="#dc2626"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
              <div className="mt-2 space-y-0.5">
                {DIMENSIONS.map(d => (
                  <div key={d} className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="w-24 text-zinc-500 text-right">{d}</span>
                    <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600 rounded-full" style={{ width: `${((compareBrand.scores[d] ?? 0) / 5) * 100}%` }} />
                    </div>
                    <span className="text-zinc-600 w-6">{compareBrand.scores[d]?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-zinc-200 rounded">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="text-left px-3 py-2 text-zinc-400 font-normal w-8"></th>
              <th
                className="text-left px-3 py-2 text-zinc-400 font-normal cursor-pointer hover:text-zinc-600"
                onClick={() => handleSort('brand')}
              >
                Brand {sortBy === 'brand' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th
                className="text-left px-3 py-2 text-zinc-400 font-normal cursor-pointer hover:text-zinc-600"
                onClick={() => handleSort('industry')}
              >
                Industry {sortBy === 'industry' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              {DIMENSIONS.map(d => (
                <th
                  key={d}
                  className="text-right px-3 py-2 text-zinc-400 font-normal cursor-pointer hover:text-zinc-600"
                  onClick={() => handleSort(d)}
                >
                  {d.slice(0, 4)} {sortBy === d ? (sortAsc ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((brand, i) => {
              const isSelected = selectedBrand?.brand === brand.brand
              const isCompare = compareBrand?.brand === brand.brand
              return (
                <tr
                  key={brand.brand}
                  className={`border-b border-zinc-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-zinc-100' : isCompare ? 'bg-red-50' : 'hover:bg-zinc-50'
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedBrand(null)
                      setCompareBrand(null)
                    } else if (selectedBrand && !isCompare) {
                      setCompareBrand(brand)
                    } else if (isCompare) {
                      setCompareBrand(null)
                    } else {
                      setSelectedBrand(brand)
                    }
                  }}
                >
                  <td className="px-3 py-1.5">
                    {brand.imageFile && (
                      <img
                        src={`/api/brand-image/${encodeURIComponent(brand.imageFile)}`}
                        alt=""
                        className="w-5 h-5 object-contain"
                      />
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-zinc-800 font-semibold">{brand.brand}</td>
                  <td className="px-3 py-1.5 text-zinc-500">{brand.industry}</td>
                  {DIMENSIONS.map(d => {
                    const val = brand.scores[d] ?? 0
                    const intensity = Math.round(((val - 2) / 3) * 100)
                    return (
                      <td key={d} className="px-3 py-1.5 text-right">
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="inline-block w-8 h-1.5 rounded-full bg-zinc-100 overflow-hidden"
                          >
                            <span
                              className="block h-full rounded-full bg-zinc-700"
                              style={{ width: `${(val / 5) * 100}%` }}
                            />
                          </span>
                          <span className="text-zinc-600 w-8 text-right">{val.toFixed(2)}</span>
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
