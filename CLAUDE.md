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

## Folder structure
```
Matrimony/                 (C:\Users\HP\source\repos\Matrimony)
├── CLAUDE.md
├── server/
│   ├── Matrimony.sln      (open this in Visual Studio 2022)
│   └── Matrimony.Api/
│       ├── Controllers/
│       ├── Data/          (DbContext, migrations, seed)
│       ├── Models/        (entity classes)
│       ├── DTOs/          (request/response shapes)
│       ├── Services/      (business logic)
│       ├── Hubs/          (SignalR)
│       └── Program.cs
└── client/
    └── src/
        ├── components/
        ├── pages/
        ├── services/      (API calls)
        ├── hooks/
        └── layouts/
```

## Dev URLs
- API: https://localhost:7080 (http://localhost:5080)
- React: http://localhost:5173 (Vite proxies /api to http://localhost:5080)

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
Migrations go in Data/Migrations: Add-Migration <Name> -OutputDir Data/Migrations
Delete rules: tables with two FKs to Profiles use Restrict; account deletion must
remove those rows in code. Payments are kept (Restrict) for records.
Money is stored as int paise.
Next: Phase 2 — registration and login (Identity + JWT).
