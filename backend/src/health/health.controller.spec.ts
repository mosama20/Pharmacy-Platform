import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { HealthController } from './health.controller';
import { PrismaService } from '../database/prisma.service';

describe('HealthController (API Integration Tests via Supertest)', () => {
  let app: INestApplication;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      $queryRaw: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prismaService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health/live should return 200 and alive status', async () => {
    const res = await request(app.getHttpServer()).get('/health/live').expect(200);

    expect(res.body).toEqual({ status: 'alive' });
  });

  it('GET /health/ready should return 200 when database connectivity check passes', async () => {
    prismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);

    const res = await request(app.getHttpServer()).get('/health/ready').expect(200);

    expect(res.body.status).toBe('ready');
    expect(res.body.database).toBe('connected');
  });

  it('GET /health/ready should return 503 SERVICE_UNAVAILABLE when database query fails', async () => {
    prismaService.$queryRaw.mockRejectedValue(new Error('Connection refused'));

    const res = await request(app.getHttpServer()).get('/health/ready').expect(503);

    expect(res.body.status).toBe('not_ready');
    expect(res.body.database).toBe('disconnected');
  });
});
