import { elasticOptions } from "@/config/options";
import { Module, OnModuleInit } from "@nestjs/common";
import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { SearchService } from "./search.service";

@Module({
  imports: [ElasticsearchModule.registerAsync(elasticOptions)],
  providers: [SearchService],
  exports: [SearchService]
})
export class SearchModule implements OnModuleInit {
  constructor(private readonly searchService: SearchService) {}
  
  public async onModuleInit() {
    await this.searchService.initializeIndexes();
  }
}