"use strict"

module.exports = function (tree) {
  var flat = {}
  function flatten (pkg, path) {
    path += pkg.package.name
    flat[path] = pkg
    pkg.children.forEach(function (value) { flatten(value, path + "/") })
  }
  flatten(tree, "")
  return flat
}
