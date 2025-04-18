FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Set up environment variables
ENV PATH="/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:${PATH}"
ENV RUST_VERSION=1.81.0
ENV SOLANA_VERSION=1.18.26
ENV ANCHOR_VERSION=0.29.0
ENV NODE_VERSION=16.x

# Install basic dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    libudev-dev \
    git \
    python3 \
    python3-pip \
    wget \
    gnupg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION} | bash - \
    && apt-get install -y nodejs \
    && npm install -g yarn

RUN npm install -g http-server
# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain ${RUST_VERSION} \
    && . $HOME/.cargo/env \
    && rustup component add rustfmt clippy

# Install Solana CLI
RUN sh -c "$(curl -sSfL https://release.solana.com/v${SOLANA_VERSION}/install)" \
    && solana --version

# Install Anchor Framework
RUN cargo install --git https://github.com/coral-xyz/anchor --tag v${ANCHOR_VERSION} anchor-cli --force \
    && anchor --version

# Create working directory
WORKDIR /app

# Copy project files
COPY . .

# Set up Solana config for devnet
RUN mkdir -p /root/.config/solana \
    && solana-keygen new --no-bip39-passphrase -o /root/.config/solana/id.json --force \
    && solana config set --url devnet

# Expose ports
EXPOSE 8080 3000

# Default command to show help
CMD ["bash", "-c", "cd /app/simple-frontend && http-server -p 3000 & echo 'Frontend available at http://localhost:3000' && echo 'Solana Bonding Curve Development Environment' && echo 'Available commands:' && echo '  - anchor build: Build the program' && echo '  - anchor test: Run tests' && echo '  - anchor deploy: Deploy to devnet' && echo '  - solana airdrop 2: Get SOL for testing' && bash"]
