import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import {
  ColumnFiltersState,
  VisibilityState,
  createColumnHelper,
  getCoreRowModel,
} from '@tanstack/table-core'
import NextLink from 'next/link'

import { AdminLogSchema } from '@otog/contract'
import { Button } from '@otog/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@otog/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@otog/ui/tabs'
import {
  FunnelIcon,
  PlusIcon,
  NotePencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  RepeatIcon,
  UserIcon,
} from '@phosphor-icons/react'

import { adminLogKey } from '../../api/query'
import { withSession } from '../../api/server'
import {
  TableComponent,
  TablePagination,
  TablePaginationInfo,
  TableSearch,
} from '../../components/table-component'

interface AdminLogPageProps {}

export const getServerSideProps = withSession<AdminLogPageProps>(
  async ({ session }) => {
    if (session?.user.role !== 'admin') {
      return { notFound: true }
    }
    return { props: {} }
  }
)

export default function AdminLogPage() {
  return (
    <main className="container flex-1 py-8">
      <h1 className="text-xl font-semibold mb-4 font-heading">ระบบ GOTO</h1>
      <Tabs value="log">
        <TabsList className="justify-start relative h-auto w-full gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border">
          <TabsTrigger
            value="problem"
            className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
            asChild
          >
            <NextLink href="/admin">โจทย์</NextLink>
          </TabsTrigger>
          <TabsTrigger
            value="contest"
            className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
            asChild
          >
            <NextLink href="/admin/contest">แข่งขัน</NextLink>
          </TabsTrigger>
          <TabsTrigger
            value="user"
            className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
            asChild
          >
            <NextLink href="/admin/user">ผู้ใช้งาน</NextLink>
          </TabsTrigger>
          <TabsTrigger
            value="log"
            className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
            asChild
          >
            <NextLink href="/admin/log">บันทึกการทำงาน</NextLink>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="log" className="mt-4">
          <LogDataTable />
        </TabsContent>
      </Tabs>
    </main>
  )
}

const ActionLabel: Record<string, string> = {
  CREATE_CONTEST: 'สร้างการแข่งขัน',
  UPDATE_CONTEST: 'แก้ไขการแข่งขัน',
  DELETE_CONTEST: 'ลบการแข่งขัน',
  ADD_PROBLEM: 'เพิ่มโจทย์',
  UPDATE_PROBLEM: 'แก้ไขโจทย์',
  SHOW_PROBLEM: 'แสดงโจทย์',
  HIDE_PROBLEM: 'ซ่อนโจทย์',
  DELETE_PROBLEM: 'ลบโจทย์',
  RESTORE_PROBLEM: 'กู้คืนโจทย์',
  SHARE_SUBMISSION: 'ตั้งค่าการเข้าถึงผลตรวจ',
  UPDATE_USER_NAME: 'แก้ไขชื่อผู้ใช้งาน',
  GIVE_ADMIN: 'ให้สิทธิ์แอดมิน',
  UPDATE_USER: 'แก้ไขข้อมูลผู้ใช้งาน',
  CREATE_ANNOUNCEMENT: 'สร้างประกาศ',
  UPDATE_ANNOUNCEMENT: 'แก้ไขประกาศ',
  DELETE_ANNOUNCEMENT: 'ลบประกาศ',
  SHOW_ANNOUNCEMENT: 'แสดงประกาศ',
  HIDE_ANNOUNCEMENT: 'ซ่อนประกาศ',
}

function getActionIcon(action: string) {
  const className = 'size-4 text-muted-foreground'
  switch (action) {
    case 'CREATE_CONTEST':
    case 'ADD_PROBLEM':
    case 'CREATE_ANNOUNCEMENT':
      return <PlusIcon className={className} />
    case 'UPDATE_CONTEST':
    case 'UPDATE_PROBLEM':
    case 'UPDATE_USER_NAME':
    case 'UPDATE_USER':
    case 'UPDATE_ANNOUNCEMENT':
      return <NotePencilIcon className={className} />
    case 'DELETE_CONTEST':
    case 'DELETE_PROBLEM':
    case 'DELETE_ANNOUNCEMENT':
      return <TrashIcon className={className} />
    case 'SHOW_PROBLEM':
    case 'SHOW_ANNOUNCEMENT':
      return <EyeIcon className={className} />
    case 'HIDE_PROBLEM':
    case 'HIDE_ANNOUNCEMENT':
      return <EyeSlashIcon className={className} />
    case 'RESTORE_PROBLEM':
      return <RepeatIcon className={className} />
    case 'SHARE_SUBMISSION':
      return <EyeIcon className={className} />
    case 'GIVE_ADMIN':
      return <UserIcon className={className} />
    default:
      return <FunnelIcon className={className} />
  }
}

function LogDataTable() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [search, setSearch] = useState('')
  const [selectedActions, setSelectedActions] = useState<string[]>([])

  const getAdminLogs = useQuery({
    ...adminLogKey.getAdminLogs({
      query: {
        limit: pagination.pageSize,
        skip: pagination.pageIndex * pagination.pageSize,
        search: search.trim(),
        action: selectedActions.length > 0 ? selectedActions.join(',') : undefined,
      },
    }),
    placeholderData: keepPreviousData,
  })

  const logs = useMemo(
    () =>
      getAdminLogs.data?.status === 200
        ? getAdminLogs.data.body.data
        : [],
    [getAdminLogs.data]
  )

  const rowCount = useMemo(
    () => getAdminLogs.data?.body.total ?? 0,
    [getAdminLogs.data]
  )

  const table = useReactTable({
    columns,
    data: logs,
    state: {
      columnFilters,
      columnVisibility,
      globalFilter: search,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setSearch,

    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    rowCount,
  })

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [search, selectedActions])

  return (
    <div className="flex flex-col gap-4">
      <h2 className="sr-only">ตารางบันทึกการทำงาน</h2>
      <div className="flex gap-2 flex-col sm:flex-row justify-between">
        <div className="flex gap-2 flex-1 max-sm:flex-col">
          <TableSearch table={table} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="font-normal w-full sm:w-auto">
                <FunnelIcon />
                การกระทำ
                {selectedActions.length > 0 && (
                  <>
                    <hr className="h-full border-l" />
                    <div className="flex gap-1 items-center">
                      {selectedActions.map((actionValue) => (
                        <span key={actionValue} title={ActionLabel[actionValue]}>
                          {getActionIcon(actionValue)}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
              {Object.entries(ActionLabel).map(([value, label]) => {
                const isChecked = selectedActions.includes(value)
                return (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={isChecked}
                    onSelect={(e) => e.preventDefault()}
                    onClick={() => {
                      if (isChecked) {
                        setSelectedActions(selectedActions.filter((a) => a !== value))
                      } else {
                        setSelectedActions([...selectedActions, value])
                      }
                    }}
                  >
                    <div className="flex gap-2 items-center">
                      {getActionIcon(value)}
                      {label}
                    </div>
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2 justify-end max-sm:flex-col">
          <TablePaginationInfo
            className="self-end"
            table={table}
            isLoading={getAdminLogs.isFetching}
          />
        </div>
      </div>
      <TableComponent
        table={table}
        isLoading={getAdminLogs.isLoading}
        isError={getAdminLogs.isError}
      />
      <TablePagination table={table} isLoading={getAdminLogs.isFetching} />
    </div>
  )
}

const columnHelper = createColumnHelper<AdminLogSchema>()
const columns = [
  columnHelper.accessor('id', {
    header: '#',
    enableSorting: false,
  }),
  columnHelper.accessor('creationDate', {
    header: 'เวลา',
    cell: ({ getValue }) => new Date(getValue()).toLocaleString('th-TH'),
    enableSorting: false,
  }),
  columnHelper.accessor('user.showName', {
    header: 'ผู้ทำรายการ',
    cell: ({ row }) => `${row.original.user.showName} (@${row.original.user.username})`,
    enableSorting: false,
  }),
  columnHelper.accessor('action', {
    header: 'การกระทำ',
    enableSorting: false,
  }),
  columnHelper.accessor('description', {
    header: 'รายละเอียด',
    cell: ({ getValue }) => getValue() ?? '-',
    enableSorting: false,
  }),
]
