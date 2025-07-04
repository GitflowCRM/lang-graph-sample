# LangChain + LangGraph Chatbot

A full-stack chatbot built with NestJS, LangChain, LangGraph, and OpenAI-compatible models. Features:
- Natural language chat with LLMs
- Database integration (PostgreSQL, TypeORM)
- Tool calling (SQL, analytics, custom tools)
- Streaming and non-streaming endpoints
- Swagger API docs
- Docker Compose for local dev

---

## Features
- **Chat with LLMs**: Uses OpenAI-compatible models (e.g., Qwen, Command R)
- **Database Tools**: Query, list, and analyze data from a Postgres database
- **Custom Tools**: Easily add new tools (e.g., `say_aloha`)
- **Streaming Support**: Real-time responses via SSE
- **Swagger Docs**: Interactive API documentation
- **TypeORM**: Type-safe database access
- **LangGraph**: Workflow orchestration and tool chaining

---

## Quick Start

### 1. Clone & Install
```bash
git clone <repo-url>
cd langchain-chatbot
bun install
```

### 2. Start Database
```bash
docker-compose up -d
```

### 3. Configure Environment
Create a `.env` file:
```
OPENAI_API_KEY=your_openai_api_key_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=langchain_chatbot
DB_USER=langchain_user
DB_PASSWORD=langchain_password
```

### 4. Start the App
```bash
bun run start:dev
```

---

## API Usage

### Chat Endpoint
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "List all products in the database."}'
```

### Streaming Chat
```bash
curl -N -X POST http://localhost:3000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me product analytics."}'
```

### Swagger Docs
Visit [http://localhost:3000/api](http://localhost:3000/api)

---

## Tools Available
- `query_database` — Run raw SQL
- `list_tables` — List all tables
- `get_table_info` — Table schema
- `get_sample_data` — Table preview
- `get_product_analytics` — Analytics view
- `get_order_summary` — Orders view
- `get_users`, `get_products`, `get_orders`, `get_reviews` — TypeORM repo tools
- `search_products` — Filter/search products
- `say_aloha` — Returns a friendly greeting (for tool chaining test)

---

## Project Structure
```
src/
  chat/         # Chat controller/service
  database/     # DB service, entities, tools
  ...
```

---

## Development
- **Add new tools**: Implement a class extending `Tool` and add to `getAllTools()`
- **Add new endpoints**: Use NestJS controllers
- **Change models**: Update in `chat.service.ts`
- **Migrations**: Use TypeORM CLI

---

## Credits
- Built with [NestJS](https://nestjs.com/), [LangChain](https://js.langchain.com/), [LangGraph](https://js.langchain.com/docs/langgraph), [TypeORM](https://typeorm.io/), [OpenAI-compatible LLMs](https://platform.openai.com/docs/models)

---

## License
MIT
