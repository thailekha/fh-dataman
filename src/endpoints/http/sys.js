export function sysPingEndpoint(server) {
  function endpoint(req, res, next) {
    res.send("Ok");
  }
  server.get("/sys/info/ping", endpoint);
}

export function sysHealthEndpoint(server) {
  function endpoint(req, res, next) {
    res.json({
      "http": "ok"
    });
  }
  server.get("/sys/info/health", endpoint);
}
