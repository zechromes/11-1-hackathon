# API Endpoints Quick Reference

## Base URL
```
https://api.yourdomain.com
```

## Authentication
All endpoints require authentication except:
- `POST /api/auth/register`
- `POST /api/auth/login`

Include in headers:
```
Authorization: Bearer <access_token>
```

## Endpoints by Feature

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/refresh` | Refresh access token |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/me` | Get current user profile |
| PUT | `/api/profile/me` | Update current user profile |
| GET | `/api/profile/{user_id}` | Get public profile |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Get dashboard summary data |

### Treatment Plans
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/treatment-plans` | Create/upload treatment plan (PDF) |
| GET | `/api/treatment-plans` | Get user's treatment plans |
| GET | `/api/treatment-plans/{plan_id}` | Get specific treatment plan |
| POST | `/api/treatment-plans/{plan_id}/import` | Import plan (extract missions) |
| DELETE | `/api/treatment-plans/{plan_id}` | Delete treatment plan |

### Missions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/missions` | Get user's missions |
| GET | `/api/missions/today` | Get today's missions |
| GET | `/api/missions/{mission_id}` | Get specific mission |
| PUT | `/api/missions/{mission_id}/complete` | Mark mission as completed |
| PUT | `/api/missions/{mission_id}` | Update mission |
| DELETE | `/api/missions/{mission_id}` | Delete mission |

### Calendar
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/events` | Get calendar events |
| POST | `/api/calendar/events` | Create calendar event |
| PUT | `/api/calendar/events/{event_id}/sync` | Sync with external calendar |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress` | Get progress records |
| POST | `/api/progress` | Create progress record |
| GET | `/api/progress/weekly` | Get weekly progress summary |

### Gamification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gamification/scores/me` | Get current user scores |
| GET | `/api/gamification/leaderboard` | Get leaderboard |
| GET | `/api/gamification/badges` | Get all badges |
| GET | `/api/gamification/badges/me` | Get user's earned badges |
| GET | `/api/gamification/merchandise` | Get merchandise catalog |
| POST | `/api/gamification/merchandise/{merchandise_id}/redeem` | Redeem merchandise |

### Social (Friends)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friends` | Get user's friends |
| POST | `/api/friends/request` | Send friend request |
| PUT | `/api/friends/{friendship_id}/accept` | Accept friend request |
| PUT | `/api/friends/{friendship_id}/reject` | Reject friend request |
| DELETE | `/api/friends/{friendship_id}` | Remove friendship |
| GET | `/api/friends/discover` | Discover potential friends |

### Community (Lobby/Posts)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | Get community posts |
| POST | `/api/posts` | Create post |
| POST | `/api/posts/{post_id}/like` | Like/unlike post |
| GET | `/api/posts/{post_id}/comments` | Get post comments |
| POST | `/api/posts/{post_id}/comments` | Add comment |

### Collaboration Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms` | Get collaboration rooms |
| POST | `/api/rooms` | Create collaboration room |
| GET | `/api/rooms/{room_id}` | Get room details |
| POST | `/api/rooms/{room_id}/join` | Join room |
| POST | `/api/rooms/{room_id}/leave` | Leave room |
| GET | `/api/rooms/{room_id}/messages` | Get room messages |
| POST | `/api/rooms/{room_id}/messages` | Send message to room |
| POST | `/api/rooms/{room_id}/media/start` | Start voice/video session |

### Knowledge Base
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/knowledge/articles` | Get knowledge articles |
| GET | `/api/knowledge/articles/{article_id}` | Get article details |
| POST | `/api/knowledge/articles/{article_id}/view` | Increment view count |

---

## WebSocket Events

### Real-time Subscriptions

Subscribe to real-time updates:

```
wss://api.yourdomain.com/ws
```

#### Events

**Mission Updates**
```json
{
  "type": "mission:updated",
  "data": { /* Mission JSON */ }
}
```

**Friend Request**
```json
{
  "type": "friendship:requested",
  "data": { /* Friendship JSON */ }
}
```

**Room Message**
```json
{
  "type": "room:message",
  "data": { /* Room Message JSON */ }
}
```

**Room Participant**
```json
{
  "type": "room:participant:joined",
  "data": { /* Room Participant JSON */ }
}
```

---

## Pagination

Most list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "data": [ /* Array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## Error Responses

Standard error format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* Additional error details */ }
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

---

## Rate Limiting

Rate limits (per user):
- Authentication endpoints: 5 requests/minute
- Write operations: 100 requests/hour
- Read operations: 1000 requests/hour
- WebSocket connections: 10 concurrent

Response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1633024800
```

