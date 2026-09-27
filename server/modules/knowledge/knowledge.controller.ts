import { Controller, Get, Param, Query } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import type { KnowledgeItem, ListResponse } from '@shared/api.interface';

@Controller('api/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}
  @Get() async getList(@Query('category') category?: string, @Query('keyword') keyword?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string): Promise<ListResponse<KnowledgeItem>> {
    return this.knowledgeService.getList({ category, keyword, page: page ? parseInt(page, 10) : 1, pageSize: pageSize ? parseInt(pageSize, 10) : 20 });
  }
  @Get('categories') async getCategories() { return this.knowledgeService.getCategories(); }
  @Get('stats') async getStats() { return this.knowledgeService.getStats(); }
  @Get(':id') async getById(@Param('id') id: string): Promise<KnowledgeItem> { return this.knowledgeService.getById(id); }
}