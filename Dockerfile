FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY src ./src
COPY tests ./tests
COPY index.html ./
COPY playwright.config.ts ./

# Build the project
RUN npm run build

# Install only Chromium browser
RUN npx playwright install chromium

# Set environment variables
ENV CI=true
ENV DEBUG=pw:api,pw:webserver

# Command to run tests
CMD xvfb-run --auto-servernum --server-args="-screen 0 1280x720x24" \
    npx playwright test \
    --project=chromium \
    --reporter=list \
    --workers=1