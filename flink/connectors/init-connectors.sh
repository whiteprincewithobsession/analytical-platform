#!/bin/bash
# Init script: copy connectors to Flink lib directory
echo "=== Flink Connectors Init ==="
if [ -d "/opt/flink/custom-lib" ] && [ "$(ls -A /opt/flink/custom-lib/*.jar 2>/dev/null)" ]; then
    echo "Copying connectors to /opt/flink/lib/..."
    cp /opt/flink/custom-lib/*.jar /opt/flink/lib/
    echo "Connectors installed:"
    ls -1 /opt/flink/custom-lib/*.jar
else
    echo "No custom connectors found, using defaults."
fi
echo "=== Done ==="
