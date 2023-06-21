import {
  create,
  Level,
} from "./deps.ts";

export let logger = create("info");

export function setLogLevel(l: Level) {
  logger = create(l);
}
