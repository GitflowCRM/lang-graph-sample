import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { DatabaseService } from '../database/database.service';
import { createReactAgent } from '@langchain/langgraph/prebuilt';

interface AgentResult {
  messages: Array<{
    content: string | object;
  }>;
}

@Injectable()
export class ChatService {
  private agent: ReturnType<typeof createReactAgent>;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {
    // Get all database tools (SQL + TypeORM)
    const databaseTools = this.databaseService.getAllTools();

    // Model for the agent
    const model = new ChatOpenAI({
      temperature: 0.1, // Lower temperature for more consistent agent behavior
      model: 'qwen/qwq-32b', // Using OpenAI model instead of qwen
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      configuration: {
        baseURL: 'https://openai.gitflow.ai/v1',
      },
    });

    // Create the agent with tools
    this.agent = createReactAgent({
      llm: model,
      tools: databaseTools,
    });
  }

  async chat(message: string): Promise<{ response: string }> {
    try {
      const result = (await this.agent.invoke({
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      })) as AgentResult;

      const lastMessage = result.messages[result.messages.length - 1];
      const response = lastMessage?.content || '';

      return {
        response:
          typeof response === 'string' ? response : JSON.stringify(response),
      };
    } catch (error) {
      return {
        response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async streamChat(
    message: string,
    history: BaseMessage[] = [],
    res: Response,
  ): Promise<void> {
    const systemPrompt =
      'You are a database assistant. For any question about the contents of the database (such as counts, lists, or details), you must always use the available tools (such as count_rows, list_tables, get_table_info, or query_database) to get the answer. Never guess or make up numbers. If you do not know, use the tools to find out.';

    try {
      // Get the response using the agent
      const result = (await this.agent.invoke({
        messages: [
          new SystemMessage(systemPrompt),
          ...history,
          new HumanMessage(message),
        ],
      })) as AgentResult;

      const lastMessage = result.messages[result.messages.length - 1];
      const response =
        typeof lastMessage?.content === 'string'
          ? lastMessage.content
          : JSON.stringify(lastMessage?.content || '');

      // Stream the response
      res.write(
        `data: ${JSON.stringify({
          type: 'content',
          content: response,
        })}\n\n`,
      );

      // Send the complete response
      res.write(
        `data: ${JSON.stringify({
          type: 'complete',
          response: response,
        })}\n\n`,
      );

      // End the stream
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`,
      );
      res.end();
    }
  }
}
