# 추가 API 필드 사전 (제안 v0.1)

모든 정의는 프론트 선구현 기준 제안이며 배포된 서버 명세가 아닙니다. 요청서: [backend-api-request.md](../docs/backend-api-request.md).

## Error

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| isSuccess | boolean | 필수 | enum=[False] |
| code | string | 필수 | minLength=1 |
| message | string | 필수 | minLength=1 |
| result | object / null | 필수 |  |
| fieldErrors | array[object] | 선택 |  |

## CommunityInput

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| emoji | string | 필수 | minLength=1; maxLength=16 |
| title | string | 필수 | minLength=1; maxLength=100 |
| description | string | 필수 | minLength=1; maxLength=2000 |
| tags | array[string] | 필수 | maxItems=5 |
| gender | string | 필수 | enum=['ANY', 'MALE', 'FEMALE'] |
| maxMembers | integer | 필수 | minimum=2; maximum=100 |

## CommunityUpdate

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| emoji | string | 필수 | minLength=1; maxLength=16 |
| title | string | 필수 | minLength=1; maxLength=100 |
| description | string | 필수 | minLength=1; maxLength=2000 |
| tags | array[string] | 필수 | maxItems=5 |
| gender | string | 필수 | enum=['ANY', 'MALE', 'FEMALE'] |
| maxMembers | integer | 필수 | minimum=2; maximum=100 |
| active | boolean | 필수 |  |

## Community

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| id | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| creatorId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| emoji | string | 필수 | minLength=1; maxLength=16 |
| title | string | 필수 | minLength=1; maxLength=100 |
| description | string | 필수 | minLength=1; maxLength=2000 |
| tags | array[string] | 필수 | maxItems=5 |
| gender | string | 필수 | enum=['ANY', 'MALE', 'FEMALE'] |
| maxMembers | integer | 필수 | minimum=2; maximum=100 |
| active | boolean | 필수 |  |
| status | string | 필수 | enum=['RECRUITING', 'PAUSED', 'CLOSED'] |
| createdAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |
| memberCount | integer | 필수 | minimum=0 |
| joined | boolean | 필수 |  |
| chatRoomId | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| canEdit | boolean | 필수 |  |
| canJoin | boolean | 필수 |  |
| canLeave | boolean | 필수 |  |
| canManageMembers | boolean | 필수 |  |

## CommunityMember

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| memberId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| nickname | string | 필수 | minLength=1; maxLength=30 |
| age | integer | 필수 | minimum=0 |
| majorName | string | 필수 | minLength=0 |
| gender | string | 필수 | enum=['MALE', 'FEMALE'] |
| role | string | 필수 | enum=['OWNER', 'MEMBER'] |
| joinedAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |

## CommunityDashboard

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| community | Community | 필수 |  |
| maleCount | integer | 필수 | minimum=0 |
| femaleCount | integer | 필수 | minimum=0 |
| members | array[CommunityMember] | 필수 | maxItems=100 |

## ReviewInput

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| reviewedMemberId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| datingRequestId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| rating | integer | 필수 | minimum=1; maximum=5 |
| content | string | 필수 | minLength=0; maxLength=1000 |

## ReviewUpdate

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| rating | integer | 필수 | minimum=1; maximum=5 |
| content | string | 필수 | minLength=0; maxLength=1000 |

## Review

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| id | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| reviewerId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| reviewerNickname | string | 필수 | minLength=1; maxLength=30 |
| reviewedMemberId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| datingRequestId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| rating | integer | 필수 | minimum=1; maximum=5 |
| content | string | 필수 | minLength=0; maxLength=1000 |
| createdAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |
| updatedAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |
| canEdit | boolean | 필수 |  |
| canDelete | boolean | 필수 |  |

## ReviewTarget

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| datingRequestId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| memberId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| nickname | string | 필수 | minLength=1; maxLength=30 |
| roomId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| scheduledAt | string / null | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |
| canReview | boolean | 필수 |  |
| unavailableReason | string / null | 필수 | minLength=0 |
| reviewId | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |

## ChatParticipant

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| memberId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| nickname | string | 필수 | minLength=1; maxLength=30 |
| gender | string | 필수 | enum=['MALE', 'FEMALE'] |
| role | string | 필수 | enum=['OWNER', 'MEMBER'] |
| active | boolean | 필수 |  |
| lastReadMessageId | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |

## ChatRoom

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| id | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| roomType | string | 필수 | enum=['DATING', 'MEETING', 'COMMUNITY'] |
| name | string | 필수 | minLength=1; maxLength=100 |
| createdAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |
| lastMessageId | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| lastMessageContent | string / null | 필수 | minLength=0; maxLength=2000 |
| lastMessageAt | string / null | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |
| unreadCount | integer | 필수 | minimum=0 |
| creatorId | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| datingRequestId | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| meetingId | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| communityId | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| participants | array[ChatParticipant] | 필수 |  |
| scheduledAt | string / null | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |
| active | boolean | 필수 |  |
| canSetSchedule | boolean | 필수 |  |
| canLeave | boolean | 필수 |  |
| canClose | boolean | 필수 |  |

## ChatMessage

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| id | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| roomId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| senderId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| senderNickname | string | 필수 | minLength=1; maxLength=30 |
| content | string | 필수 | minLength=1; maxLength=2000 |
| clientMessageId | string | 필수 | minLength=0; format=uuid |
| createdAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |

## ScheduleInput

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| title | string | 필수 | minLength=1; maxLength=100 |
| scheduledAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |
| location | string | 필수 | minLength=0; maxLength=200 |

## Schedule

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| id | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| roomId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| roomType | string | 필수 | enum=['DATING', 'MEETING', 'COMMUNITY'] |
| title | string | 필수 | minLength=1; maxLength=100 |
| scheduledAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |
| location | string | 필수 | minLength=0; maxLength=200 |
| updatedAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |
| canEdit | boolean | 필수 |  |

## ReportInput

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| reportedMemberId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| reason | string | 필수 | enum=['ABUSE', 'INAPPROPRIATE', 'SPAM', 'FRAUD', 'OTHER'] |
| detail | string | 필수 | minLength=0; maxLength=1000; description=OTHER인 경우 trim 후 1자 이상 필수. |
| messageId | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |

## ReportReceipt

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| id | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| status | string | 필수 | enum=['RECEIVED'] |
| createdAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |

## Notice

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| id | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| title | string | 필수 | minLength=1; maxLength=100 |
| content | string | 필수 | minLength=1; maxLength=10000; description=HTML 아닌 평문 |
| createdAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |
| pinned | boolean | 필수 |  |

## Faq

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| id | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| category | string | 필수 | minLength=1; maxLength=30 |
| question | string | 필수 | minLength=1; maxLength=200 |
| answer | string | 필수 | minLength=1; maxLength=5000; description=HTML 아닌 평문 |

## InquiryInput

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| category | string | 필수 | enum=['ACCOUNT', 'VERIFICATION', 'DATING', 'COMMUNITY', 'CHAT', 'OTHER'] |
| title | string | 필수 | minLength=1; maxLength=100 |
| content | string | 필수 | minLength=1; maxLength=3000 |

## Inquiry

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| id | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| category | string | 필수 | enum=['ACCOUNT', 'VERIFICATION', 'DATING', 'COMMUNITY', 'CHAT', 'OTHER'] |
| title | string | 필수 | minLength=1; maxLength=100 |
| content | string | 필수 | minLength=1; maxLength=3000 |
| status | string | 필수 | enum=['OPEN', 'ANSWERED', 'CLOSED'] |
| answer | string / null | 필수 | minLength=0; maxLength=5000 |
| createdAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |
| answeredAt | string / null | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |

## FeedbackInput

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| content | string | 필수 | minLength=1; maxLength=2000 |

## FeedbackReceipt

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| id | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| createdAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |

## EmailInput

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| email | string | 필수 | minLength=0; format=email |

## ResetConfirmInput

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| email | string | 필수 | minLength=0; format=email |
| code | string | 필수 | minLength=6; maxLength=6; pattern=^[0-9]{6}$ |

## ResetToken

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| resetToken | string | 필수 | minLength=1 |
| expiresAt | string | 필수 | minLength=0; format=date-time; description=RFC3339 UTC 또는 +09:00 오프셋 필수. 화면은 Asia/Seoul. |

## PasswordInput

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| resetToken | string | 필수 | minLength=1 |
| password | string | 필수 | minLength=8; maxLength=64 |

## AccessToken

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| accessToken | string | 필수 | minLength=1 |

## WithdrawalInput

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| password | string | 필수 | minLength=1; maxLength=64 |
| confirmation | string | 필수 | enum=['WITHDRAW'] |

## DiscoveryProfile

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| memberId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| nickname | string | 필수 | minLength=1; maxLength=30 |
| age | integer | 필수 | minimum=0 |
| majorId | integer | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| majorName | string | 필수 | minLength=1 |
| gender | string | 필수 | enum=['MALE', 'FEMALE'] |
| faceType | string | 필수 | enum=['WOLF', 'DOG', 'FOX', 'CAT', 'BEAR', 'RABBIT', 'DEER', 'DINOSAUR', 'HORSE'] |
| height | integer | 필수 | minimum=1 |
| topSize | string | 필수 | enum=['XS', 'S', 'M', 'L', 'XL', 'XXL'] |
| skinTone | string | 필수 | enum=['VERY_LIGHT', 'LIGHT', 'MEDIUM', 'DARK', 'VERY_DARK'] |
| hairStyle | string | 필수 | enum=['SHORT', 'BOB', 'MEDIUM_LENGTH', 'LONG', 'WAVY', 'CURLY', 'TWO_BLOCK'] |
| mbti | string | 필수 | minLength=4; maxLength=4; pattern=^[EI][NS][FT][JP]$ |
| smokingStatus | string | 필수 | enum=['NON_SMOKER', 'OCCASIONAL', 'SMOKER', 'QUITTING'] |
| tattooStatus | string | 필수 | enum=['NONE', 'SMALL', 'LARGE', 'MANY'] |
| militaryStatus | string | 필수 | enum=['COMPLETED', 'ACTIVE_DUTY', 'SOCIAL_SERVICE', 'NOT_SERVED', 'EXEMPT', 'NOT_APPLICABLE'] |
| charmPoints | array[string] | 필수 | maxItems=3 |
| canRequest | boolean | 필수 |  |

## CommunityPage

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| items | array[Community] | 필수 |  |
| nextCursor | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| hasNext | boolean | 필수 |  |

## ReviewPage

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| items | array[Review] | 필수 |  |
| nextCursor | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| hasNext | boolean | 필수 |  |
| averageRating | number / null | 필수 | minimum=1; maximum=5 |
| totalCount | integer | 필수 | minimum=0 |

## NoticePage

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| items | array[Notice] | 필수 |  |
| nextCursor | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| hasNext | boolean | 필수 |  |

## InquiryPage

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| items | array[Inquiry] | 필수 |  |
| nextCursor | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| hasNext | boolean | 필수 |  |

## DiscoveryPage

| 필드 | 타입 | 필수 | 제한 / 설명 |
| --- | --- | --- | --- |
| items | array[DiscoveryProfile] | 필수 |  |
| nextCursor | integer / null | 필수 | minimum=1; maximum=9007199254740991; format=int64 |
| hasNext | boolean | 필수 |  |
