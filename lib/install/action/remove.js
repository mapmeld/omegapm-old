"use strict"
var npm = require("../../npm.js")
var finishLogAfterCb = require("../finish-log-after-cb.js")

module.exports = function (buildpath, pkg, log, cb) {
  log.silly("remove", pkg.path)
  npm.commands.unbuild(pkg.path, finishLogAfterCb(log, cb))
}
