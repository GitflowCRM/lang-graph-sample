import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage } from '@langchain/core/messages';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { DatabaseService } from '../database/database.service';
import { MessagesAnnotation } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { Tool } from '@langchain/core/tools';

interface AgentResult {
  messages: Array<{
    content: string | object;
  }>;
}

@Injectable()
export class ChatService {
  private model: ChatOpenAI;
  private databaseTools: Tool[];
  private agent: ReturnType<typeof createReactAgent>;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {
    // Get all database tools (SQL + TypeORM)
    this.databaseTools = this.databaseService.getAllTools();

    // Model for the agent
    this.model = new ChatOpenAI({
      temperature: 0.1,
      model: 'qwen/qwq-32b',
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      configuration: {
        baseURL: 'https://openai.gitflow.ai/v1',
      },
    });

    // Create regular agent for non-streaming
    this.agent = createReactAgent({
      llm: this.model,
      tools: this.databaseTools,
    });
  }

  private async callModel(state: typeof MessagesAnnotation.State) {
    // Bind tools to the model for streaming
    const modelWithTools = this.model.bindTools(this.databaseTools);
    const response = await modelWithTools.invoke(state.messages);
    return { messages: [response] };
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
    console.log('history', history);
    try {
      // Send initial thinking message
      res.write(
        `data: ${JSON.stringify({
          type: 'content',
          content: '🤔 Processing your request...',
        })}\n\n`,
      );

      // Use the non-streaming agent to get the complete response with proper tool handling
      const result = (await this.agent.invoke({
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      })) as AgentResult;

      // Stream the final response character by character to simulate real streaming
      const lastMessage = result.messages[result.messages.length - 1];
      const response = lastMessage?.content || '';
      const finalResponse =
        typeof response === 'string' ? response : JSON.stringify(response);

      // Stream the response character by character
      for (let i = 0; i < finalResponse.length; i++) {
        res.write(
          `data: ${JSON.stringify({
            type: 'content',
            content: finalResponse[i],
          })}\n\n`,
        );
      }

      // End the stream
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Streaming error:', error);
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
