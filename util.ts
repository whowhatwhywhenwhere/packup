import {
  basename,
  crypto,
  Document,
  Element,
  fromFileUrl,
  MuxAsyncIterator,
  toHashString,
} from "./deps.ts";

export const decoder = new TextDecoder();
export const encoder = new TextEncoder();

export async function md5(data: string | ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest(
    "MD5",
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new TextEncoder().encode(data),
  );
  return toHashString(hash);
}

export async function getDependencies(path: string): Promise<string[]> {
  const command = new Deno.Command(Deno.execPath(), {
    args: ["info", "--json", path],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    throw new Error(decoder.decode(stderr));
  }
  const denoInfo = JSON.parse(decoder.decode(stdout)) as DenoInfo;
  return denoInfo.modules.map((m) => m.specifier);
}

export async function getLocalDependencies(path: string): Promise<string[]> {
  return (await getDependencies(path)).filter((s) => s.startsWith("file:"));
}

export async function getLocalDependencyPaths(path: string): Promise<string[]> {
  return (await getLocalDependencies(path)).map(fromFileUrl);
}

type Dependency = {
  specifier: string;
  isDynamic: boolean;
  code: string;
};

type Module = {
  specifier: string;
  dependencies: Dependency[];
  size: number;
  mediaType: string;
  local: string;
  checksum: string;
  emit: string;
};

type DenoInfo = {
  root: string;
  modules: Module[];
  size: number;
};

/**
 * querySelectorAll wrapper
 */
export function* qs(
  doc: Document,
  query: string,
): Generator<Element, void, void> {
  for (const node of doc.querySelectorAll(query)) {
    // deno-lint-ignore no-explicit-any
    yield node as any as Element;
  }
}

const KB = 2 ** 10;
const MB = 2 ** 20;
/**
 * Returns human readable byte size expression.
 *
 * e.g.
 *   1700 bytes -> 1.66KB
 *   1300000 bytes -> 1.24MB
 */
export function byteSize(n: number) {
  if (n > MB) {
    return `${(n / MB).toFixed(2)}MB`;
  } else if (n > KB) {
    return `${(n / KB).toFixed(2)}KB`;
  }
  return `${n}B`;
}

export function mux<T>(...iters: AsyncIterable<T>[]): AsyncIterable<T> {
  return iters.reduce((mux: MuxAsyncIterator<T>, iter) => {
    mux.add(iter);
    return mux;
  }, new MuxAsyncIterator<T>());
}

export function checkUniqueEntrypoints(paths: string[]): void {
  // Throw if there are any duplicate basenames
  const uniqueBasenames = new Set(paths.map((p) => basename(p)));
  if (uniqueBasenames.size !== paths.length) {
    throw new Error("Duplicate basenames");
  }
}

/**
 * Returns `true` if the URL refers to a local file,
 * else retuns `false` if the URL is for an external resource.
 */
export function isLocalUrl(url: string): boolean {
  return !(url.startsWith("http://") || url.startsWith("https://"));
}
