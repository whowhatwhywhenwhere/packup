import { assertEquals } from "./test_deps.ts";

Deno.test("cli.ts serve <entrypoint> --port <port> --livereload-port <port> -- serves the site at the given port and livereload port", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      "cli.ts",
      "serve",
      "examples/simple/index.html",
      "--port",
      "4567",
      "--livereload-port",
      "34567",
    ],
  });
  const child = command.spawn();
  let res = await fetch("http://localhost:4567/index.html");
  assertEquals(
    await res.text(),
    `<!DOCTYPE html><html><head></head><body><div>aaa</div>\n<script src="http://localhost:34567/livereload.js"></script></body></html>`,
  );

  // Non existent path returns the same response as the main html.
  // This is useful for apps which use client side routing.
  res = await fetch("http://localhost:4567/asdf");
  assertEquals(
    await res.text(),
    `<!DOCTYPE html><html><head></head><body><div>aaa</div>\n<script src="http://localhost:34567/livereload.js"></script></body></html>`,
  );
  child.kill("SIGTERM");
  await child.output();
});
