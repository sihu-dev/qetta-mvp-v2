/**
 * Qetta MCP Server
 * Evidence Registry & Tech Combiner Tools
 *
 * @description Claude Code용 MCP 서버
 * @version 1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { createClient } from '@supabase/supabase-js';
import { evidenceTools, handleEvidenceTool } from './tools/evidence.js';
import { analysisTools, handleAnalysisTool } from './tools/analysis.js';
import { documentTools, handleDocumentTool } from './tools/documents.js';
import { techTools, handleTechTool } from './tools/techstack.js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// MCP 서버 생성
const server = new Server(
  {
    name: 'qetta-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// 모든 도구 목록
const allTools = [...evidenceTools, ...analysisTools, ...documentTools, ...techTools];

// 도구 목록 핸들러
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools };
});

// 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Evidence 도구
    if (name.startsWith('evidence_')) {
      return await handleEvidenceTool(name, args, supabase);
    }

    // Analysis 도구
    if (name.startsWith('analysis_')) {
      return await handleAnalysisTool(name, args, supabase);
    }

    // Document 도구
    if (name.startsWith('document_')) {
      return await handleDocumentTool(name, args, supabase);
    }

    // Tech 도구
    if (name.startsWith('tech_')) {
      return await handleTechTool(name, args);
    }

    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// 리소스 목록 핸들러
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'qetta://schema/manifest-v1.2',
        name: 'MANIFEST v1.2 Schema',
        description: 'Gov ZIP MANIFEST v1.2 스키마 정의',
        mimeType: 'application/json',
      },
      {
        uri: 'qetta://schema/database',
        name: 'Database Schema',
        description: 'Qetta v4.0 데이터베이스 스키마',
        mimeType: 'application/json',
      },
      {
        uri: 'qetta://config/brand',
        name: 'Brand Guidelines',
        description: 'Qetta 브랜딩 가이드라인',
        mimeType: 'application/json',
      },
    ],
  };
});

// 리소스 읽기 핸들러
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'qetta://schema/manifest-v1.2') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              manifest_version: '1.2',
              required_fields: ['manifest_version', 'org_id', 'created_at', 'period', 'counts', 'files', 'package_hash'],
              counts: {
                events: 'number (required)',
                actions: 'number (required)',
                alarms: 'number (required in v1.2)',
              },
              files: {
                note: 'MANIFEST.json is excluded from files array',
                fields: ['name', 'hash', 'size'],
              },
              retention_hint: {
                years: 'number',
                note: 'string (v1.2 format)',
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (uri === 'qetta://config/brand') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              name: 'Qetta',
              slogan: 'in·ev·it·able',
              tagline: 'Data Flows. Evidence Follows.',
              colors: {
                primary: '#9333ea',
                secondary: '#a855f7',
                background: '#faf5ff',
              },
              terminology: {
                approved: '변조 탐지 가능 (tamper-evident)',
                prohibited: '위조 불가능 (tamper-proof)',
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  return {
    contents: [
      {
        uri,
        mimeType: 'text/plain',
        text: `Resource not found: ${uri}`,
      },
    ],
  };
});

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Qetta MCP Server started');
}

main().catch(console.error);
