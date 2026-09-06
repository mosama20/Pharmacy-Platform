import { Module, Global } from '@nestjs/common';
import { DbService } from './db.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, DbService],
  exports: [PrismaService, DbService],
})
export class DbModule {}
