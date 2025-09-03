import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Download, Filter, Plus, RefreshCw, Trash2, X, BarChart3, Grid3X3, Target, Users, TrendingUp, DollarSign, Calendar, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { useArabicPricingData, PriceRow, DurationKey } from '@/hooks/useArabicPricingData'
import { exportToExcel } from '@/utils/exportExcel'
import { ColumnDef, ColumnFiltersState, SortingState, VisibilityState, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

const labels = {
  title: 'إدارة الأسعار العربية',
  stats: {
    total: 'إجمالي الصفوف',
    sizes: 'عدد المقاسات',
    levels: 'عدد المستويات',
    customers: 'أنواع الزبائن',
    average: 'متوسط الأسعار',
    range: 'نطاق الأسعار'
  },
  filters: {
    search: 'ابحث في جميع الأعمدة…',
    size: 'المقاس',
    level: 'المستوى',
    customer: 'نوع الزبون',
    allSizes: 'جميع المقاسات',
    allLevels: 'جميع المستويات',
    allCustomers: 'جميع أنواع الزبائن',
    clear: 'مسح الفلاتر'
  },
  toolbar: {
    add: 'إضافة صف جديد',
    refresh: 'تحديث البيانات',
    export: 'تصدير Excel'
  },
  table: {
    size: 'المقاس',
    level: 'المستوى',
    customer: 'نوع الزبون',
    pricesGroup: 'الأسعار حسب المدة',
    one_day: 'يوم واحد',
    one_month: 'شهر واحد',
    two_months: '2 أشهر',
    three_months: '3 أشهر',
    six_months: '6 أشهر',
    full_year: 'سنة كاملة',
    actions: 'الإجراءات',
    currencyHint: 'د.ل'
  },
  confirmDelete: 'هل أنت متأكد من حذف هذا الصف؟ لا يمكن التراجع.'
}

interface Props { onClose: () => void }

const durationOrder: DurationKey[] = ['one_day', 'one_month', 'two_months', 'three_months', 'six_months', 'full_year']

export default function EnhancedArabicPricingManagement({ onClose }: Props) {
  const { rows, loading, error, setError, fetchPricing, createRow, updateCell, deleteRow, stats, filters } = useArabicPricingData()

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [isPricesExpanded, setIsPricesExpanded] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setColumnFilters(prev => {
        const next = prev.filter(f => !['size','level','customer'].includes(String(f.id)))
        return next
      })
    }, 0)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    const id = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(id)
  }, [toast])

  const PriceCell: React.FC<{ row: PriceRow; k: DurationKey }> = ({ row, k }) => {
    const [val, setVal] = useState<number>(row.prices[k] || 0)
    useEffect(() => setVal(row.prices[k] || 0), [row, k])
    const onCommit = async () => {
      const v = Number(val) || 0
      const res = await updateCell(row, k, v)
      if (res.success) setToast({ type: 'success', msg: 'تم الحفظ بنجاح' })
      else setToast({ type: 'error', msg: res.error || 'فشل الحفظ' })
    }
    return (
      <div className="flex flex-col items-center justify-center h-12">
        <input
          type="number"
          min={0}
          step={1}
          value={val}
          onChange={e => setVal(parseInt(e.target.value || '0'))}
          onBlur={onCommit}
          onKeyDown={e => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur() } }}
          aria-label={`${labels.table.pricesGroup} - ${labels.table[k]}` as any}
          className="w-24 text-center border rounded-md h-8 text-sm"
        />
        <span className="text-xs text-gray-500 leading-none mt-0.5">{labels.table.currencyHint}</span>
      </div>
    )
  }

  const columns = useMemo<ColumnDef<PriceRow>[]>(() => {
    const priceCols: ColumnDef<PriceRow>[] = durationOrder.map((k) => ({
      id: k,
      accessorFn: r => r.prices[k],
      header: labels.table[k],
      cell: ({ row }) => <PriceCell row={row.original} k={k} />,
      size: 140,
      enableSorting: true,
      meta: { isPrice: true }
    }))

    const base: ColumnDef<PriceRow>[] = [
      { id: 'size', accessorKey: 'size', header: labels.table.size, size: 140 },
      { id: 'level', accessorKey: 'level', header: labels.table.level, size: 110 },
      { id: 'customer', accessorKey: 'customer', header: labels.table.customer, size: 140 },
      {
        id: 'pricesGroupToggle',
        header: () => (
          <button onClick={() => setIsPricesExpanded(v => !v)} className="flex items-center gap-2 justify-center w-full">
            <Calendar className="w-4 h-4" />
            {labels.table.pricesGroup}
            {isPricesExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ),
        cell: () => null,
        size: 180,
        enableSorting: false
      },
      { id: 'actions', header: labels.table.actions, cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Button aria-label="حذف" variant="outline" size="sm" className="text-red-600 border-red-300" onClick={async () => {
            if (!confirm(labels.confirmDelete)) return
            const res = await deleteRow(row.original.id)
            if (res.success) setToast({ type: 'success', msg: 'تم الحذف' })
            else setToast({ type: 'error', msg: res.error || 'فشل الحذف' })
          }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ), size: 110 }
    ]

    const withGroup = [
      base[0], base[1], base[2],
      ...(isPricesExpanded ? priceCols : [{ id: 'pricesCollapsed', accessorFn: r => 0, header: labels.table.pricesGroup, cell: () => (
        <div className="text-center text-sm text-gray-600">⯈</div>
      ), size: 160 }]),
      base[4]
    ]

    return withGroup
  }, [isPricesExpanded])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters, globalFilter, columnVisibility, columnPinning: { left: ['size','level','customer'], right: ['actions'] }},
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: false,
    enableColumnResizing: true,
    defaultColumn: { size: 140 },
    debugTable: false,
  })

  useEffect(() => {
    // toggle price columns visibility based on expansion
    const priceIds = durationOrder
    const next: VisibilityState = {}
    priceIds.forEach(id => next[id] = isPricesExpanded)
    next['pricesCollapsed'] = !isPricesExpanded
    setColumnVisibility(v => ({ ...v, ...next }))
  }, [isPricesExpanded])

  const parentRef = useRef<HTMLDivElement | null>(null)
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  })

  const visibleCount = table.getRowModel().rows.length
  const totalCount = rows.length

  // Add new row modal state
  const [showAdd, setShowAdd] = useState(false)
  const [newRowState, setNewRowState] = useState<Omit<PriceRow, 'id'>>({
    size: '',
    level: 'A',
    customer: 'عادي',
    prices: { one_day: 0, one_month: 0, two_months: 0, three_months: 0, six_months: 0, full_year: 0 }
  })

  const addRow = async () => {
    const res = await createRow(newRowState)
    if (res.success) {
      setShowAdd(false)
      setNewRowState({ size: '', level: 'A', customer: 'عادي', prices: { one_day: 0, one_month: 0, two_months: 0, three_months: 0, six_months: 0, full_year: 0 } })
      setToast({ type: 'success', msg: 'تمت الإضافة' })
    } else {
      setToast({ type: 'error', msg: res.error || 'فشل الإضافة' })
    }
  }

  const debouncedSetGlobal = useRef<number | null>(null)
  const onSearchChange = (v: string) => {
    if (debouncedSetGlobal.current) window.clearTimeout(debouncedSetGlobal.current)
    debouncedSetGlobal.current = window.setTimeout(() => setGlobalFilter(v), 300)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><BarChart3 className="w-7 h-7" /></div>
            <div>
              <h1 className="text-2xl font-bold">{labels.title}</h1>
              <p className="text-sm opacity-90">Supabase</p>
            </div>
          </div>
          <Button onClick={onClose} variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30"><X className="w-5 h-5" /></Button>
        </div>

        {/* banners */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md">تعذر جلب البيانات. حاول مجددًا.</div>
        )}

        {toast && (
          <div className={`mx-6 mt-4 p-3 rounded-md ${toast.type==='success'?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>{toast.msg}</div>
        )}

        {/* Stats */}
        <div className="p-6 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-3"><div className="text-center"><div className="text-xl font-bold">{stats.total}</div><div className="text-sm text-gray-600">{labels.stats.total}</div></div></Card>
            <Card className="p-3"><div className="text-center"><div className="text-xl font-bold">{stats.sizes}</div><div className="text-sm text-gray-600">{labels.stats.sizes}</div></div></Card>
            <Card className="p-3"><div className="text-center"><div className="text-xl font-bold">{stats.levels}</div><div className="text-sm text-gray-600">{labels.stats.levels}</div></div></Card>
            <Card className="p-3"><div className="text-center"><div className="text-xl font-bold">{stats.customers}</div><div className="text-sm text-gray-600">{labels.stats.customers}</div></div></Card>
            <Card className="p-3"><div className="text-center"><div className="text-lg font-bold">{stats.average.toLocaleString()}</div><div className="text-sm text-gray-600">{labels.stats.average}</div></div></Card>
            <Card className="p-3"><div className="text-center"><div className="text-sm font-bold">{stats.range.min.toLocaleString()} - {stats.range.max.toLocaleString()}</div><div className="text-sm text-gray-600">{labels.stats.range}</div></div></Card>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 pb-2 space-y-3">
          {/* Filters row */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder={labels.filters.search} onChange={(e)=>onSearchChange(e.target.value)} className="pr-8" />
            </div>
            <select aria-label={labels.filters.size} className="h-10 px-3 border rounded-md" value={(table.getColumn('size')?.getFilterValue() as string) ?? ''} onChange={e=>table.getColumn('size')?.setFilterValue(e.target.value || undefined)}>
              <option value="">{labels.filters.allSizes}</option>
              {filters.sizes.map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
            <select aria-label={labels.filters.level} className="h-10 px-3 border rounded-md" value={(table.getColumn('level')?.getFilterValue() as string) ?? ''} onChange={e=>table.getColumn('level')?.setFilterValue(e.target.value || undefined)}>
              <option value="">{labels.filters.allLevels}</option>
              {filters.levels.map(l=> <option key={l} value={l}>مستوى {l}</option>)}
            </select>
            <select aria-label={labels.filters.customer} className="h-10 px-3 border rounded-md" value={(table.getColumn('customer')?.getFilterValue() as string) ?? ''} onChange={e=>table.getColumn('customer')?.setFilterValue(e.target.value || undefined)}>
              <option value="">{labels.filters.allCustomers}</option>
              {filters.customers.map(c=> <option key={c} value={c}>{c}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={()=>{ setGlobalFilter(''); setColumnFilters([]) }}>{labels.filters.clear}</Button>
            <Button aria-label="فلترة" variant="outline" size="icon" className="md:hidden" onClick={()=>setMobileFiltersOpen(true)}><Filter /></Button>
          </div>

          {/* Toolbar row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-gray-600">عرض: {visibleCount} من {totalCount}</div>
            <div className="flex gap-2">
              <Button onClick={()=>setShowAdd(true)} className="bg-green-600 text-white">{labels.toolbar.add}</Button>
              <Button onClick={fetchPricing} variant="outline"><RefreshCw className={loading? 'animate-spin':''} />{labels.toolbar.refresh}</Button>
              <Button variant="outline" onClick={()=>exportToExcel(table.getRowModel().rows.map(r=>r.original))}><Download />{labels.toolbar.export}</Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="px-6 pb-6">
          <div className="overflow-x-auto border rounded-lg">
            <div className="min-w-[980px]">
              {/* header */}
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-10">
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id} className="bg-indigo-600 text-white">
                      {hg.headers.map(header => (
                        <th key={header.id} className="px-3 py-2 text-center font-bold border-b border-indigo-700 sticky" style={{ position: 'sticky', right: header.column.getIsPinned() === 'left' ? undefined : undefined, left: header.column.getIsPinned() === 'right' ? 0 : undefined }}>
                          {header.isPlaceholder ? null : (typeof header.column.columnDef.header === 'function' ? header.column.columnDef.header({ column: header.column, header } as any) : header.column.columnDef.header as any)}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
              </table>

              {/* body with virtualization */}
              <div ref={parentRef} className="max-h-[56vh] overflow-auto relative" style={{ contain: 'strict' }}>
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                  {rowVirtualizer.getVirtualItems().map(virtualRow => {
                    const row = table.getRowModel().rows[virtualRow.index]
                    return (
                      <div key={row.id} data-index={virtualRow.index} ref={virtualRow.measureElement} className={`absolute top-0 left-0 w-full`} style={{ transform: `translateY(${virtualRow.start}px)` }}>
                        <table className="w-full border-separate border-spacing-0">
                          <tbody>
                            <tr className={`h-12 ${virtualRow.index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className="px-2 text-center border-b border-gray-200" style={{ minWidth: (cell.column.getSize() || 140) + 'px' }}>
                                  {cell.renderCell()}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Skeleton */}
          {loading && (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 6 }).map((_,i)=>(<div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />))}
            </div>
          )}
        </div>

        {/* Mobile Filters Drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
            <div className="w-80 bg-white h-full p-4 space-y-4">
              <div className="flex items-center justify-between mb-2"><div className="font-bold">الفلاتر</div><Button variant="outline" size="sm" onClick={()=>setMobileFiltersOpen(false)}>إغلاق</Button></div>
              <Input placeholder={labels.filters.search} onChange={(e)=>onSearchChange(e.target.value)} />
              <select className="h-10 px-3 border rounded-md" value={(table.getColumn('size')?.getFilterValue() as string) ?? ''} onChange={e=>table.getColumn('size')?.setFilterValue(e.target.value || undefined)}>
                <option value="">{labels.filters.allSizes}</option>
                {filters.sizes.map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="h-10 px-3 border rounded-md" value={(table.getColumn('level')?.getFilterValue() as string) ?? ''} onChange={e=>table.getColumn('level')?.setFilterValue(e.target.value || undefined)}>
                <option value="">{labels.filters.allLevels}</option>
                {filters.levels.map(l=> <option key={l} value={l}>مستوى {l}</option>)}
              </select>
              <select className="h-10 px-3 border rounded-md" value={(table.getColumn('customer')?.getFilterValue() as string) ?? ''} onChange={e=>table.getColumn('customer')?.setFilterValue(e.target.value || undefined)}>
                <option value="">{labels.filters.allCustomers}</option>
                {filters.customers.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={()=>setMobileFiltersOpen(false)}>تطبيق</Button>
                <Button className="flex-1" variant="outline" onClick={()=>{ setGlobalFilter(''); setColumnFilters([]) }}>مسح</Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl p-6">
              <h3 className="text-xl font-bold mb-4">{labels.toolbar.add}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <Input placeholder="مثال: 13x5" value={newRowState.size} onChange={e=>setNewRowState(s=>({...s,size:e.target.value}))} />
                <select className="h-10 px-3 border rounded-md" value={newRowState.level} onChange={e=>setNewRowState(s=>({...s,level:e.target.value as any}))}>
                  {['A','B','C','D'].map(l=> <option key={l} value={l}>مستوى {l}</option>)}
                </select>
                <select className="h-10 px-3 border rounded-md" value={newRowState.customer} onChange={e=>setNewRowState(s=>({...s,customer:e.target.value as any}))}>
                  {['عادي','مسوق','شركات','المدينة'].map(c=> <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {durationOrder.map(k => (
                  <div key={k} className="flex flex-col">
                    <label className="text-sm mb-1">{labels.table[k]}</label>
                    <Input type="number" min={0} step={1} value={newRowState.prices[k]} onChange={e=>setNewRowState(s=>({...s, prices:{...s.prices, [k]: parseInt(e.target.value||'0')}}))} />
                    <span className="text-xs text-gray-500 mt-1">{labels.table.currencyHint}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 text-white" onClick={addRow}>حفظ</Button>
                <Button className="flex-1" variant="outline" onClick={()=>setShowAdd(false)}>إلغاء</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
