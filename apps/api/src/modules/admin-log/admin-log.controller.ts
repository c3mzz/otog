import { Controller, UseGuards } from '@nestjs/common'
import {
  TsRestHandler,
  nestControllerContract,
  tsRestHandler,
} from '@ts-rest/nest'
import { Role } from 'src/core/constants'
import { Roles } from 'src/core/decorators/roles.decorator'
import { RolesGuard } from 'src/core/guards/roles.guard'

import { adminLogRouter } from '@otog/contract'

import { AdminLogService } from './admin-log.service'

const c = nestControllerContract(adminLogRouter)

@Controller()
@UseGuards(RolesGuard)
export class AdminLogController {
  constructor(private readonly adminLogService: AdminLogService) {}

  @TsRestHandler(c.getAdminLogs, { jsonQuery: true })
  @Roles(Role.Admin)
  getAdminLogs() {
    return tsRestHandler(
      c.getAdminLogs,
      async ({ query: { skip = 0, limit = 10, search, action } }) => {
        const [data, total] = await Promise.all([
          this.adminLogService.getAdminLogs({ skip, limit, search, action }),
          this.adminLogService.getAdminLogsCount({ search, action }),
        ])
        return {
          status: 200,
          body: { data, total },
        }
      }
    )
  }
}
