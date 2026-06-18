import { Module } from '@nestjs/common'

import { AdminLogController } from './admin-log.controller'
import { AdminLogService } from './admin-log.service'

@Module({
  providers: [AdminLogService],
  controllers: [AdminLogController],
  exports: [AdminLogService],
})
export class AdminLogModule {}
