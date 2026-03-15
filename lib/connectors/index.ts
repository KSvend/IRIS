import type { IConnector } from "../types";
import { CsvConnector } from "./csv-connector";
import { ApiConnector } from "./api-connector";

export const connectors: IConnector[] = [
  new CsvConnector(),
  new ApiConnector("twitter", "Twitter/X API v2"),
  new ApiConnector("facebook", "Facebook Graph API"),
  new ApiConnector("tiktok", "TikTok Research API"),
];

export function getConnector(name: string): IConnector | undefined {
  return connectors.find((c) => c.name === name);
}
