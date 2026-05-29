#!/bin/bash
sops --decrypt .env.enc.staging >> "$CLAUDE_ENV_FILE"