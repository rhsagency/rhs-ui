# Security policy

RHS UI ships UI source code that you copy into your own project. It has no
server, no network layer and reads no environment variables, so the attack
surface is the components themselves: rendering untrusted content, focus and
keyboard handling, and the dependencies an item declares.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Email **security@rhsagency.nl** with:

- the item name and version (`meta.version` in the registry JSON, or the git tag)
- a description of the problem and, if you can, a minimal reproduction
- whether you believe it is already being exploited

You will get an acknowledgement within 3 working days and a fix or a clear
statement within 14 days. We credit reporters in the changelog unless they ask
not to be named.

## Scope

In scope: everything under `registry/` and `public/r/` in this repository.

Out of scope: rhsui.com itself and the Pro registry (report those to the same
address; they are handled separately), and vulnerabilities in third-party
packages an item depends on (report those upstream, and tell us so we can bump
the version).
