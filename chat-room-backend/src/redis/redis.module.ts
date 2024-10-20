import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createClient } from 'redis';

// 全局模块，可以在整个应用中共享
@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      async useFactory() {
        // 创建 Redis 客户端
        const client = createClient({
          socket: {
            host: 'localhost', // Redis 服务器地址
            port: 6379, // Redis 服务器端口
          },
          database: 2, // 使用的数据库索引
        });
        // 连接到 Redis 服务器
        await client.connect();
        return client;
      },
    },
  ],
  // 导出 RedisService，使其可以在其他模块中使用
  exports: [RedisService],
})
export class RedisModule {}
