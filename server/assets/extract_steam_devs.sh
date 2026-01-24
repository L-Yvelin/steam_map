#!/bin/bash
for f in .cache/steam/*.json; do
  jq -r '.[].data.developers[]?' "$f" 2>/dev/null
done | sort | uniq -c | sort -rn | jq -R -r 'capture("^ *(?<a>[0-9]+) (?<n>.*)$") | [.n, .a] | @csv' > server/assets/steam_devs_frequency.csv
