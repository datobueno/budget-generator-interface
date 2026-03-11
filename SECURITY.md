# Security Policy

## Supported Versions

Security fixes are best-effort and are expected to land on the default branch first.

## Reporting a Vulnerability

Do not open a public GitHub issue for suspected vulnerabilities.

Preferred reporting path:

1. Use GitHub private vulnerability reporting for this repository, if it is enabled.
2. If private reporting is not enabled yet, contact the maintainer through the GitHub profile at `https://github.com/datobueno` and request a private disclosure channel.

When reporting, include:
- affected commit, branch, or release
- reproduction steps
- expected impact
- whether credentials or customer data could be exposed

Please do not include real secrets in the report.

## Secrets and Third-Party Credentials

This project is a client-side Vite application. Any `VITE_*` variable is public browser configuration, not a server secret.

Do not commit any of the following:
- `.env.local`
- OAuth client secrets
- refresh tokens
- service-account keys
- private API keys that are not intended for browser use

If you use Google integrations:
- create your own Google Cloud project
- use credentials that are safe for browser clients
- restrict OAuth origins and API-key referrers to your own domains
- rotate credentials immediately if they are exposed
