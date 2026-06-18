import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/core/database/prisma.service'

import { UpdateAnnouncementSchema } from '@otog/contract'

@Injectable()
export class AnnouncementService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneById(announcementId: number) {
    return await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    })
  }

  async findAll() {
    return await this.prisma.announcement.findMany({
      where: { contestId: null },
      orderBy: { id: 'desc' },
    })
  }

  async findShown() {
    return await this.prisma.announcement.findMany({
      where: { show: true, contestId: null },
      orderBy: { id: 'desc' },
    })
  }

  async findAllWithContestId(contestId: number) {
    return await this.prisma.announcement.findMany({
      where: { contestId },
      orderBy: { id: 'desc' },
    })
  }

  async findShownWithContestId(contestId: number) {
    return await this.prisma.announcement.findMany({
      where: { show: true, contestId },
      orderBy: { id: 'desc' },
    })
  }

  async create(value: string, contestId: number | null = null, adminUserId?: number) {
    const announcement = await this.prisma.announcement.create({
      data: { value: JSON.parse(value), contestId },
    })
    if (adminUserId) {
      await this.prisma.adminLog.create({
        data: {
          userId: adminUserId,
          action: 'CREATE_ANNOUNCEMENT',
          description: contestId
            ? `Created announcement (ID: ${announcement.id}) for contest (ID: ${contestId})`
            : `Created announcement (ID: ${announcement.id})`,
        },
      })
    }
    return announcement
  }

  async delete(announcementId: number, adminUserId?: number) {
    const announcement = await this.prisma.announcement.delete({
      where: { id: announcementId },
    })
    if (adminUserId) {
      await this.prisma.adminLog.create({
        data: {
          userId: adminUserId,
          action: 'DELETE_ANNOUNCEMENT',
          description: `Deleted announcement (ID: ${announcement.id})`,
        },
      })
    }
    return announcement
  }

  async updateAnnouncementShow(announcementId: number, show: boolean, adminUserId?: number) {
    const announcement = await this.prisma.announcement.update({
      where: { id: announcementId },
      data: { show },
    })
    if (adminUserId) {
      await this.prisma.adminLog.create({
        data: {
          userId: adminUserId,
          action: show ? 'SHOW_ANNOUNCEMENT' : 'HIDE_ANNOUNCEMENT',
          description: `${show ? 'Shown' : 'Hidden'} announcement (ID: ${announcement.id})`,
        },
      })
    }
    return announcement
  }

  async updateAnnounce(
    announcementId: number,
    announcementInput: UpdateAnnouncementSchema,
    adminUserId?: number
  ) {
    const announcement = await this.prisma.announcement.update({
      where: { id: announcementId },
      data: {
        ...announcementInput,
        value: JSON.parse(announcementInput.value),
      },
    })
    if (adminUserId) {
      await this.prisma.adminLog.create({
        data: {
          userId: adminUserId,
          action: 'UPDATE_ANNOUNCEMENT',
          description: `Updated announcement (ID: ${announcement.id})`,
        },
      })
    }
    return announcement
  }
}
