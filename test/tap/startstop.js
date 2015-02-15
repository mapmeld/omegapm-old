var common = require("../common-tap")
  , test = require("tap").test
  , path = require("path")
  , rimraf = require("rimraf")
  , mkdirp = require("mkdirp")
  , pkg = path.resolve(__dirname, "startstop")
  , cache = path.resolve(pkg, "cache")
  , tmp = path.resolve(pkg, "tmp")
  , opts = { cwd: pkg }

function testOutput (t, command, er, code, stdout, stderr) {
  t.notOk(code, "npm " + command + " exited with code 0")

  if (stderr)
    throw new Error("npm " + command + " stderr: " + stderr.toString())

  stdout = stdout.trim().split(/\n|\r/)
  stdout = stdout[stdout.length - 1]
  t.equal(stdout, command)
  t.end()
}

function cleanup () {
  rimraf.sync(cache)
  rimraf.sync(tmp)
}

test("setup", function (t) {
  cleanup()
  mkdirp.sync(cache)
  mkdirp.sync(tmp)
  t.end()
})

test("cleanup", function (t) {
  cleanup()
  t.end()
})
