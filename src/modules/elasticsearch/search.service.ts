import { AggregationsAggregate, QueryDslQueryContainer, SearchRequest, SearchResponse } from "@elastic/elasticsearch/lib/api/types";
import { Injectable } from "@nestjs/common";
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { esIndexes, mappings } from "./elastic.constants";

type Indexes = "search_users";

@Injectable()
export class SearchService {
  constructor(private readonly esSearch: ElasticsearchService) {}

  async search(
    index: Indexes, 
    query: QueryDslQueryContainer, 
    options?: SearchRequest
  ): Promise<SearchResponse<unknown, Record<string, AggregationsAggregate>>> {
    return await this.esSearch.search({
      index,
      query,
      ...options
    });
  }

  async initializeIndexes(): Promise<void> {
    await Promise.all(
      esIndexes.map(async indexName => {
        const indexExists = await this.esSearch.indices.exists({ index: indexName });
    
        if (!indexExists) {
          await this.esSearch.indices.create({
            index: indexName,
            body: {
              mappings: mappings[indexName],
            },
          });
        } 
      })
    )
  }
}