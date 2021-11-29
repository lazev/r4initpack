#!/bin/bash
find . -type f -exec chmod 644 {} +
find . -type d -exec chmod 600 {} +
find . -type d -exec chmod +x {} +
chmod +x ./_vendor/r4/utils/*