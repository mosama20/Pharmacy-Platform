import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth(@Res() res: Response) {
    const startTime = Date.now();
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - startTime;
    } catch (err: any) {
      dbStatus = `unhealthy: ${err.message}`;
    }

    const isHealthy = dbStatus === 'healthy';
    const memory = process.memoryUsage();

    const data = {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: 'postgresql',
      },
      memory: {
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        rssMb: Math.round(memory.rss / (1024 * 1024)),
      },
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0',
    };

    return res
      .status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .json(data);
  }

  @Get('live')
  getLiveness(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({ status: 'alive' });
  }

  @Get('ready')
  async getReadiness(@Res() res: Response) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return res.status(HttpStatus.OK).json({ status: 'ready', database: 'connected' });
    } catch {
      return res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .json({ status: 'not_ready', database: 'disconnected' });
    }
  }
}
