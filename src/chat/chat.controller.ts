import { Controller, Post, Body, Res, Get } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { DatabaseService } from '../database/database.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BaseMessage } from '@langchain/core/messages';

export class ChatDto {
  message: string;
  history?: any[];
}

export class ChatResponseDto {
  response: string;
  followUp?: string;
}

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check database health' })
  @ApiResponse({
    status: 200,
    description: 'Database is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        database: { type: 'string', example: 'connected' },
      },
    },
  })
  async healthCheck() {
    const isConnected = await this.databaseService.testConnection();
    return {
      status: 'healthy',
      database: isConnected ? 'connected' : 'disconnected',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Send a chat message' })
  @ApiBody({
    type: ChatDto,
    description: 'Chat message with optional history',
    examples: {
      basic: {
        summary: 'Basic request',
        value: {
          message: 'Hello, how can you help me?',
        },
      },
      withHistory: {
        summary: 'Request with history',
        value: {
          message: 'What products do you have?',
          history: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi! How can I help you today?' },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Chat response',
    type: ChatResponseDto,
    examples: {
      basic: {
        summary: 'Basic response',
        value: {
          response:
            'Hello! I can help you with various tasks including database queries. What would you like to know?',
        },
      },
      withFollowUp: {
        summary: 'Response with follow-up question',
        value: {
          response:
            'I found 5 products in our database. Would you like me to show you the details?',
          followUp:
            'Would you like to see product reviews or pricing information?',
        },
      },
    },
  })
  async chat(@Body() chatDto: ChatDto): Promise<ChatResponseDto> {
    const history = chatDto.history || [];
    return this.chatService.chat(chatDto.message, history as BaseMessage[]);
  }

  @Post('stream')
  @ApiOperation({ summary: 'Stream chat response using Server-Sent Events' })
  @ApiBody({
    type: ChatDto,
    description: 'Chat message with optional history',
  })
  @ApiResponse({
    status: 200,
    description: 'Streaming chat response',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          example:
            'data: {"type":"content","content":"Hello"}\n\ndata: {"type":"complete","response":"Hello! How can I help you?"}\n\ndata: {"type":"done"}\n\n',
        },
      },
    },
  })
  async streamChat(
    @Body() chatDto: ChatDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    const history = chatDto.history || [];
    await this.chatService.streamChat(
      chatDto.message,
      history as BaseMessage[],
      res,
    );
  }
}
