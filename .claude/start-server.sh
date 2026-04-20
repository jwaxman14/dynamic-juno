#!/bin/bash
cd /Users/jacobwaxman/Documents/Claude/Projects/DynamicJuno
export PYTHONDONTWRITEBYTECODE=1
exec python3 -m uvicorn server:app --host 127.0.0.1 --port 8000 --http httptools --loop asyncio 2>&1
