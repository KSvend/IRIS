import type { IConnector, MonitoringPost, CountryCode } from "../types";

// Stub connector for future social media API integrations
export class ApiConnector implements IConnector {
  name: string;
  private description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  async fetch(_options?: {
    country?: CountryCode;
    startDate?: string;
    endDate?: string;
  }): Promise<MonitoringPost[]> {
    console.log(
      `[${this.name}] ${this.description} connector not yet implemented`
    );
    return [];
  }
}
