import { Controller, Get, Param, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import type { NewsMessage, ListResponse, NewsCategory } from '@shared/api.interface';

@Controller('api/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}
  @Get() async getNewsList(@Query('category') category?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('keyword') keyword?: string): Promise<ListResponse<NewsMessage>> {
    return this.newsService.getNewsList({ category, page: page ? parseInt(page, 10) : 1, pageSize: pageSize ? parseInt(pageSize, 10) : 20, keyword });
  }
  @Get('categories') async getCategories() { return this.newsService.getCategories(); }
  @Get('sim-trade') async getSimTradeNews(): Promise<NewsMessage[]> { return this.newsService.getByCategory('sim_trade'); }
  @Get('tech-stock') async getTechStockNews(): Promise<NewsMessage[]> { return this.newsService.getByCategory('tech_stock'); }
  @Get('related/:stockCode') async getRelatedNews(@Param('stockCode') stockCode: string): Promise<NewsMessage[]> { return this.newsService.getRelatedNews(stockCode); }
  @Get(':id') async getById(@Param('id') id: string): Promise<NewsMessage> { return this.newsService.getById(id); }
}