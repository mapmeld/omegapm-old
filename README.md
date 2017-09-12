Ωpm -- a JavaScript package manager

NPM variant with signed packages and identical builds - see <a href="http://omegapm.org">OmegaPM.org</a>

https://gist.github.com/mapmeld/7eb3b213358b55b74bdf

==============================

[![Greenkeeper badge](https://badges.greenkeeper.io/mapmeld/omegapm-old.svg)](https://greenkeeper.io/)
[![Build Status](https://img.shields.io/travis/mapmeld/omegapm/master.svg)](https://travis-ci.org/mapmeld/omegpam)
## SYNOPSIS

This is just enough info to get you up and running.

Much more info available via `omegapm help` once it's installed.

## IMPORTANT

**You need node v0.8 or higher to run this program.**

## Installing

Install Ωpm with NPM

    npm install omegapm -g

Also install Keybase (you don't need to be a Keybase member)

    npm install keybase-installer -g
    keybase-installer
    keybase config

## Getting modules

As of 0.0.5, Ωpm still installs from npmjs.org and public git repos, just without
running scripts during the publish or install process.

On install, Ωpm attempts to run 'keybase dir verify' on the package.

    omegapm install omega-sqrt
    Ωpm install omega-sqrt

## Publishing modules

Your module must be all-JavaScript and require no additional scripts in the install process.

If you are publishing a module, you need to have a GPG key. You can create one on the command line with
```gpg --gen-key```

Run ```keybase dir sign``` and commit SIGNED.md along with your other files in the repo.
If you are not committing parts of your module, put them in .gitignore and they will also be ignored by
keybase's directory-signing tool.

Go to <a href="http://omegapm.org/packages">omegapm.org/packages</a> and paste in the link to a public
git repo.

## Legal Stuff

"omegapm" is licensed under the same Artistic License as npm.

"npm" and "The npm Registry" are owned by npm, Inc.
All rights reserved.  See the included LICENSE file for more details.

"Node.js" and "node" are trademarks owned by Joyent, Inc.

Modules published on the npm registry are not officially endorsed by
npm, Inc. or the Node.js project.

Data published to the npm registry is not part of npm itself, and is
the sole property of the publisher.  While every effort is made to
ensure accountability, there is absolutely no guarantee, warrantee, or
assertion expressed or implied as to the quality, fitness for a
specific purpose, or lack of malice in any given npm package.

If you have a complaint about a package in the public npm registry,
and cannot [resolve it with the package
owner](https://docs.npmjs.com/misc/disputes), please email
<support@npmjs.com> and explain the situation.

Any data published to The npm Registry (including user account
information) may be removed or modified at the sole discretion of the
npm server administrators.

### In plainer english

npm is the property of npm, Inc.

If you publish something, it's yours, and you are solely accountable
for it.

If other people publish something, it's theirs.

Users can publish Bad Stuff.  It will be removed promptly if reported.
But there is no vetting process for published modules, and you use
them at your own risk.  Please inspect the source.

If you publish Bad Stuff, we may delete it from the registry, or even
ban your account in extreme cases.  So don't do that.

## BUGS

When you find issues, please report them:

* web:
  <https://github.com/mapmeld/omegapm/issues>

Be sure to include *all* of the output from the command that didn't work
as expected.  The `npm-debug.log` file is also helpful to provide.

You can also look for isaacs in #node.js on irc://irc.freenode.net.  He
will no doubt tell you to put the output in a gist or email.

## SEE ALSO

* npm(1)
* npm-faq(7)
* npm-help(1)
* npm-index(7)
