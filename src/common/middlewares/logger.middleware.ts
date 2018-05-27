import { Middleware, NestMiddleware, ExpressMiddleware, Injectable } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  resolve(...args: any[]): ExpressMiddleware {
    return (req, res, next) => { 
        console.log('object :!!!!');
      next();
    };
  }
}
