# DashTag 전체 기능 연동 요청서 — 프론트 선구현 계약 v0.1

작성: 2026-11-09. 대상 서버: `https://dashtag.duckdns.org`.

**이 문서의 추가 API·필드·권한·제한·WebSocket 메시지는 프론트가 먼저 구현한 제안입니다. 백엔드 배포 완료 또는 팀 합의로 오해하지 말아 주세요.**

- 소개팅 탐색: 알고리즘 담당 팀원과 연동 중. 알고리즘 재구현 요청이 아니라 아래 출력 계약 조율 요청입니다.
- 소모임: 백엔드 제작 중. 아래 필드와 흐름에 맞춰 병행 개발합니다.
- 리뷰: 프론트 선구현. 아래 계약으로 백엔드 개발을 요청합니다.
- 채팅: **WebSocket 사용이 제품 방향으로 확인됨**. URL·raw JSON/STOMP 여부·이벤트는 미확정입니다. 현재 추가한 raw JSON 어댑터와 아래 제안을 기준으로 최종 프로토콜을 회신해 주세요. STOMP라면 destination/CONNECT 헤더/ACK 규칙을 받고 어댑터를 교체합니다.

전달 파일:

1. 이 요청서: 흐름, 정책, 권한, 오류, 이벤트, 완료 기준.
2. [필드 사전](../contracts/FIELDS.md): 필드별 타입·필수·null·enum·길이·범위 전체.
3. [OpenAPI 제안 JSON](../contracts/proposed.openapi.json): 추가 REST 작업 **36개**, 스키마 **36개**. Swagger Editor에서 읽을 수 있는 OpenAPI 3.0.3 초안.
4. 기존 배포 명세: `tests/fixtures/openapi.json`의 작업 28개. 추가 제안 파일과 구분합니다.

## 1. 공통 계약

### 1.1 이름, 인증, 시간

| 항목 | 제안 계약 |
| --- | --- |
| 필드명 | camelCase. UI용 snake_case는 프론트 어댑터에서 변환 |
| ID | 양의 정수. JS 정밀도 보장을 위해 9,007,199,254,740,991 이하. 이보다 큰 ID라면 모든 관련 ID를 문자열로 변경 협의 |
| 인증 | 보호 REST 요청 `Authorization: Bearer <accessToken>`. 공개 인증 API에는 Bearer를 보내지 않음 |
| 시간 | 새 API는 RFC3339 오프셋 필수: `2026-12-01T18:30:00+09:00` 또는 UTC `Z`. 화면은 Asia/Seoul |
| 기존 미팅 | 현재 배포 계약의 한국 현지 `scheduledAt` 요청 형식 유지. 기존 계약을 바꿀 때는 별도 공지 |
| 빈 문자열 / null | 필수 제목은 trim 후 공백 불가. 선택 텍스트는 `""`. 없는 일정·관계 ID·답변은 명시적 null |
| 공개 프로필 | 이메일·학생 번호·실명·생년월일 원문·학생증 원본은 상대 공개 응답에서 제외 |
| 응답 | 성공 HTTP 200/201, 빈 쓰기는 result:null 또는 HTTP 204. 목록 없음은 성공+빈 배열 |
| 권한 | 버튼 노출용 `can*`와 별개로 서버가 매 요청에서 인증/소유자/참여자/상태 검증 |
| 내용 | 리뷰·공지·FAQ·문의 등은 평문. 프론트는 HTML로 실행하지 않음 |

성공:

```json
{"isSuccess":true,"code":"SUCCESS","message":"성공","result":{}}
```

오류:

```json
{
  "isSuccess":false,
  "code":"COMMUNITY_CAPACITY_EXCEEDED",
  "message":"정원이 찼어요",
  "result":null,
  "fieldErrors":[{"field":"maxMembers","message":"현재 인원보다 작을 수 없습니다"}]
}
```

401은 토큰 부재/만료, 403은 로그인했으나 권한/이용 조건 부족, 404는 대상 없음, 409는 중복·정원·상태 충돌, 429는 요청 제한으로 구분합니다. 실패를 성공 HTTP 200으로 반환하지 않는 것을 요청합니다. 429에는 `Retry-After`(초)를 제공합니다.

### 1.2 페이지

공통 query: `cursor?:number`, `size?:number`(기본20, 1~50). ID 내림차순. `cursor`는 **배타적**으로 그 ID 미만을 반환합니다.

```json
{"items":[],"nextCursor":null,"hasNext":false}
```

- 다음 페이지가 있으면 `nextCursor`는 현재 페이지 마지막 ID. 이전 커서보다 작아야 합니다.
- 빈 목록이면 `nextCursor:null, hasNext:false`. 프론트는 진행하지 않는 커서를 오류로 처리합니다.
- 검색·필터는 페이지 절단 전에 서버에서 적용합니다.
- 추천 알고리즘 순서에 ID 커서가 부적합하면 **불투명 cursor + 추천 세션 고정** 형태로 협의해 주세요. 현재 탐색 어댑터의 숫자 커서는 합의 전 제안입니다.
- 리뷰 `averageRating / totalCount`는 전체 필터 결과의 집계이며 현재 페이지 집계가 아닙니다.

## 2. 상대 탐색 — 알고리즘 팀 출력 계약

`GET /api/profiles?cursor=&size=` → `DiscoveryPage`.

필수 공개 필드: `memberId, nickname, age, majorId, majorName, gender, faceType, height, topSize, skinTone, hairStyle, mbti, smokingStatus, tattooStatus, militaryStatus, charmPoints, canRequest`.

- enum은 기존 내 프로필과 동일. `XXL`은 UI에서 `2XL`로 표시합니다.
- 본인, 탈퇴/이용 제한, 인증/프로필 미완료 회원을 제외해 주세요.
- 대기/수락 신청이 양방향 중 어느 쪽에든 있으면 신규 신청 불가. 거절 후 재신청은 기존 계약 준수.
- 추천 없음, 필터 결과 없음, 추천 풀 소진을 오류와 구분해 빈 페이지로 반환합니다.
- 이상형 적용 방향, 성별 대상 규칙, 추천 순서 고정/새로고침 정책은 알고리즘 팀에서 확정해 주세요.
- 화면의 프로필 상세는 목록에 실린 공개 정보로 구성합니다. 별도 상세 API가 있다면 공개 범위와 캐시 만료 정책을 공유해 주세요.
- 탐색 성공이 신청 성공을 보장하지 않으므로 `POST /api/dating/requests`에서도 대상 상태·중복·기회를 재검증해야 합니다.

## 3. 소모임 — 병행 개발 계약

### 3.1 API

| 작업 | 경로 | 요청 / 응답 |
| --- | --- | --- |
| 목록 | GET `/api/communities` | cursor,size,keyword,gender,tag,joinedOnly → CommunityPage |
| 개설 | POST `/api/communities` | CommunityInput → 201 Community |
| 상세 | GET `/api/communities/{communityId}` | Community |
| 수정 | PUT `/api/communities/{communityId}` | CommunityUpdate → Community |
| 가입 | POST `/api/communities/{communityId}/join` | 본문 없음 → Community |
| 나가기 | DELETE `/api/communities/{communityId}/leave` | 본문 없음 → null |
| 종료 | POST `/api/communities/{communityId}/close` | 본문 없음 → Community |
| 운영 | GET `/api/communities/{communityId}/dashboard` | CommunityDashboard |
| 내보내기 | DELETE `/api/communities/{communityId}/members/{memberId}` | 본문 없음 → null |

생성 예시:

```json
{"emoji":"☕","title":"주말 카페 탐방","description":"편하게 카페에서 이야기해요.","tags":["카페","맛집"],"gender":"ANY","maxMembers":20}
```

수정은 위 전체 필드에 `active:boolean`을 추가합니다. 부분 수정이 아니라 전체 교체 기준입니다.

### 3.2 필드와 상태

- 제목 1~100자, 소개 1~2,000자, 이모지 1~16, 태그 최대5개/각1~20자/중복 제거, 정원2~100명(개설자 포함).
- `gender`: `ANY / MALE / FEMALE`. ANY는 성별 제한 없음. 성별 필터 생략은 전체 조회이며 ANY 소모임만을 뜻하지 않습니다.
- `status`: `RECRUITING / PAUSED / CLOSED`. active는 RECRUITING일 때만 true.
- `active:false` 수정은 모집 일시 중단입니다. **close 작업은 최종 종료**로 구분합니다.
- `chatRoomId`: 참여자만 실제 ID, 미참여자는 null.
- `canEdit / canJoin / canLeave / canManageMembers`: 현재 로그인 회원 기준 필수 boolean.
- 대시보드: Community + maleCount/femaleCount + CommunityMember 배열. 정원100명 이내이므로 전체 멤버 반환을 제안합니다. 그 이상 운영 시 멤버 페이지 계약을 별도 분리합니다.
- 멤버: `memberId, nickname, age, majorName, gender, role(OWNER/MEMBER), joinedAt`.

### 3.3 트랜잭션과 권한

- 생성: 소모임+개설자 가입+채팅방+개설자 채팅 참여를 함께 성공/롤백.
- 가입: active·성별·정원·중복을 검증. 소모임과 채팅 참여를 함께 성공/롤백.
- **기회는 소모임 생성/가입에서 차감하지 않는 것으로 제안**합니다. 제품 정책이 다르면 회신 바랍니다.
- 수정/운영/강퇴/종료는 개설자만. 본인/개설자 강퇴 금지.
- 정원을 현재 가입 인원보다 작게 수정하면 409. 성별 조건 수정은 기존 가입자를 자동 강퇴하지 않고 이후 가입에만 적용.
- 일반 회원 탈퇴/강퇴: 소모임 가입과 채팅 멤버십 동시 해제. 이후 메시지 조회/전송/구독 금지.
- 개설자는 모집 중 탈퇴 불가. 종료 후 나가기 허용. 개설자 양도는 이번 프론트 범위에 포함하지 않았습니다.
- 종료: 신규 가입/메시지 전송 중단, 기존 이력 보존, 참여자가 명시적으로 나가기 전 읽기 허용. 되돌리기 없음.
- 종료 소모임은 일반 모집 목록에서 제외하되 상세/기존 참여 이력 조회는 가능해야 합니다.
- 강퇴자의 재가입을 막는지/기간이 있는지 확정 필요. 현재 프론트는 서버 canJoin을 따릅니다.

## 4. 리뷰 — 프론트 선구현 계약

| 작업 | 경로 | 요청 / 응답 |
| --- | --- | --- |
| 작성 대상 | GET `/api/reviews/eligible` | ReviewTarget[] |
| 작성 | POST `/api/reviews` | ReviewInput → 201 Review |
| 받은 리뷰 | GET `/api/reviews/received` | cursor,size → ReviewPage |
| 쓴 리뷰 | GET `/api/reviews/written` | cursor,size → ReviewPage |
| 회원 리뷰 | GET `/api/reviews/users/{memberId}` | cursor,size → ReviewPage |
| 수정 | PUT `/api/reviews/{reviewId}` | ReviewUpdate → Review |
| 삭제 | DELETE `/api/reviews/{reviewId}` | null |

작성 예시:

```json
{"reviewedMemberId":8,"datingRequestId":301,"rating":5,"content":"즐겁게 이야기했어요."}
```

수정: `{"rating":4,"content":"수정한 내용"}`. 작성자와 상대/소개팅 ID는 변경 불가.

- 평점은 정수1~5. 내용은 선택, 빈 문자열 허용, 최대1,000자.
- 응답에는 id, reviewerId, reviewerNickname, reviewedMemberId, datingRequestId, rating, content, createdAt, updatedAt, canEdit, canDelete.
- 대상 조회에는 datingRequestId, memberId, nickname, roomId, scheduledAt(null가능), canReview, unavailableReason(null가능), reviewId(null가능).
- 작성 가능: 본인이 참여한 수락 소개팅의 실제 상대, 만남 완료 후, 동일 소개팅+작성자당1개. 자기 리뷰 금지.
- **만남 완료 판정이 미확정입니다.** 예정 시각 경과인지 별도 완료 상태인지 백엔드/제품에서 확정하고 `canReview`로 반환해 주세요. 프론트는 시간만으로 자격을 만들어내지 않습니다.
- 작성자 닉네임 공개를 제안합니다. 익명 정책이면 reviewerId/reviewerNickname 응답과 표시를 다시 합의해야 합니다.
- 본인만 수정/삭제. 현재 프론트는 서버 canEdit/canDelete를 따르며, 기간 제한이 있으면 해당 값에 반영해 주세요.
- 중복 작성은 409 REVIEW_DUPLICATE. DB unique 제약도 필요합니다.
- 수정/삭제 시 평균·개수가 즉시 다시 계산되어야 합니다. 0개 평균은 null(0점 아님).
- 삭제 후 재작성 허용 여부와 악성 리뷰 운영/숨김 정책은 회신 필요. 프론트는 eligible 재조회 결과를 따릅니다.

## 5. 채팅 상세, 참여자, 일정, 신고

### 5.1 채팅방 상세/목록 확장

`GET /api/chat-rooms/{roomId}` → ChatRoom. 기존 목록도 가능한 한 같은 필드를 반환해 주세요.

기존: `id, roomType, name, createdAt, lastMessageId, lastMessageContent, lastMessageAt, unreadCount`.

추가: `creatorId, datingRequestId, meetingId, communityId, participants, scheduledAt, active, canSetSchedule, canLeave, canClose`.

- 관계 ID는 해당 종류만 값, 나머지 null. 소개팅 creatorId는 null.
- 참여자: `memberId, nickname, gender, role, active, lastReadMessageId`.
- **발언하지 않은 회원과 나간 회원도 신고 대상 선택을 위해 식별할 수 있어야 합니다.** 나간 회원의 공개 정보 보존/익명화 정책은 확정 필요.
- 메시지 응답: 기존 필드에 senderNickname 필요. id와 clientMessageId로 중복 합칩니다.
- `lastReadMessageId`는 회원별 단조 증가. 안 읽은 수는 내 메시지 제외.
- 개인 메시지의 상대 읽음 표시는 실제 참여자 읽음 위치/이벤트가 있을 때만 표시합니다.
- `DELETE /api/chat-rooms/{roomId}/leave`: canLeave 회원만. 미팅/소모임이면 해당 멤버십도 함께 해제. 미팅 개설자 예정 시각 제한은 기존 정책 유지.
- `POST /api/chat-rooms/{roomId}/close`: canClose 회원만. 소개팅은 양측 종료 허용 제안, 그룹은 개설자만. 그룹 종료라면 연결 모임 상태도 일치시켜야 합니다.
- 종료된 방 목록 포함 여부: 기본 목록은 기존 active 방 규칙 유지. 이미 열린 방은 ROOM_CLOSED 이벤트로 입력 중단. 종료 이력 조회가 필요하면 별도 필터 계약을 추가해 주세요.

### 5.2 일정

| 작업 | 경로 | 내용 |
| --- | --- | --- |
| 조회 | GET `/api/chat-rooms/{roomId}/schedule` | Schedule 또는 null |
| 저장/수정 | PUT `/api/chat-rooms/{roomId}/schedule` | ScheduleInput → Schedule |
| 취소 | DELETE `/api/chat-rooms/{roomId}/schedule` | null |
| 홈 달력 | GET `/api/members/me/schedules?from=2026-12-01&to=2026-12-31` | Schedule[] |

```json
{"title":"카페에서 만나요","scheduledAt":"2026-12-01T18:30:00+09:00","location":"인하대 후문"}
```

- 제목1~100자, 장소0~200자, 미래 시각만 저장.
- 응답: id, roomId, roomType, title, scheduledAt, location, updatedAt, canEdit.
- 소개팅은 참여자 양측, 그룹은 개설자가 수정. 서버 canSetSchedule/canEdit 필수.
- 방당 일정1개(upsert). 프론트는 새로고침/재입장/달력에서 같은 서버 일정을 조회합니다.
- 홈 조회는 한국 날짜 양끝 포함, 최대93일 범위, 현재 접근 가능한 방의 일정만.
- 미팅 예정 시각과 채팅 일정은 동일 원본으로 유지하는 것을 요청합니다. 수정 시 미팅 상세/목록/나가기 권한 시각도 함께 반영.
- **미팅 일정 취소 허용 여부는 확정 필요**: 기존 미팅 scheduledAt 필수와 충돌합니다. 미팅은 취소 금지(409 SCHEDULE_REQUIRED) 또는 미팅 종료와 함께 취소 중 하나를 택해 주세요.
- 동시 수정 충돌은 최종 쓰기 우선으로 제안합니다. 버전 제어가 필요하면 version/If-Match 계약 추가.

### 5.3 신고

`POST /api/chat-rooms/{roomId}/reports` → 201 ReportReceipt.

```json
{"reportedMemberId":8,"reason":"ABUSE","detail":"대화 중 비하 발언이 있었습니다.","messageId":null}
```

- reason: ABUSE(욕설/비하), INAPPROPRIATE(부적절), SPAM(광고), FRAUD(사기 의심), OTHER(기타).
- detail 최대1,000자, OTHER는 공백 제외1자 이상 필수. messageId 선택(null); 프론트 현재 화면은 회원 단위 신고.
- 신고자는 방 참여자. 본인 신고 금지. 대상은 해당 방 참여 이력이 있어야 함. 메시지 미발언 상대 신고 허용.
- 메시지 ID를 받는 경우 방/대상 발언과의 관계를 검증.
- 응답 `{id,status:"RECEIVED",createdAt}`. 검토 완료를 의미하지 않음.
- 같은 방/신고자/대상/사유의 미처리 중복 신고는 409 REPORT_DUPLICATE 제안.
- 신고 즉시 상대 차단/채팅 종료는 하지 않는 것으로 제안. 별도 차단 기능은 이번 UI 범위에 포함하지 않았습니다.
- 신고 내용은 대상에게 노출하지 않습니다.

## 6. WebSocket — 최종 계약 확인 필요

**연결 URL은 임의로 확정하지 않았습니다.** 실제 `wss://…` URL과 raw JSON/STOMP를 알려 주세요. 현재 프론트 `VITE_CHAT_WS_URL`은 비어 있으며, URL 없이 미확인 경로를 호출하지 않습니다. 연결 불가 시 기존 REST 조회/전송으로 기능을 유지하고 연결 상태를 표시합니다.

### 6.1 제안: raw JSON 프레임

- 브라우저 WebSocket은 임의 Authorization handshake 헤더를 설정할 수 없어, access token을 첫 AUTH 프레임으로 전달하는 방식 제안.
- URL query에 토큰을 넣지 않습니다. 운영은 wss만 허용.
- 서버는 인증 전 AUTH 외 프레임 거부, 인증/구독 시간 제한 필요. handshake Origin에 운영 프론트/localhost allowlist 적용.

인증 → 구독:

```json
{"type":"AUTH","payload":{"accessToken":"<token>"}}
{"type":"AUTHENTICATED","payload":{}}
{"type":"SUBSCRIBE","roomId":42,"payload":{"afterMessageId":100}}
{"type":"SUBSCRIBED","roomId":42,"payload":{}}
```

전송 → 저장 완료 이벤트(송신자에게도 전송):

```json
{"type":"SEND_MESSAGE","roomId":42,"payload":{"content":"반가워요","clientMessageId":"550e8400-e29b-41d4-a716-446655440000"}}
{"type":"MESSAGE_CREATED","roomId":42,"payload":{"id":101,"roomId":42,"senderId":7,"senderNickname":"미리보기회원","content":"반가워요","clientMessageId":"550e8400-e29b-41d4-a716-446655440000","createdAt":"2026-12-01T09:00:00Z"}}
```

서버 저장 완료 후에만 MESSAGE_CREATED를 반환합니다. 동일 `(roomId,senderId,clientMessageId)` 재전송은 같은 서버 메시지를 반환하고 중복 저장/브로드캐스트하지 않도록 합니다. 같은 ID+다른 내용은 MESSAGE_ID_CONFLICT.

### 6.2 이벤트 사전

| type | roomId | payload | 클라이언트 동작 |
| --- | --- | --- | --- |
| AUTHENTICATED | 생략 가능 | {} | SUBSCRIBE 전송 |
| SUBSCRIBED | 필수 | {} | 연결 완료, REST 누락 복구 |
| MESSAGE_CREATED | 필수 | ChatMessage 전체 | id로 중복 제거, 정렬, 전송 확인 |
| READ_POSITION_UPDATED | 필수 | memberId:number,lastReadMessageId:number | 회원별 읽음 위치 단조 증가 반영 |
| SCHEDULE_UPDATED | 필수 | Schedule | 채팅/홈 일정 다시 조회 |
| SCHEDULE_DELETED | 필수 | {} | 일정 다시 조회 |
| ROOM_UPDATED | 필수 | {} 또는 ChatRoom | 목록/상세 다시 조회 |
| MEMBER_REMOVED | 필수 | memberId:number | 내 경우 입력 중단, 참여자 재조회 |
| ROOM_CLOSED | 필수 | {} | 입력 중단, 목록 재조회 |
| ERROR | 관련 방이면 필수 | code,message,clientMessageId?(관련 전송 UUID) | 실패 표시/인증 갱신/재연결 |
| PING / PONG | 생략 가능 | 생략 가능 | 연결 유지 |

ERROR.code 예시: AUTH_EXPIRED, AUTH_INVALID, ROOM_ACCESS_DENIED, ROOM_CLOSED, MESSAGE_ID_CONFLICT, MESSAGE_TOO_LONG, RATE_LIMITED.

### 6.3 재연결, 순서, 읽음

- 지수 지연1/2/4/8/16/30초+작은 지터, 네트워크 복구 시 재연결. token 만료는 갱신 후 재인증(갱신 계약 활성화된 경우).
- heartbeat15초, 수신 활동45초 없으면 재연결. 서버와 수치를 합의해 주세요.
- subscribe 권한 검증과 실시간 이벤트 전달은 REST와 동일한 멤버십 기준. 탈퇴/강퇴/종료 후 구독 권한 즉시 반영.
- SUBSCRIBED 이후 REST로 기존 latestId 뒤의 누락 메시지를 여러 cursor 페이지에서 복구합니다. 이때 실시간 이벤트와 중복돼도 id로 합칩니다.
- afterMessageId 서버 replay 지원 여부와 보장 순서를 회신해 주세요. 프론트는 replay를 유일한 복구 수단으로 가정하지 않습니다.
- 전송 확인 대기15초 후 실패를 표시하며 재시도에 같은 clientMessageId 유지. 소켓 미연결 시 같은 UUID로 기존 REST 전송을 사용합니다.
- 읽음 위치 변경은 현재 배포된 PATCH read-position 사용. 서버는 성공 후 참여자에게 READ_POSITION_UPDATED 전파 요청.
- 방 목록의 신규 메시지 즉시 갱신까지 지원하려면 회원별 알림 구독 채널도 필요합니다. 현재 목록은 REST 재조회와15초 갱신을 사용합니다. 해당 구독 계약은 별도 회신 필요.

## 7. 고객지원

| 경로 | 필수 계약 |
| --- | --- |
| GET `/api/support/notices` | NoticePage, cursor,size. id/title/content/createdAt/pinned |
| GET `/api/support/faqs` | Faq[]. id/category/question/answer |
| POST `/api/support/inquiries` | category/title/content → Inquiry |
| GET `/api/support/inquiries/me` | InquiryPage, 내 문의만. 내용·답변 포함 |
| POST `/api/support/feedback` | content → id/createdAt |

- 공지/문의 본문은 목록에 포함하고 화면에서 펼쳐봅니다. 별도 상세 API 없이도 전체 조회가 가능해야 합니다.
- 문의 category: ACCOUNT, VERIFICATION, DATING, COMMUNITY, CHAT, OTHER.
- 문의 제목1~100자, 내용1~3,000자. 상태 OPEN/ANSWERED/CLOSED, answer/answeredAt 미답변 시 null.
- 의견1~2,000자, 접수 결과만 반환.
- FAQ 질문/답변 검색은 받은 목록 안에서 프론트 검색. 목록이 커지면 검색/페이지 계약 확장.
- 파일 첨부는 이번 문의 UI 범위에 포함하지 않았습니다. 문의 확인/답변 운영 도구는 백엔드 운영 체계와 연결 필요.
- 429 제한과 실제 문의 전달/담당자 확인 방법을 함께 확정해 주세요.

## 8. 인증·계정

### 8.1 갱신/로그아웃 (제안)

- 로그인/회원가입 시 기존 accessToken 응답 유지 + refresh token은 HttpOnly, Secure, 적절한 SameSite cookie로 발급.
- POST `/api/auth/refresh`: body 없음, refresh cookie 인증 → `{accessToken}`. rotation/재사용 탐지 및 만료 정책 요청.
- POST `/api/auth/logout`: body 없음, refresh cookie 세션 무효화 및 cookie 제거 → null. 이미 로그아웃된 경우도 성공 처리 제안.
- 프론트는 계정 계약 활성화 시 credentials:include 사용. CORS에 정확한 Origin + Allow-Credentials:true 필요. wildcard Origin과 병용 불가.
- 크로스사이트 쿠키 차단 환경에서도 동작할 배포 도메인/프록시 구성을 확인해 주세요. 현재 서로 다른 프론트/duckdns 도메인에 cookie가 보장된다고 가정하지 않습니다.
- 보호 요청401에 한 번만 갱신하고 재시도, 동시401은 단일 갱신 요청. 갱신 실패 시 해당 세션만 종료합니다.
- 토큰 갱신으로 새 사용자가 로그인한 것으로 간주해 캐시를 지우지 않습니다. 로그아웃/계정 변경 때는 캐시를 비웁니다.

### 8.2 비밀번호 재설정

1. POST `/api/auth/password-resets` `{email}` → null. 가입 여부가 노출되지 않는 동일 응답 요청.
2. POST `/api/auth/password-resets/confirm` `{email,code}` → `{resetToken,expiresAt}`.
3. PUT `/api/auth/password-resets` `{resetToken,password}` → null.

이메일 학교 범위, 6자리 code, 코드 재전송/실패 횟수/유효시간, 1회용 resetToken 유효시간 확정 필요. 비밀번호8~64자, 대문자 필수 조건 없음. 변경 성공 시 기존 세션 무효화 범위를 알려 주세요. 프론트는 신규 비밀번호를 저장하지 않습니다.

### 8.3 탈퇴

POST `/api/members/me/withdrawal` `{password,confirmation:"WITHDRAW"}` → null.

- 현재 사용자 인증과 비밀번호 재확인. 잘못된 비밀번호는 일반 인증 만료401과 구분해 400 PASSWORD_MISMATCH 제안.
- 탈퇴 처리·모든 refresh 세션 폐기·모임/채팅 참여 정리를 함께 수행.
- 운영 중 그룹의 개설자가 탈퇴 가능한지 확정 필요. 불가하면409 OWNER_HAS_ACTIVE_GROUP을 반환해 종료 후 탈퇴하게 안내.
- 리뷰/메시지의 익명화·법정 보관·재가입/학번 재사용 정책 회신 필요. 프론트가 삭제 범위를 임의로 보장하지 않도록 최종 약관과 안내문 제공 요청.

## 9. 기존 API 추가 확인 사항

- 이메일 재전송60초/코드·verificationToken 만료, 허용 이메일 도메인. 현재60초는 프론트 임시 대기.
- 학생증 JPEG/PNG 정확한 byte 상한, OCR timeout/처리 중/실패 코드. 비동기면 작업 ID와 상태 조회 추가 계약 필요.
- 채팅2,000자 서버 제한 일치 여부. 현 UI의 제한을 확정하거나 변경값 공유.
- 소개팅 신청 만료 정책. 만료가 있다면 상태 enum과 expiresAt 제공; 프론트 임의 숨김 없음.
- 군필 COMPLETED 추가는 반영 완료. 과거 임시 ACTIVE_DUTY로 저장된 군필 데이터와 실제 현역을 구분할 마이그레이션 방침 필요. SOCIAL_SERVICE/EXEMPT를 군필/미필로 자동 덮어쓰지 않음.
- 미팅 키워드 기능은 현재 배포 API에 없어 입력을 제거했습니다. 제품에서 계속 필요하면 keywords:string[] 계약과 서버 저장/검색을 추가해 주세요.
- 미팅 생성/참여/코드참여 기회1회, 각24시간 회복, 나가기 환급 없음은 현재 계약 유지.

## 10. 주요 도메인 오류 코드 제안

| HTTP | code | 상황 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 필드 검증 실패 |
| 400 | PASSWORD_MISMATCH | 탈퇴 비밀번호 불일치 |
| 401 | AUTH_EXPIRED / AUTH_INVALID | 토큰 만료/무효 |
| 403 | SERVICE_NOT_READY | 이메일/학생 인증/프로필 조건 미충족 |
| 403 | OWNER_ONLY / ROOM_ACCESS_DENIED | 소유자 권한/방 접근 불가 |
| 403 | REVIEW_NOT_ELIGIBLE | 리뷰 작성 자격 없음 |
| 404 | MEMBER_NOT_FOUND / COMMUNITY_NOT_FOUND / ROOM_NOT_FOUND / REVIEW_NOT_FOUND | 대상 없음 |
| 409 | CHANCE_EXHAUSTED / DATING_DUPLICATE | 기회 부족/중복 신청 |
| 409 | ALREADY_JOINED / COMMUNITY_CAPACITY_EXCEEDED / COMMUNITY_JOIN_UNAVAILABLE | 가입 충돌 |
| 409 | OWNER_CANNOT_LEAVE / OWNER_HAS_ACTIVE_GROUP | 개설자 나가기/탈퇴 제한 |
| 409 | REVIEW_DUPLICATE / MESSAGE_ID_CONFLICT / REPORT_DUPLICATE | 중복/멱등키 충돌 |
| 409 | ROOM_CLOSED / COMMUNITY_CLOSED / SCHEDULE_REQUIRED | 상태 충돌/필수 일정 취소 금지 |
| 429 | RATE_LIMITED | 호출/발송 제한, Retry-After 필요 |

## 11. 프론트 실행·활성화 및 검증 기준

- 기본 실행은 기존 배포 API 사용. 추가 계약 기능은 아직 실서버 완료로 표시하지 않습니다.
- `npm run dev:preview` → localhost:5174. 명확한 미리보기 배너, 가짜 계정/데이터, localStorage 지속, 초기화 버튼, **실제 백엔드 API 요청 없음**. 인증 코드123456. 상대 답장/읽음 시뮬레이션 제공.
- 미리보기는 개발 모드에서만 동작하며 프로덕션 빌드에서 활성화되지 않습니다.
- 실서버 계약 검증 후 `VITE_ENABLED_FEATURES=profileDiscovery,communities,reviews,chatDetails,chatSchedule,chatReports,support,account` 중 완료한 기능만 활성화.
- WebSocket은 최종 프로토콜 확인 후 VITE_CHAT_WS_URL 설정. URL만 설정해도 다른 프로토콜과 자동 호환되는 것은 아닙니다.

백엔드 완료 증빙 요청:

1. 각 작업의 실제 배포 URL/Swagger, 필드 사전과의 차이, 정책 미확정 항목 회신.
2. 이메일·학생 인증·프로필 완료한 테스트 계정 최소2개, 소유자/일반 멤버/정원 충돌용 fixture.
3. 테스트 기회·신청·그룹·리뷰·메시지 초기화 방법. 운영 공개 초기화 API는 만들지 않아도 됩니다.
4. 실사용자에게 요청/메시지를 보내지 않는 테스트 대상 지정.
5. 성공뿐 아니라 빈 결과, 중복, 권한 없음, 정원 초과, 기회 부족, 재연결·중복 전송·읽음 복구 검증.
6. 리뷰 작성→수정→삭제 후 평균/수 재계산, 소모임 탈퇴/강퇴 후 REST·WebSocket 권한 차단, 일정 저장/취소 후 상대·홈 달력 동기화 검증.
7. 실제 모바일 브라우저+운영 도메인 CORS/cookie/WebSocket Origin 확인.

**프론트 mock 테스트·화면 검증은 실서버 종단 검증과 다릅니다. 최종 통합 완료는 위 계약의 실제 배포와 인증 계정/WebSocket 검증 후 판정합니다.**

## 12. 이번 프론트 검증 결과

- `npm test`: 기존 배포 계약 회귀26개 + 제안 계약/상태 변경/WebSocket 테스트17개 = **43개 통과**.
- 새 테스트는 제안 OpenAPI의 요청/응답 필드까지 검사하며, 소모임 멤버십·권한·종료, 리뷰 작성/중복/수정/삭제/집계, 일정·달력·신고·문의, 재설정·동시 토큰 갱신, WebSocket 인증/구독/UUID 전송 확인/오류를 포함합니다.
- `npm run build` 통과. `npm run lint` 오류0, 기존 경고5.
- 프로덕션 번들에 예시 회원/예시 이벤트/preview session 데이터가 포함되지 않는 것을 확인했습니다.
- Chrome **INHA** 로컬 미리보기에서 리뷰 작성→중복 방지→쓴 리뷰 재조회, 소모임 생성→개설자 버튼, 메시지 전송→상대 읽음 이벤트→수신 이벤트, 일정 제목 수정→홈 달력 재조회까지 확인했습니다.
- 실제 백엔드 신규 쓰기, 실제 WebSocket URL/프로토콜, 물리 모바일 기기 검증은 이 결과에 포함하지 않습니다.
