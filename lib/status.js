
// show signed security messages from package developers
//

module.exports = exports = status

var npm = require("./npm.js")
  , readInstalled = require("read-installed")
  , log = require("npmlog")
  , path = require("path")
  , archy = require("archy")
  , semver = require("semver")
  , url = require("url")
  , color = require("ansicolors")
  , npa = require("npm-package-arg")
  , request = require("request")
  , openpgp = require("openpgp")
  , fs = require("fs")

status.usage = "omegapm status"

status.completion = require("./utils/completion/installed-deep.js")

function status (args, silent, cb) {
  if (typeof cb !== "function") cb = silent, silent = false

  var dir = path.resolve(npm.dir, "..")

  // npm status 'foo@~1.3' bar 'baz@<2'
  if (!args) args = []
  else args = args.map(function (a) {
    var p = npa(a)
      , name = p.name
      , ver = semver.validRange(p.rawSpec) || ""

    return [ name, ver ]
  })

  var depth = npm.config.get("depth")
  var opt = { depth: depth, log: log.warn, dev: true }
  readInstalled(dir, opt, function (er, data) {
    pruneNestedExtraneous(data)

    var bfs = bfsify(data, args)
      , lite = getLite(bfs)

    var finalize = function() {
      cb(er, data, lite)
    };
    
    if (er || silent) return finalize()

    var flattened = [];
    var flattenPackage = function(data, prepackages) {
      var dependencies = Object.keys(data.dependencies);
      dependencies.forEach(function(depName) {
        flattened.push( prepackages.join('/') + "/" + depName );
        flattenPackage(data.dependencies[depName], prepackages.concat([depName]));
      });
    };
    flattenPackage(data, ['']);
    
    var checkMessages = function(packages, index) {
      var nextPackage = function() {
        if (index === packages.length - 1) {
          finalize();
        } else {
          checkMessages(packages, index + 1);
        }
      };

      var myPackage = packages[index].split("/");
      fs.exists((myPackage.join('/node_modules/') + '/SIGNED.md').substring(1), function(exists) {
        if (exists) {
          request('http://omegapm.org/messages/' + myPackage[myPackage.length-1], function(err, response, body) {
            if (err || response.statusCode != 200 || !body) {
              console.error(err || response.statusCode || 'no content');
            } else {
              var messages = JSON.parse(body);
              if (messages.length === 1 && messages[0] === "couldn't find that package =-(") {
                console.log('found signed package but no record on omegapm.org');
              } else if (messages.length) {
                console.log("!!! signatures matched on server but currently are not checked by client !!!");
                var verifyMessage = function(messages, m) {
                  console.log(messages[m]);

                  if(m === messages.length - 1) {
                    nextPackage();
                  } else {
                    verifyMessage(messages, m + 1);
                  }
                };
                return verifyMessage(messages, 0);
              }
            }
            nextPackage();
          });
        } else {
          // no SIGNED.md, so can't be on omegapm as of 0.0.5
          nextPackage();
        }
      });
    };
    checkMessages(flattened, 0);
  })
}

function pruneNestedExtraneous (data, visited) {
  visited = visited || []
  visited.push(data)
  for (var i in data.dependencies) {
    if (data.dependencies[i].extraneous) {
      data.dependencies[i].dependencies = {}
    } else if (visited.indexOf(data.dependencies[i]) === -1) {
      pruneNestedExtraneous(data.dependencies[i], visited)
    }
  }
}

function alphasort (a, b) {
  a = a.toLowerCase()
  b = b.toLowerCase()
  return a > b ? 1
       : a < b ? -1 : 0
}

function getLite (data, noname) {
  var lite = {}
    , maxDepth = npm.config.get("depth")

  if (!noname && data.name) lite.name = data.name
  if (data.version) lite.version = data.version
  if (data.extraneous) {
    lite.extraneous = true
    lite.problems = lite.problems || []
    lite.problems.push( "extraneous: "
                      + data.name + "@" + data.version
                      + " " + (data.path || "") )
  }

  if (data._from)
    lite.from = data._from

  if (data._resolved)
    lite.resolved = data._resolved

  if (data.invalid) {
    lite.invalid = true
    lite.problems = lite.problems || []
    lite.problems.push( "invalid: "
                      + data.name + "@" + data.version
                      + " " + (data.path || "") )
  }

  if (data.peerInvalid) {
    lite.peerInvalid = true
    lite.problems = lite.problems || []
    lite.problems.push( "peer invalid: "
                      + data.name + "@" + data.version
                      + " " + (data.path || "") )
  }

  if (data.dependencies) {
    var deps = Object.keys(data.dependencies)
    if (deps.length) lite.dependencies = deps.map(function (d) {
      var dep = data.dependencies[d]
      if (typeof dep === "string") {
        lite.problems = lite.problems || []
        var p
        if (data.depth > maxDepth) {
          p = "max depth reached: "
        } else {
          p = "missing: "
        }
        p += d + "@" + dep
          + ", required by "
          + data.name + "@" + data.version
        lite.problems.push(p)
        return [d, { required: dep, missing: true }]
      }
      return [d, getLite(dep, true)]
    }).reduce(function (deps, d) {
      if (d[1].problems) {
        lite.problems = lite.problems || []
        lite.problems.push.apply(lite.problems, d[1].problems)
      }
      deps[d[0]] = d[1]
      return deps
    }, {})
  }
  return lite
}

function bfsify (root, args, current, queue, seen) {
  // walk over the data, and turn it from this:
  // +-- a
  // |   `-- b
  // |       `-- a (truncated)
  // `--b (truncated)
  // into this:
  // +-- a
  // `-- b
  // which looks nicer
  args = args || []
  current = current || root
  queue = queue || []
  seen = seen || [root]
  var deps = current.dependencies = current.dependencies || {}
  Object.keys(deps).forEach(function (d) {
    var dep = deps[d]
    if (typeof dep !== "object") return
    if (seen.indexOf(dep) !== -1) {
      if (npm.config.get("parseable") || !npm.config.get("long")) {
        delete deps[d]
        return
      } else {
        dep = deps[d] = Object.create(dep)
        dep.dependencies = {}
      }
    }
    queue.push(dep)
    seen.push(dep)
  })

  if (!queue.length) {
    // if there were args, then only show the paths to found nodes.
    return filterFound(root, args)
  }
  return bfsify(root, args, queue.shift(), queue, seen)
}

function filterFound (root, args) {
  if (!args.length) return root
  var deps = root.dependencies
  if (deps) Object.keys(deps).forEach(function (d) {
    var dep = filterFound(deps[d], args)

    // see if this one itself matches
    var found = false
    for (var i = 0; !found && i < args.length; i ++) {
      if (d === args[i][0]) {
        found = semver.satisfies(dep.version, args[i][1], true)
      }
    }
    // included explicitly
    if (found) dep._found = true
    // included because a child was included
    if (dep._found && !root._found) root._found = 1
    // not included
    if (!dep._found) delete deps[d]
  })
  if (!root._found) root._found = false
  return root
}

function makeArchy (data, long, dir) {
  var out = makeArchy_(data, long, dir, 0)
  return archy(out, "", { unicode: npm.config.get("unicode") })
}

function makeArchy_ (data, long, dir, depth, parent, d) {
  if (typeof data === "string") {
    if (depth -1 <= npm.config.get("depth")) {
      // just missing
      var unmet = "UNMET DEPENDENCY"
      if (npm.color) {
        unmet = color.bgBlack(color.red(unmet))
      }
      data = unmet + " " + d + "@" + data
    } else {
      data = d+"@"+ data
    }
    return data
  }

  var out = {}
  // the top level is a bit special.
  out.label = data._id || ""
  if (data._found === true && data._id) {
    if (npm.color) {
      out.label = color.bgBlack(color.yellow(out.label.trim())) + " "
    } else {
      out.label = out.label.trim() + " "
    }
  }
  if (data.link) out.label += " -> " + data.link

  if (data.invalid) {
    if (data.realName !== data.name) out.label += " ("+data.realName+")"
    var invalid = "invalid"
    if (npm.color) invalid = color.bgBlack(color.red(invalid))
    out.label += " " + invalid
  }

  if (data.peerInvalid) {
    var peerInvalid = "peer invalid"
    if (npm.color) peerInvalid = color.bgBlack(color.red(peerInvalid))
    out.label += " " + peerInvalid
  }

  if (data.extraneous && data.path !== dir) {
    var extraneous = "extraneous"
    if (npm.color) extraneous = color.bgBlack(color.green(extraneous))
    out.label += " " + extraneous
  }

  // add giturl to name@version
  if (data._resolved) {
    if (npa(data._resolved).type === "git")
      out.label += " (" + data._resolved + ")"
  }

  if (long) {
    if (dir === data.path) out.label += "\n" + dir
    out.label += "\n" + getExtras(data, dir)
  } else if (dir === data.path) {
    if (out.label) out.label += " "
    out.label += dir
  }

  // now all the children.
  out.nodes = []
  if (depth <= npm.config.get("depth")) {
    out.nodes = Object.keys(data.dependencies || {})
      .sort(alphasort).map(function (d) {
        return makeArchy_(data.dependencies[d], long, dir, depth + 1, data, d)
      })
  }

  if (out.nodes.length === 0 && data.path === dir) {
    out.nodes = ["(empty)"]
  }

  return out
}

function getExtras (data) {
  var extras = []

  if (data.description) extras.push(data.description)
  if (data.repository) extras.push(data.repository.url)
  if (data.homepage) extras.push(data.homepage)
  if (data._from) {
    var from = data._from
    if (from.indexOf(data.name + "@") === 0) {
      from = from.substr(data.name.length + 1)
    }
    var u = url.parse(from)
    if (u.protocol) extras.push(from)
  }
  return extras.join("\n")
}


function makeParseable (data, long, dir, depth, parent, d) {
  depth = depth || 0

  return [ makeParseable_(data, long, dir, depth, parent, d) ]
  .concat(Object.keys(data.dependencies || {})
    .sort(alphasort).map(function (d) {
      return makeParseable(data.dependencies[d], long, dir, depth + 1, data, d)
    }))
  .filter(function (x) { return x })
  .join("\n")
}

function makeParseable_ (data, long, dir, depth, parent, d) {
  if (data.hasOwnProperty("_found") && data._found !== true) return ""

  if (typeof data === "string") {
    if (data.depth < npm.config.get("depth")) {
      data = npm.config.get("long")
           ? path.resolve(parent.path, "node_modules", d)
           + ":"+d+"@"+JSON.stringify(data)+":INVALID:MISSING"
           : ""
    } else {
      data = path.resolve(data.path || "", "node_modules", d || "")
           + (npm.config.get("long")
             ? ":" + d + "@" + JSON.stringify(data)
             + ":" // no realpath resolved
             + ":MAXDEPTH"
             : "")
    }

    return data
  }

  if (!npm.config.get("long")) return data.path

  return data.path
       + ":" + (data._id || "")
       + ":" + (data.realPath !== data.path ? data.realPath : "")
       + (data.extraneous ? ":EXTRANEOUS" : "")
       + (data.invalid ? ":INVALID" : "")
       + (data.peerInvalid ? ":PEERINVALID" : "")
}
