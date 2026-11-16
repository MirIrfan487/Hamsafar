# Hamsafar (Matrimony Platform) — Project Guide

## About this project
Hamsafar is a Muslim matrimonial website. The brand name shows only in the UI; code namespaces, the
folder, the database (MatrimonyDb) and JWT settings keep the name Matrimony on purpose. Users create profiles, search, send interests,
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
- Payments: Razorpay (test mode during development; keys in User Secrets)
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

## Services and registration
- Every Application service has an interface: Application/Interfaces/Services/IXyzService.cs,
  implemented by Application/Services/XyzService.cs. Controllers and hubs depend on the interface only.
- Each layer (Application, Persistence, Infrastructure, Api) has an AssemblyReference class.
- Program.cs calls builder.Services.AddServicesFromAssemblies(...AssemblyReference.Assembly...)
  (Api/Extensions/ServiceCollectionExtensions.cs): every class "XyzService" with an "IXyzService"
  interface is registered as scoped. New service = add XyzService + IXyzService, nothing else to register.
- Special lifetimes stay explicit: PresenceTracker (singleton), LocalPhotoStorage (singleton),
  RazorpayGateway (typed HttpClient), AppDbContext/Identity (AddPersistence).
- Loose coupling: classes receive what they need through the constructor, always as an interface.
  Shared logic is a service too: IProfileCardService (cards, privacy, blocks), IPremiumAccessService
  (plan checks), IInterestService.FindBetweenAsync. No static helper touches the database.
  Only pure calculations with no dependencies stay static (AgeRules).
- ChatHub and ChatService use IPresenceTracker (singleton PresenceTracker in the Api).
- Auth signup endpoint: POST /api/auth/signup.

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
- Look: dark navy and gold (navbar, hero, verse, footer, auth panel); inner pages stay light with white cards.
  The dashboard has its own navy welcome hero (interest counts in the framed panel), details below on ivory.
  The search page uses the same hero (result count and sort in the framed panel), filters and results below on ivory.
- Tokens in client/src/index.css (@theme): brand (navy; 600 buttons/links, 800-900 dark sections), accent (gold;
  search button/checks/step numbers), peach (now ivory backgrounds), sage leaves, ink text, dusk footer.
- Gold backgrounds always use dark text (text-brand-900), never text-white. Dark areas add the class on-dark
  so keyboard focus shows in gold.
- Fonts: Playfair Display (font-display: all h1 + home section titles), Plus Jakarta Sans (UI), Amiri (Arabic).
  Decorations in components/Decor.tsx (original SVGs; HeroArch is the home hero picture).
- Never show made-up statistics or reviews. Sample cards on the home page are illustrations (aria-hidden).
- 3D effects are plain CSS, no library: components/Tilt3D.tsx (follows the mouse), components/Reveal3D.tsx (on scroll),
  HeroArch layers. All movement sits inside the prefers-reduced-motion block in index.css; keep new animations there.

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
Each sample also gets a dummy picture from Matrimony.Api/SampleData/Photos/<key>.png (original illustrations, never
photos of real people), stored through IPhotoStorage, Approved, privacy AllMembers. Skipped if the profile has a photo.
Phase 5 in progress: InterestService + InterestsController: GET /api/interests?box=Received|Sent|Connected,
GET /summary, POST /api/interests {receiverProfileId, note}, POST /{id}/accept|reject|withdraw.
Rules: sender must be Approved; receiver Approved, opposite gender, not blocked/suspended; max 20 per 24h;
no resend after Rejected; Withdrawn row is reused; if the other side already sent one, accept theirs.
Accept creates a Conversation (Profile1Id < Profile2Id). ProfileDetailResponse has Interest + ViewerIsApproved.
Shared card/privacy logic: Application/Services/ProfileCards.cs (used by search and interests).
Frontend: components/InterestActions.tsx on /profiles/:id, pages/InterestsPage.tsx at /interests?tab=...
Phase 6 in progress: chat. ChatService (Application) + ConversationsController: GET /api/conversations,
GET /unread-count, GET /{id}/messages?before=, POST /{id}/messages {body}, POST /{id}/read.
Controller pushes live events through IHubContext<ChatHub>. Hub at /hubs/chat (Api/Hubs): events
ReceiveMessage, MessagesRead, Typing, PresenceChanged; hub method Typing(conversationId).
JWT for the hub comes as ?access_token= (JwtBearerEvents.OnMessageReceived, only for /hubs).
SubClaimUserIdProvider maps Clients.User(id) to the "sub" claim. PresenceTracker (in-memory, one server)
implements IPresenceTracker. Can send only if interest Accepted, no block, nobody suspended; 30 msgs/minute.
Frontend: @microsoft/signalr, hooks/useChat.tsx (ChatProvider: one connection, unreadCount, presence, on()),
pages/ChatPage.tsx at /chat, /chat/:id, /chat?with=<profileId>. Vite proxies /hubs with ws: true.
Display pieces (bubbles, day dividers, typing dots, openers, Premium lock) are in components/chat/ChatParts.tsx.
Phase 7 in progress: Premium with Razorpay (test mode). SubscriptionService (Application) + IPaymentGateway
-> RazorpayGateway (Infrastructure, HttpClient to api.razorpay.com/v1, Basic auth).
Endpoints: GET /api/plans (public), GET /api/subscription/me, POST /api/payments/order {planCode},
POST /api/payments/verify {razorpayOrderId, razorpayPaymentId, razorpaySignature}, POST /api/payments/webhook
(anonymous, X-Razorpay-Signature over the raw body; events payment.captured / order.paid / payment.failed).
Verify = HMAC-SHA256(orderId|paymentId, KeySecret) + GET /payments/{id} (order, amount, status captured|authorized).
Unique filtered index Subscriptions.PaymentId (migration AddSubscriptionPaymentUnique) stops double activation.
Renewals stack after the current end date. No auto-renewal.
Premium rules (PremiumAccess.cs): BOTH members need an active CanChat plan to READ or SEND messages
(list shows unread count but no message text; GET messages / POST message -> 403 premium_required;
mark-read does nothing). ServiceResult.ErrorCode (not_found / premium_required) picks 404 / 403.
GET /api/profiles/{id}/contact (email, phone) needs Accepted interest + CanViewContactDetails plan (403 otherwise).
Razorpay keys: User Secrets of Matrimony.Api -> "Razorpay": {KeyId, KeySecret, WebhookSecret}. Never in Git.
Frontend: /plans (PlansPage, utils/razorpay.ts loads checkout.js), dashboard plan card, chat upgrade prompt,
"Show contact details" on connected profiles.
Phase 8 in progress: admin panel. AdminService + SafetyService (Application), AdminController
([Authorize(Roles = Admin)], /api/admin: stats, profiles/pending, profiles/{id}/approve|reject {reason},
photos/pending, photos/{id}/approve|reject {reason}, reports?status=, reports/{id}/resolve
{outcome ActionTaken|Dismissed, note, suspendReportedMember}, members?q=, members/{userId}/suspend|unsuspend {note},
audit) and SafetyController (POST /api/profiles/{id}/report {reason, details}, POST|DELETE /api/profiles/{id}/block,
GET /api/blocks). Every admin action writes an AdminAuditLogs row (migration AddAdminAuditLog).
Rules: reject needs a reason (members see the profile reason on their dashboard); an admin cannot suspend
themselves or another admin; one open report per reporter -> reported pair. Suspended members cannot log in
and disappear from search/interests/chat, but an already-issued JWT keeps working for other calls until it
expires (max 24h). Fix in Phase 9 if needed (check IsSuspended in JwtBearerEvents.OnTokenValidated).
Dev admin: "SeedAdmin" {Email, Password} in appsettings.Development.json -> SeedData.SeedAdminAsync
(admin@matrimony.test / admin12345, no profile). Never in production. Make a real admin with SQL:
INSERT INTO AspNetUserRoles (UserId, RoleId) SELECT u.Id, r.Id FROM AspNetUsers u, AspNetRoles r
WHERE u.Email = '<email>' AND r.Name = 'Admin';   (then log out and in again to get a new token)
Frontend: components/AdminRoute.tsx, pages/admin/* at /admin (Overview, Profiles, Photos, Reports,
Members, Activity), "Admin" link in the navbar, admins land on /admin after login.
Members: components/SafetyActions.tsx (Report / Block on /profiles/:id), components/BlockedMembers.tsx
(dashboard, Unblock).
Android app (Capacitor, wraps the same React app) in progress. Step 1 DONE: services/api.ts API_BASE from
VITE_API_URL (empty for the website; client/.env.android for the app, see .env.android.example), used by
apiRequest, apiBlob and the SignalR hub URL. Server CORS policy "MobileApp" from appsettings "Cors:AllowedOrigins"
(http://localhost, https://localhost = the Capacitor WebView origins), AllowCredentials for SignalR.
Step 2 DONE (not yet built: needs Android Studio): Capacitor 8 (@capacitor/core, android; cli dev), appId
com.hamsafar.app, client/capacitor.config.json (JSON, because a .ts config fails in a "type": "module" project
on Node 26), native project in client/android. (http for the local API is debug-only now, see Step 9.)
Scripts: npm run build:android (vite --mode android + cap sync), npm run open:android (Android Studio).
Needs Android Studio (SDK + its bundled JDK 21); the old JAVA_HOME (JDK 16) is too old for Gradle.
Runs on the emulator (tested by the user 2026-11-16).
Step 3: utils/nativeApp.ts (isNativeApp, setupBackButton via @capacitor/app, called in main.tsx): Back on
/, /dashboard, /admin minimizes the app; elsewhere history.back(). Native-only code goes in utils/nativeApp.ts.
Step 4: Razorpay in the app with Razorpay's own plugin capacitor-razorpay (native Android SDK com.razorpay:checkout).
utils/razorpay.ts payWithRazorpay(options, onFailedAttempt) -> ids | null (closed); native SDK in the app,
checkout.js on the website. PlansPage awaits it, then POST /payments/verify as before (server still decides).
Step 5: photos. Gallery picking already worked (Capacitor maps <input type="file"> to the Android picker).
utils/shrinkPhoto.ts: photos over 5 MB are redrawn in the browser to max 1600 px JPEG (upright, no EXIF) before
upload, on website and app. StepPhotos has a "Take a photo" tile in the app only (input capture="user").
Step 6: edge-to-edge. index.html viewport-fit=cover; Navbar header pt-[env(safe-area-inset-top)], Footer and
AuthLayout main pad env(safe-area-inset-bottom), AuthLayout aside pads the top. capacitor.config.json plugins.SystemBars
{insetsHandling css, style DARK = light icons over navy}. New full-height/fixed UI must add these insets too.
Step 7: app icon + splash. Sources client/assets/*.svg (the Logo rings, white + gold on navy #0a1526):
icon-foreground (adaptive, rings in the safe centre), icon-background, icon-only (Android 7), splash, splash-dark.
npm run icons:android (@capacitor/assets) writes all sizes into android/app/src/main/res. styles.xml
windowSplashScreenBackground = navy for the Android 12+ system splash.
Push notifications (Firebase Cloud Messaging) in progress. Step 8a: DeviceTokens table (DeviceToken entity:
UserId -> AspNetUsers cascade, Token unique max 512, Platform Android|Ios, LastSeenAtUtc), migration AddDeviceTokens.
DeviceTokenService: register moves an existing token to the logged-in account, max 10 phones per user;
unregister only by owner. DevicesController [Authorize]: POST /api/devices {token, platform}, DELETE /api/devices {token}.
Step 8b: sending. IPushSender (Application/Interfaces) -> FirebasePushSender (Infrastructure/Push, FirebaseAdmin
package, singleton; returns dead tokens). Firebase:CredentialsPath = path of the service-account JSON (User Secrets /
env Firebase__CredentialsPath; file never in Git); empty = pushes off, app still works. NotificationService
(NotifyUserAsync / NotifyProfileAsync, never throws, skips suspended, deletes dead tokens). PushMessage(Title, Body,
Url, Tag): Url = app page opened on tap (data "url"). Lock-screen privacy: no names or message text in pushes.
Sent on: interest sent (receiver), interest accepted (sender), new message (recipient, only if not online in
PresenceTracker; tag chat-{id}). Rejections are not pushed.
Step 8c: app side. @capacitor/push-notifications; utils/pushNotifications.ts (startPushNotifications: channel
"hamsafar", permission, register -> POST /api/devices, token kept in localStorage "matrimony_push_token"; tap opens
data.url if it starts with "/"; stopPushNotifications -> DELETE /api/devices, called in useAuth.logout BEFORE the
JWT is cleared). components/PushSetup.tsx (in main.tsx) starts it when a user is logged in. services/devices.ts.
AndroidManifest: POST_NOTIFICATIONS, default icon drawable/ic_stat_hamsafar (white rings vector), color, channel.
Needs client/android/app/google-services.json (git-ignored) or Gradle skips Firebase and push does nothing.
Note: Tailwind scans comments too; never write class-like text such as "pt-[...]" in comments.
Step 9: release build setup. http allowed ONLY in debug builds: android/app/src/debug/AndroidManifest.xml
(usesCleartextTraffic) + MainActivity sets mixed content only when the app is debuggable. capacitor.config.json has
no cleartext/allowMixedContent (cap sync would put cleartext into every build). Signing: android/app/build.gradle
reads android/keystore.properties (git-ignored; see keystore.properties.example), .jks kept outside the repo.
npm run build:android:release uses .env.android-release (git-ignored); vite.config.ts refuses non-https VITE_API_URL.
Before the first Play Store upload: deploy the API on https (Phase 9), raise versionCode/versionName in
android/app/build.gradle for every upload, Build > Generate Signed App Bundle (.aab).
Next: Phase 9 — testing and deployment (retarget to net10.0 first: .NET 9 support ends 10 Nov 2026).
