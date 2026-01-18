---
name: evidence
description: Gov ZIP 증빙 패키지 생성 및 검증 작업
triggers:
  - evidence
  - 증빙
  - gov zip
  - manifest
---

# Qetta 증빙 (Evidence) Skill

## 목적
정부 제출용 증빙 패키지 (Gov ZIP) 생성 및 검증

## 핵심 원칙
- **MANIFEST v1.2** 스펙 준수
- **SHA-256** 해시 무결성 검증
- **정본 데이터** 기반 (events, actions 테이블)

## 파이프라인
```
📡 OTT Chip → 🔄 정규화 → 💾 정본 저장 → 📋 Gov ZIP
```

## 주요 파일
- `src/lib/govzip/` - Gov ZIP 생성기
- `src/lib/govzip/manifest.ts` - MANIFEST 빌더
- `src/lib/govzip/events-csv.ts` - 이벤트 CSV 빌더
- `src/lib/govzip/actions-csv.ts` - 액션 CSV 빌더

## Gov ZIP 구조
```
gov_package_YYYY-MM.zip
├── MANIFEST.json      # 무결성 검증 (SHA-256)
├── events.csv         # 설비 상태 기록 (MVTS)
├── actions.csv        # 조치 이력
├── report.pdf         # 리포트
└── photos/            # 조치 사진
```

## 작업 시 체크리스트
1. [ ] `evidence_snapshots` 테이블 조회
2. [ ] 기간 데이터 정합성 확인
3. [ ] MANIFEST 해시 계산
4. [ ] 패키지 해시 검증
5. [ ] 보관 기간 (retention_until) 확인

## API 엔드포인트
- `POST /api/evidence` - 증빙 생성
- `POST /api/evidence/verify` - 검증

## 관련 테이블
- `events` - MVTS (Machine Value Time Series)
- `actions` - 조치 이력
- `evidence_snapshots` - 증빙 스냅샷 (불변)
