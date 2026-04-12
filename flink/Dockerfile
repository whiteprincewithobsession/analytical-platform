FROM flink:1.18.1-scala_2.12-java11

# Install Python 3 + pip
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Create symlink for python
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Install PyFlink (matches Flink 1.18.1)
ENV PIP_ROOT_ACTION=ignore
RUN pip3 install --no-cache-dir apache-flink==1.18.1

# Copy init script
COPY connectors/init-connectors.sh /docker-entrypoint-initdb.d/
RUN chmod +x /docker-entrypoint-initdb.d/init-connectors.sh

# Create results directory
RUN mkdir -p /opt/flink/results && chmod 777 /opt/flink/results

# Create jobs directory
RUN mkdir -p /opt/flink/jobs
