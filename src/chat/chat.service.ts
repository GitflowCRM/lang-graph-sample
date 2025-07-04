import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { StateGraph, END } from '@langchain/langgraph';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { DatabaseService } from '../database/database.service';

// Define the state of our graph
interface ChatState {
  messages: BaseMessage[];
  nextQuestion?: string;
}

@Injectable()
export class ChatService {
  private model: ChatOpenAI;
  private streamModel: ChatOpenAI;
  private workflow: ReturnType<typeof StateGraph.prototype.compile>;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {
    // Get all database tools (SQL + TypeORM)
    const databaseTools = this.databaseService.getAllTools();

    // Model for regular chat (optimized for accuracy) with database tools
    const baseModel = new ChatOpenAI({
      temperature: 0.1, // Lower temperature for more consistent agent behavior
      // model: 'qwen/qwq-32b', // Command R model for better reasoning
      model: 'c4ai-command-r-v01',
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      configuration: {
        baseURL: 'https://openai.gitflow.ai/v1',
      },
    });

    this.model = baseModel.bindTools(databaseTools) as ChatOpenAI;

    // Model for streaming (optimized for speed) with database tools
    const streamBaseModel = new ChatOpenAI({
      temperature: 0.3, // Slightly higher for more natural streaming responses
      // model: 'qwen/qwq-32b', // Smaller, faster model for streaming
      model: 'c4ai-command-r-v01',
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      configuration: {
        baseURL: 'https://openai.gitflow.ai/v1',
      },
    });
    this.streamModel = streamBaseModel.bindTools(databaseTools) as ChatOpenAI;

    // Define the graph
    this.workflow = new StateGraph<ChatState>({
      channels: {
        messages: {
          reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
          default: () => [],
        },
        nextQuestion: {
          value: (x: string | undefined, y: string | undefined) => y,
          default: () => undefined,
        },
      },
    })
      .addNode('chatbot', async (state: ChatState) => {
        const response = await this.model.invoke(state.messages);
        // Check for tool calls in the response
        interface ToolCall {
          name: string;
          args?: { input?: string };
          type: string;
          id: string;
        }
        const toolCalls = (response as { tool_calls?: ToolCall[] }).tool_calls;
        if (toolCalls && toolCalls.length > 0) {
          const toolCallRaw = toolCalls[0];
          if (toolCallRaw && typeof toolCallRaw.name === 'string') {
            const toolName: string = toolCallRaw.name;
            const toolArgs: { input?: string } = toolCallRaw.args || {};
            const tool = this.databaseService
              .getAllTools()
              .find(
                (t: {
                  name: string;
                  _call: (input?: string) => Promise<string>;
                }) => t.name === toolName,
              );
            if (tool) {
              const toolResult = await tool._call(toolArgs.input ?? '');
              return {
                messages: [
                  {
                    content: toolResult,
                    role: 'assistant',
                  },
                ],
              };
            }
          }
        }
        // Default: return the model's response as before
        return { messages: [response] };
      })
      .addEdge('__start__', 'chatbot')
      .addEdge('chatbot', END)
      .compile();
  }

  async chat(
    message: string,
    history: BaseMessage[] = [],
  ): Promise<{ response: string; followUp?: string }> {
    const initialState: ChatState = {
      messages: [...history, new HumanMessage(message)],
    };

    const result = (await this.workflow.invoke(initialState)) as ChatState;

    const lastMessage = result.messages[result.messages.length - 1];
    const response =
      typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    return { response };
  }

  async streamChat(
    message: string,
    history: BaseMessage[] = [],
    res: Response,
  ): Promise<void> {
    const initialState: ChatState = {
      messages: [...history, new HumanMessage(message)],
    };

    try {
      // Stream the main response using the streaming model
      const stream = await this.streamModel.stream(initialState.messages);

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.content;
        if (typeof content === 'string' && content) {
          fullResponse += content;
          res.write(
            `data: ${JSON.stringify({
              type: 'content',
              content: content,
            })}\n\n`,
          );
        }
      }

      // Send the complete response
      res.write(
        `data: ${JSON.stringify({
          type: 'complete',
          response: fullResponse,
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
