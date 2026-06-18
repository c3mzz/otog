import { Injectable } from '@nestjs/common'
import { Prisma } from '@otog/database'
import { PrismaService } from 'src/core/database/prisma.service'

@Injectable()
export class AdminLogService {
  constructor(private readonly prisma: PrismaService) {}

  private getWhereInput(args: { search?: string; action?: string }): Prisma.AdminLogWhereInput {
    const conditions: Prisma.AdminLogWhereInput[] = []
    if (args.search) {
      conditions.push({
        OR: [
          { action: { contains: args.search, mode: 'insensitive' } },
          { description: { contains: args.search, mode: 'insensitive' } },
          { user: { showName: { contains: args.search, mode: 'insensitive' } } },
        ],
      })
    }
    if (args.action) {
      const actions = args.action.split(',').map((a) => a.trim()).filter(Boolean)
      if (actions.length > 0) {
        conditions.push({ action: { in: actions } })
      }
    }
    return conditions.length > 0 ? { AND: conditions } : {}
  }

  async getAdminLogs(args: { skip: number; limit: number; search?: string; action?: string }) {
    return await this.prisma.adminLog.findMany({
      take: args.limit,
      skip: args.skip,
      where: this.getWhereInput(args),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            showName: true,
            role: true,
            rating: true,
          },
        },
      },
      orderBy: { creationDate: 'desc' },
    })
  }

  async getAdminLogsCount(args: { search?: string; action?: string }) {
    return await this.prisma.adminLog.count({
      where: this.getWhereInput(args),
    })
  }
}
