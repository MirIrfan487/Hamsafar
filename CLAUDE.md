# Matrimony Platform — Project Guide

## About this project
A Muslim matrimonial website. Users create profiles, search, send interests,
chat after mutual acceptance, and pay for premium features.

I am learning while building. Claude writes the code directly in this folder,
one small step at a time, and explains each file so I can follow, test and
modify it. Do not generate whole modules in one go; stop after each step so I
can run and test it.

## Tech stack
- Backend: ASP.NET Core Web API, .NET 9, C# (plan to retarget to net10.0 later)
- Database: SQL Server + Entity Framework Core (code-first migrations)
- Auth: ASP.NET Core Identity + JWT
- Real-time chat: SignalR
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Payments: Razorpay (test mode during development)
- IDE: Visual Studio 2022 (backend), VS Code (frontend)

## Folder structure (Clean / Onion architecture)
```
Matrimony/                       (C:\Users\HP\source\repos\Matrimony)
├── CLAUDE.md
├── server/
│   ├── Matrimony.sln            (open this in Visual Studio 2022)
│   └── src/
│       ├── API/
│       │   └── Matrimony.Api            Controllers, Extensions, Program.cs, appsettings, .http
│       ├── Core/
│       │   ├── Matrimony.Domain         Entities, Enums, Constants (Roles). No project references.
│       │   └── Matrimony.Application    Services, DTOs, Interfaces (IAppDbContext, ITokenService), Common
│       └── External/
│           ├── Matrimony.Persistence    AppDbContext, Configurations (one per table), Migrations, Seed
│           └── Matrimony.Infrastructure Authentication (JwtSettings, TokenService); later photo storage, Razorpay
└── client/
    └── src/
        ├── components/
        ├── pages/
        ├── services/      (API calls)
        ├── hooks/         (useAuth = AuthProvider + useAuth)
        ├── layouts/       (MainLayout with navbar, AuthLayout for login/register)
        └── utils/
```

## Layer rules (dependencies point INWARDS only)
- Domain -> nothing.  Application -> Domain.
- Persistence -> Application.  Infrastructure -> Application.
- Api -> Application + Persistence + Infrastructure (only to register them in Program.cs).
- Application never uses AppDbContext or SQL Server directly: it uses IAppDbContext.
- New outside-world service (storage, email, payments): interface in Application/Interfaces,
  class in Infrastructure, register in Infrastructure/DependencyInjection.cs.
- New table: entity in Domain/Entities, IEntityTypeConfiguration in Persistence/Configurations,
  DbSet in AppDbContext AND IAppDbContext.
- New service: Application/Services + register in Application/DependencyInjection.cs.

## Migrations (Package Manager Console)
Default project: Matrimony.Persistence, startup project: Matrimony.Api
```
Add-Migration <Name> -Project Matrimony.Persistence -StartupProject Matrimony.Api
Update-Database -Project Matrimony.Persistence -StartupProject Matrimony.Api
```

## Dev URLs
- Swagger UI: http://localhost:5080/swagger (Authorize button = paste JWT)
- API: https://localhost:7080 (http://localhost:5080)
- React: http://localhost:5173 (Vite proxies /api to http://localhost:5080)

## Frontend design
- Tokens in client/src/index.css (@theme): brand (violet #5b16d9) buttons/links, accent (rose #ec407a)
  search button/checks/step numbers, peach backgrounds, sage leaves, ink text, dusk footer.
- Fonts: Plus Jakarta Sans (all UI), Amiri (Arabic). Decorations in components/Decor.tsx (original SVGs).
- Never show made-up statistics or reviews. Sample cards on the home page are illustrations (aria-hidden).

## Rules
- Real working code only, no placeholders or fake logic.
- Never trust payment status from the frontend; verify on the server.
- Chat only between users with mutually accepted interest.
- Never expose phone, email or photos without the user's privacy setting allowing it.
- Users must be 18+.
- Use DTOs in controllers; never return entity classes directly.
- Async all the way (async/await with EF Core).

## MVP phases
1. Setup + database design
2. Registration and login (email + JWT)
3. Profile creation wizard + photo upload
4. Search with filters
5. Interests (send / accept / reject)
6. Chat (SignalR)
7. One paid plan (Razorpay)
8. Admin panel (approve profiles/photos, reports)
9. Testing + deployment

## Current status
Phase 1, Step 1 done: project skeleton + /api/health + React health check page.
Phase 1, Step 2 done: EF Core + SQL Server (Server=., MatrimonyDb), migration InitialCreate.
Phase 1 DONE (tested 2026-11-04). Step 3: all MVP tables — Identity tables, Profiles, ProfilePhotos,
PartnerPreferences, Interests, Conversations, Messages, SubscriptionPlans (seeded
PREMIUM_MONTHLY Rs 299), Subscriptions, Payments, Reports, Blocks. Migration AddCoreTables.
Delete rules: tables with two FKs to Profiles use Restrict; account deletion must
remove those rows in code. Payments are kept (Restrict) for records.
Money is stored as int paise.
Phase 2, Step 1 DONE: POST /api/auth/register (AuthService, Identity, roles Member/Admin
seeded at startup, Draft profile created with the account, 18+ check). Enums go over JSON as text.
Phase 2, Step 2 DONE: POST /api/auth/login (JWT, 24h, lockout after 5 tries),
GET /api/auth/me [Authorize]. Claims: "sub" = user id, "role" = roles (MapInboundClaims=false).
Dev JWT key in appsettings.Development.json; production uses env var Jwt__Key.
Phase 2 DONE. Step 3: React Router (react-router v7), AuthProvider (JWT in
localStorage key "matrimony_token", checked with /api/auth/me on load), pages: / , /login,
/register (auto-login after register), /dashboard (ProtectedRoute), /status (health checks).
API calls go through services/api.ts apiRequest(); errors arrive as ApiError.messages.
Phase 3, Step 1 in progress: ProfileService + ProfileController [Authorize]:
GET/PUT /api/profile/me, PUT /api/profile/me/preferences, POST /api/profile/me/submit.
Profile.Sect/Religiosity now nullable; family fields added (migration AddProfileFamilyDetails).
Submit needs: City, Education, Occupation, Sect, Religiosity, AboutMe >= 30 chars, preferences.
Editing an Approved profile -> PendingApproval (re-review); editing a Rejected one -> Draft.
User id in controllers: User.GetUserId(). Services return ServiceResult<T>.
Restructured to Clean/Onion architecture (old server/Matrimony.Api folder removed).
Phase 3, Step 2 in progress: profile wizard at /profile/edit?step=1..6 (pages/ProfileWizardPage.tsx,
components/wizard/*). Steps 1-4 save with PUT /api/profile/me, step 5 PUT /me/preferences, step 6 review +
POST /me/submit. Form helpers in utils/profileForm.ts, labels in utils/options.ts. Dashboard shows real status.
Phase 3, Step 3 in progress: photos. PhotoService (Application) + IPhotoStorage -> LocalPhotoStorage
(Infrastructure, ImageSharp: validates, auto-orients, max 1600px, strips EXIF/GPS, saves JPEG with random
name in App_Data/photos, NOT wwwroot). Max 6 photos, 5 MB. New photos are Pending (admin approves in Phase 8).
Endpoints: GET/POST /api/profile/me/photos, DELETE /me/photos/{id}, PUT /me/photos/{id}/main,
GET /api/photos/{id} (privacy check: owner/admin always; others need photo+profile Approved, no block,
PhotoPrivacy AllMembers or an Accepted interest either way). Frontend loads images via SecurePhoto (blob + token).
Wizard: step 6 = Photos, step 7 = Review.
Phase 3 DONE (photos untested by Claude in the browser).
Phase 4 in progress: SearchService (Application) + ProfilesController: GET /api/profiles/search ([FromQuery]
SearchRequest: age, height, maritalStatuses, sects, religiosities, city/state contains, education contains,
withPhotoOnly, sort Newest/Youngest/Oldest, page, pageSize<=48) and GET /api/profiles/{id}.
Visibility: Approved, opposite gender, not self, not suspended, no block either way. Cards/detail never
include email, phone, exact DOB, or a hidden last name. Photo ids only when the viewer may see them.
Frontend: /search (filters in URL; starts from own partner preferences), /profiles/:id, ProfileCard.
Dev data: SampleProfiles seeds 10 approved profiles (sample.f1..f5 / sample.m1..m5 @sample.test,
password123) when "SeedSampleProfiles": true in appsettings.Development.json. Never enable in production.
Phase 5 in progress: InterestService + InterestsController: GET /api/interests?box=Received|Sent|Connected,
GET /summary, POST /api/interests {receiverProfileId, note}, POST /{id}/accept|reject|withdraw.
Rules: sender must be Approved; receiver Approved, opposite gender, not blocked/suspended; max 20 per 24h;
no resend after Rejected; Withdrawn row is reused; if the other side already sent one, accept theirs.
Accept creates a Conversation (Profile1Id < Profile2Id). ProfileDetailResponse has Interest + ViewerIsApproved.
Shared card/privacy logic: Application/Services/ProfileCards.cs (used by search and interests).
Frontend: components/InterestActions.tsx on /profiles/:id, pages/InterestsPage.tsx at /interests?tab=...
Next: Phase 6 — chat (SignalR).
