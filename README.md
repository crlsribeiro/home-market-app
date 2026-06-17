# 🛒 Home Market Manager

A family shopping list PWA with role-based access, push notifications, and weekly purchase history.

---

## 🔍 Overview

- 📱 PWA installable on mobile — works on any browser
- 👨‍👩‍👧‍👦 Family-based access with invite link
- 🔐 Role system: Admin controls the flow, members add items
- 🔔 Push notifications via Firebase Cloud Messaging
- 🧾 Purchase history with receipt upload
- ☁️ Firebase backend — Auth, Firestore, Storage, Functions

---

## 💡 Concept

Family shopping is often disorganized — duplicated items, no visibility on what's been picked, and no spending history.

**Home Market Manager** solves this by giving each week a structured lifecycle:

- Members add items freely when the list is **open**
- Admin locks the list and approves late additions
- Admin enters **shopping mode** at the store — members see a live waiting screen
- Items not found trigger an **instant push notification** to whoever requested them
- After checkout, the receipt is uploaded and prices are extracted automatically

---

## 🧱 Architecture

src/

├── hooks/          (useAuth, useList, useHousehold, useHistory)

├── screens/        (Login, Register, MainList, ShoppingMode, AdminPanel, History)

├── components/     (BottomNav, Toast, AddItemSheet, NotFoundModal)

└── lib/            (firebase.ts, utils.ts)
functions/

└── src/index.ts    (Cloud Functions: onItemAdded, onItemNotFound)

---

---

## 🚀 Features

- 🔐 Firebase Auth — email/password + Google Sign-In
- 👨‍👩‍👧‍👦 Household management with invite token
- 📋 Weekly list with lifecycle: `open → locked → shopping → closed`
- 🛒 Shopping mode — admin-only, marks items as picked or not found
- 🔔 Push notifications when an item is not found at the store
- 📸 Product photos via Firebase Storage
- 🧾 Purchase history with receipt upload and price extraction
- 💰 Price visibility — admin only
- 📱 PWA — installable, works offline-ready

---

## 🛠️ Tech Stack

### Frontend

| Technology | Role |
|---|---|
| React + TypeScript | UI framework |
| TailwindCSS | Styling |
| Vite | Build tool |

### Backend & Services

| Service | Role |
|---|---|
| Firebase Auth | User authentication |
| Firestore | Database |
| Firebase Storage | Product & receipt photos |
| Firebase Hosting | PWA hosting |
| Firebase Cloud Functions | Push notification triggers |
| FCM | Push notifications |

---

## 🌐 Live Demo

👉 [home-market-3d9da.web.app](https://home-market-3d9da.web.app)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Firebase project configured

### Setup

1. Clone the repository:

1. Clone the repository:
git clone https://github.com/crlsribeiro/home-market-app.git

2. Install dependencies:
npm install

3. Create a `.env` file at the root:
VITE_FIREBASE_API_KEY=your_key

VITE_FIREBASE_AUTH_DOMAIN=your_domain

VITE_FIREBASE_PROJECT_ID=your_project_id

VITE_FIREBASE_STORAGE_BUCKET=your_bucket

VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id

VITE_FIREBASE_APP_ID=your_app_id

4. Run locally:
npm run dev

### Deploy
npm run build

firebase deploy --only hosting

firebase deploy --only functions

---

## 📄 License
MIT License — feel free to use, modify, and distribute.

