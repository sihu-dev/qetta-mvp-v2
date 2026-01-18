/**
 * Audit Logger
 * 불변 감사 로그 시스템
 * 누가/언제/무엇을 기록
 */

import { createClient } from '@/lib/supabase/server';

// =============================================================================
// 타입 정의
// =============================================================================

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'DOWNLOAD'
  | 'UPLOAD'
  | 'VERIFY'
  | 'EXPORT'
  | 'ANALYZE'
  | 'GENERATE';

export type AuditResource =
  | 'evidence'
  | 'tender'
  | 'proposal'
  | 'user'
  | 'organization'
  | 'api_key'
  | 'document'
  | 'system';

export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  outcome: 'success' | 'failure';
  errorMessage?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  outcome?: 'success' | 'failure';
  limit?: number;
  offset?: number;
}

// =============================================================================
// Audit Logger
// =============================================================================

export class AuditLogger {
  private buffer: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private bufferSize = 100;
  private flushIntervalMs = 5000;

  constructor() {
    // 주기적으로 버퍼 플러시
    if (typeof window === 'undefined') {
      this.flushInterval = setInterval(() => this.flush(), this.flushIntervalMs);
    }
  }

  /**
   * 감사 로그 기록
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // 콘솔 로그 (개발용)
    console.log('[AUDIT]', JSON.stringify(logEntry));

    // 버퍼에 추가
    this.buffer.push(logEntry);

    // 버퍼가 가득 차면 플러시
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  /**
   * 성공 로그 헬퍼
   */
  async success(
    action: AuditAction,
    resource: AuditResource,
    context: {
      userId?: string;
      userEmail?: string;
      resourceId?: string;
      details?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.log({
      ...context,
      action,
      resource,
      outcome: 'success',
    });
  }

  /**
   * 실패 로그 헬퍼
   */
  async failure(
    action: AuditAction,
    resource: AuditResource,
    errorMessage: string,
    context: {
      userId?: string;
      userEmail?: string;
      resourceId?: string;
      details?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.log({
      ...context,
      action,
      resource,
      outcome: 'failure',
      errorMessage,
    });
  }

  /**
   * 버퍼 플러시 (DB에 저장)
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      const supabase = await createClient();

      // audit_logs 테이블에 배치 삽입
      const { error } = await supabase
        .from('audit_logs')
        .insert(entries.map((e) => ({
          user_id: e.userId,
          user_email: e.userEmail,
          action: e.action,
          resource: e.resource,
          resource_id: e.resourceId,
          details: e.details,
          ip_address: e.ipAddress,
          user_agent: e.userAgent,
          outcome: e.outcome,
          error_message: e.errorMessage,
          created_at: e.timestamp,
        })));

      if (error) {
        // DB 에러 시 콘솔에 보관
        console.error('[AUDIT] Flush error:', error);
        // 다시 버퍼에 추가 (재시도)
        this.buffer = [...entries, ...this.buffer];
      }
    } catch (error) {
      console.error('[AUDIT] Flush exception:', error);
      // 에러 시 로컬 파일에 백업 (서버 환경) - fire and forget
      void this.backupToFile(entries);
    }
  }

  /**
   * 감사 로그 조회
   */
  async query(filter: AuditLogFilter): Promise<AuditLogEntry[]> {
    try {
      const supabase = await createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }
      if (filter.action) {
        query = query.eq('action', filter.action);
      }
      if (filter.resource) {
        query = query.eq('resource', filter.resource);
      }
      if (filter.resourceId) {
        query = query.eq('resource_id', filter.resourceId);
      }
      if (filter.outcome) {
        query = query.eq('outcome', filter.outcome);
      }
      if (filter.startDate) {
        query = query.gte('created_at', filter.startDate);
      }
      if (filter.endDate) {
        query = query.lte('created_at', filter.endDate);
      }
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AUDIT] Query error:', error);
        return [];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || []).map((row: any) => ({
        id: row.id,
        timestamp: row.created_at,
        userId: row.user_id,
        userEmail: row.user_email,
        action: row.action as AuditAction,
        resource: row.resource as AuditResource,
        resourceId: row.resource_id,
        details: row.details,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        outcome: row.outcome as 'success' | 'failure',
        errorMessage: row.error_message,
      }));
    } catch (error) {
      console.error('[AUDIT] Query exception:', error);
      return [];
    }
  }

  /**
   * 정부 제출용 감사 리포트 생성
   */
  async generateReport(
    startDate: string,
    endDate: string
  ): Promise<string> {
    const logs = await this.query({
      startDate,
      endDate,
      limit: 10000,
    });

    const actionCounts: Record<string, number> = {};
    const resourceCounts: Record<string, number> = {};
    const successCount = logs.filter((l) => l.outcome === 'success').length;
    const failureCount = logs.filter((l) => l.outcome === 'failure').length;

    for (const log of logs) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
    }

    return `
# 감사 로그 리포트

## 기간
- **시작**: ${new Date(startDate).toLocaleDateString('ko-KR')}
- **종료**: ${new Date(endDate).toLocaleDateString('ko-KR')}

## 요약
- **총 로그 수**: ${logs.length}건
- **성공**: ${successCount}건 (${((successCount / logs.length) * 100).toFixed(1)}%)
- **실패**: ${failureCount}건 (${((failureCount / logs.length) * 100).toFixed(1)}%)

## 활동별 현황
${Object.entries(actionCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([action, count]) => `- ${action}: ${count}건`)
  .join('\n')}

## 리소스별 현황
${Object.entries(resourceCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([resource, count]) => `- ${resource}: ${count}건`)
  .join('\n')}

## 최근 실패 기록
${logs
  .filter((l) => l.outcome === 'failure')
  .slice(0, 10)
  .map((l) => `- [${new Date(l.timestamp).toLocaleString('ko-KR')}] ${l.action} ${l.resource}: ${l.errorMessage}`)
  .join('\n') || '없음'}

---
*Generated by Qetta Audit Logger*
*전자정부법 제27조 준수*
    `.trim();
  }

  /**
   * 파일 백업 (DB 실패 시)
   */
  private async backupToFile(entries: AuditLogEntry[]): Promise<void> {
    if (typeof window !== 'undefined') return;

    try {
      // Dynamic imports for Node.js modules (server-side only)
      const fs = await import('fs');
      const path = await import('path');
      const backupDir = path.join(process.cwd(), 'logs', 'audit');

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const filename = `audit-${new Date().toISOString().split('T')[0]}.jsonl`;
      const filepath = path.join(backupDir, filename);

      const lines = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
      fs.appendFileSync(filepath, lines);

      console.log(`[AUDIT] Backed up ${entries.length} entries to ${filepath}`);
    } catch (error) {
      console.error('[AUDIT] Backup to file failed:', error);
    }
  }

  /**
   * 정리 (서버 종료 시)
   */
  async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
  }
}

// =============================================================================
// Factory
// =============================================================================

let instance: AuditLogger | null = null;

export function getAuditLogger(): AuditLogger {
  if (!instance) {
    instance = new AuditLogger();
  }
  return instance;
}

// =============================================================================
// 헬퍼 함수
// =============================================================================

export async function auditLog(
  action: AuditAction,
  resource: AuditResource,
  context: {
    userId?: string;
    userEmail?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    outcome?: 'success' | 'failure';
    errorMessage?: string;
  }
): Promise<void> {
  const logger = getAuditLogger();
  await logger.log({
    action,
    resource,
    outcome: context.outcome || 'success',
    ...context,
  });
}
