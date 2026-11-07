# Hamsafar 💍

### A Modern Matrimonial Platform

Hamsafar is a modern matrimonial web application designed to help individuals discover compatible life partners through a clean, intuitive, and user-friendly platform.

The application provides an organized environment for profile creation, partner discovery, interest management, and communication.

---

## ✨ Features

### 👤 User Profiles
- Create and manage matrimonial profiles.
- Add personal and profile information.
- Update profile details.

### 🔍 Partner Discovery
- Browse available matrimonial profiles.
- Search for potential matches.
- Explore profile information.

### ❤️ Interest Management
- Send interest requests.
- Manage received interests.
- Track connection requests.

### 💬 Private Communication
- Chat interface for connecting with other members.
- Organized conversation experience.

### 💎 Membership Plans
- Membership plans interface.
- Subscription-oriented platform structure.

### 🛡️ Account Management
- Blocked members management.
- User account management.
- Administrative functionality.

---

## 🛠️ Technology Stack

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend
- C#
- ASP.NET Core Web API
- .NET

---

## 📁 Project Structure

```text
Matrimony/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       └── utils/
│
├── server/
│   └── src/
│       ├── API/
│       ├── Application/
│       ├── Core/
│       └── External/
│
├── .claude/
├── .gitignore
├── CLAUDE.md
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- .NET SDK

### 1. Clone the Repository

```bash
git clone https://github.com/irfan000/Hamsafar.git
```

### 2. Navigate to the Project

```bash
cd Hamsafar
```

### 3. Setup Frontend

```bash
cd client
npm install
npm run dev
```

The frontend development server will normally be available at:

```text
http://localhost:5173
```

### 4. Setup Backend

Open another terminal from the project root.

Restore the backend dependencies:

```bash
dotnet restore server/src/API/Matrimony.Api/Matrimony.Api.csproj
```

Configure the required application settings and environment variables before running the API.

Run the backend:

```bash
dotnet run --project server/src/API/Matrimony.Api/Matrimony.Api.csproj
```

---

## 🔐 Security

- Never expose database credentials.
- Keep API keys and JWT secrets private.
- Do not commit production credentials.
- Use environment-specific configuration.

---

## 🗺️ Project Goals

Hamsafar aims to provide a convenient and reliable matrimonial platform with an emphasis on:

- Simple user experience.
- Meaningful connections.
- Organized profile discovery.
- Secure communication.
- Scalable application architecture.

---

## 👨‍💻 Developer

**Irfan Ahmed Mir**

GitHub: [@irfan000](https://github.com/irfan000)

Project: [Hamsafar](https://github.com/irfan000/Hamsafar)

---

### Building Hamsafar with the goal of making meaningful connections easier.
