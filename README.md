# iflow-mcp

Model Context Protocol (MCP) server for iFlow ERP.

## 🚀 Quick Start (10 min)

### 1. Requirements
- Node.js 20+
- iFlow API credentials (Bearer Token)

### 2. Setup
```bash
git clone ...
cd iflow-mcp
npm install
npm run build
```

### 3. Configuration
Copy `.env.example` to `.env` and fill in your credentials.
The server uses environment variables for configuration.

### 4. Client Integration

#### Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "iflow": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "IFLOW_BASE_URL": "...",
        "IFLOW_API_BEARER": "...",
        ...
      }
    }
  }
}
```

#### Cursor / Gemini / ChatGPT
Use the provided examples in the `examples/` directory for your specific client.

## 🛠️ Tools Available
- `list_clients`: All clients list
- `get_client`: Detailed client info
- `list_products`: All products list
- `get_stock`: Real-time stock levels
- `count_orders_in_progress`: Operational snapshot
- `vat_estimate`: Financial preview
- `create_order`: POST new order (requires `IFLOW_READ_ONLY=0`)
- `health`: Check connectivity

## 🛡️ Security
- **Allowlist**: Only configured hosts can be reached.
- **Redaction**: Credentials are automatically removed from logs.
- **Read-Only**: Default state is read-only.
- **Idempotency**: Destructive actions require a client-provided key.

## 📄 License
ISC
