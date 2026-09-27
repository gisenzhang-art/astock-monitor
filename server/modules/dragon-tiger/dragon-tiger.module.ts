import { Module } from '@nestjs/common';
import { DragonTigerController } from './dragon-tiger.controller';
import { DragonTigerService } from './dragon-tiger.service';
@Module({ controllers: [DragonTigerController], providers: [DragonTigerService] })
export class DragonTigerModule {}