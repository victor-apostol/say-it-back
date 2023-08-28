import { MappingTypeMapping } from "@elastic/elasticsearch/lib/api/types";

export const esIndexes = [
  'search_users'
];

export const mappings: Record<string, MappingTypeMapping> = {
  'search_users': {
    properties: {
      username: {
        type: 'keyword',     
      },
      name: {
        type: "text",
        fields: {
          keyword: {
            type: "keyword",
            ignore_above: 32
          }
        }
      },
    }
  }
};
