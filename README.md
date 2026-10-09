# Familove BE

Familove is a Node.js REST API for tracking the daily meal status (breakfast, lunch, dinner) of your family members.

## Tech Stack

- **Node.js** (ES Modules) + **Express** 5
- **MongoDB** (official Node.js driver)
- **dotenv**, **cors**, **uuid**

## Project Structure

```
Familove-be/
├── app.js                      # Express app entry point, mounts routers
├── database.js                 # MongoDB connection + collection helper
├── .env                        # Environment variables (not committed)
├── controller/
│   ├── familyController.js     # Family business logic
│   ├── userController.js       # User business logic
│   └── mealController.js       # Meal status business logic
└── router/
    ├── familyRouter.js         # /family routes
    ├── userRouter.js           # /user routes
    └── mealRouter.js           # /meal routes
```

## Environment Variables

Create a `.env` file in the project root with:

```
CONNECTION_STRING='<your mongodb connection string>'
DB_NAME='familoveDB'
COLLECTION_NAME='familoveCollection'
USER_COLLECTION_NAME='userCollection'
MEAL_COLLECTION_NAME='mealCollection'
```

## Getting Started

```bash
npm install
npm start
```

The server starts at `http://localhost:3000` (or the port set in your env).

## API Endpoints

### Users — `/user`

| Method | Endpoint | Description | Request Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/user` | Create a new user | `{ name, email, mobile }` | 201 — `{ message, userId }` |
| POST | `/user/add-to-family` | Add an existing user to a family | `{ userId, familyId }` | 200 — `{ message }` |
| POST | `/user/join-family` | Join a family using a 6-digit code | `{ userId, familyCode }` | 200 — `{ message, familyId, familyName }` |
| GET | `/user` | Get all users | — | 200 — `{ data: [user,...] }` |

### Families — `/family`

| Method | Endpoint | Description | Request Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/family` | Create a new family | `{ name }` | 201 — `{ message, data: familyId }` |
| GET | `/family` | Get all families | — | 200 — `{ data: [family,...] }` |
| GET | `/family/get-my-family` | Get a family with its members and today's meal status | `{ familyId }` **or** `{ familyCode }` | 200 — `{ data: { familyId, familyCode, familyName, members } }` |

### Meals — `/meal`

| Method | Endpoint | Description | Request Body | Response |
| --- | --- | --- | --- | --- |
| PUT | `/meal/update-status` | Update a user's meal status for today | `{ userId, mealType, status }` | 200 — `{ message }` |

**Notes**

- `mealType` is one of `BREAKFAST`, `LUNCH`, `DINNER`; `status` is typically `PENDING` (default), `EATEN`, or similar.
- Each meal also tracks `updatedAt`.
- Today's date is normalized to midnight (00:00) for all meal queries.