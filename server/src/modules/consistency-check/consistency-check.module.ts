import { Module } from '@nestjs/common';
import { ConsistencyCheckService } from './consistency-check.service';
import { ConsistencyCheckController } from './consistency-check.controller';

@Module({
  controllers: [ConsistencyCheckController],
  providers: [ConsistencyCheckService],
  exports: [ConsistencyCheckService],
})
export class ConsistencyCheckModule {}
