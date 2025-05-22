// File: api/mcp-generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Define the base URL for your NLP Router API
const NLP_ROUTER_API_URL = process.env.NLP_ROUTER_API_URL || 'http://localhost:4000/api/ask';

// Define interfaces for type safety
interface NlpRequest {
  query: string;
}

interface NlpResponse {
  queryType: 'GENERAL_QUESTION' | 'TOOL_REQUEST' | 'ERROR';
  response: string;
  raw_data?: any;
  tool_used?: string;
  action_used?: string;
  note?: string;
  error?: string;
}

/**
 * POST handler for the MCP (Master Control Program) Generate API route
 * This route receives user queries and forwards them to the NLP Router Tool
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json() as NlpRequest;
    
    // Validate the required query parameter
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Call the NLP Router Tool via handleQuery endpoint
    const response = await axios.post<NlpResponse>(`${NLP_ROUTER_API_URL}`, {
      query: body.query
    });

    // Enhance the response with additional metadata for the client
    const enhancedResponse = {
      ...response.data,
      metadata: {
        processed_at: new Date().toISOString(),
        service: 'mcp-generate',
        version: '1.0.0'
      }
    };

    // Return the response with appropriate headers
    return NextResponse.json(enhancedResponse, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
    
  } catch (error) {
    console.error('MCP Generate API error:', error);
    
    // Determine if it's an Axios error with a response
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { 
          queryType: 'ERROR',
          response: 'Error from NLP service',
          error: error.response.data?.error || error.message,
          status: error.response.status
        },
        { status: error.response.status }
      );
    }
    
    // Generic error handling
    return NextResponse.json(
      { 
        queryType: 'ERROR',
        response: 'An unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}