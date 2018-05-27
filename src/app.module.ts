import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { Module, NestModule, MiddlewaresConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [ AppService ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewaresConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes(AppController); 
  }
}
