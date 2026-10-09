#!/usr/bin/env python3
"""Replace every `change-me...` placeholder in an env file with a strong random secret."""
import re, secrets, sys, pathlib

LENGTHS = {
    "MONGO_ROOT_PASSWORD": 32,
    "MONGO_APP_PASSWORD": 32,
    "JWT_ACCESS_SECRET": 64,
    "JWT_REFRESH_SECRET": 64,
    "IP_HASH_SALT": 32,
    "ADMIN_PASSWORD": 20,
}

path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".env")
lines = path.read_text().splitlines()
out = []
for line in lines:
    m = re.match(r"^([A-Z0-9_]+)=(.*)$", line)
    if m and m.group(2).startswith("change-me"):
        key = m.group(1)
        out.append(f"{key}={secrets.token_urlsafe(LENGTHS.get(key, 32))[:LENGTHS.get(key, 32)]}")
    else:
        out.append(line)
path.write_text("\n".join(out) + "\n")
