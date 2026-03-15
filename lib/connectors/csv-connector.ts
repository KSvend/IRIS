import type { IConnector, MonitoringPost, CountryCode } from "../types";
import { loadPostsByCountry } from "../data/load-csv";

export class CsvConnector implements IConnector {
  name = "csv";

  async fetch(options?: {
    country?: CountryCode;
    startDate?: string;
    endDate?: string;
  }): Promise<MonitoringPost[]> {
    let posts = await loadPostsByCountry(options?.country);

    if (options?.startDate) {
      posts = posts.filter(
        (p) => (p.commentDate || p.postDate) >= options.startDate!
      );
    }
    if (options?.endDate) {
      posts = posts.filter(
        (p) => (p.commentDate || p.postDate) <= options.endDate!
      );
    }

    return posts;
  }
}
