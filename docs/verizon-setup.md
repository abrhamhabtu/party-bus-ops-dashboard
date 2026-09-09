# Verizon connection boundary

The command center is a demo. Its Integration screen exposes a real, server-side **access check**, not a live telemetry feed. Successful authentication does not change vehicle positions or camera status.

## Implemented

- Fixed US Reveal API host with separate server-only REST credentials and app ID.
- Token caching below the documented 20-minute lifetime.
- Optional GET location check for one configured vehicle number.
- Operator-key authorization, same-origin browser checks, three-minute cooldown and concurrent-request deduplication.
- Credential and provider-response redaction. No browser storage of integration credentials.
- Visible setup readiness, last check result, and disconnected camera state.

## Account-dependent work

Obtain authorized API credentials through Reveal Marketplace, confirm whether the account uses Reveal or another Verizon platform, validate the location payload schema and timestamps, and map provider vehicle numbers to the internal roster. Add real authenticated user roles, persistent ingestion and audit records, stale-data handling, and operational monitoring before enabling live mode. API access does not imply permission to retrieve or stream road-facing or driver-facing camera media.

The included Node server serves the built demo and API on loopback. It is not a complete production account service. Static hosting keeps the demo functional but cannot run these diagnostics.

See the root README for environment variables, commands and official provider references. No live Verizon account has been used to validate this integration.
