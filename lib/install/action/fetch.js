"use strict"
var cache = require("../../cache.js")
var finishLogAfterCb = require("../finish-log-after-cb.js")

module.exports = function (buildpath, pkg, log, cb) {
  var name = pkg.package.name
  var version
  switch (pkg.package._requested.type) {
    case "version":
    case "range":
      version = pkg.package.version
      break
    case "hosted":
      name = name + "@" + pkg.package._requested.spec
      break
    default:
      name = pkg.package._requested.raw
  }
  log.silly("fetch", name, version)
  cache.add(name, version, pkg.path, false, finishLogAfterCb(log, cb))
}
