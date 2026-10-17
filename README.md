# AptiLearn — Full-Stack Learning Platform

AptiLearn is a modern, feature-rich full-stack web application designed for interactive student learning, progress tracking, and dynamic video integration, powered by a robust Node.js/Express backend, MongoDB database, and a React/Vite frontend.

---

## 🚀 Key Features

* **Secure Authentication:** Integrated Google OAuth (Sign-In) alongside traditional admin/student login capabilities.
* **Dynamic Video Lessons:** Seamlessly integrates the YouTube Data API v3 to fetch and stream real-time educational lesson videos directly into the platform.
* **Interactive AI Assistant (AptiBot):** Built-in floating AI assistant support for real-time student Q&A and guidance.
* **Admin AI Question Builder:** Automated quiz and question generation tools designed for instructors and administrators.
* **Progress Tracking & Rankings:** Real-time streak tracking, user rankings, course completion management, and diagnostic quizzes.
* **Database Storage:** Powered by MongoDB for reliable, cloud-ready data persistence.

---

## 🛠️ Tech Stack

* **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
* **Backend:** Node.js, Express.js
* **Database:** MongoDB / MongoDB Atlas
* **APIs & Auth:** YouTube Data API v3, Google OAuth Client ID, Anthropic API

---

## 📂 Project Structure

```text
aptilearn/
├── client/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/     # UI components (VideoPlayer, AptiBot, etc.)
│   │   ├── pages/          # Dashboard, Admin portal, and course views
│   │   └── ...
├── server/                 # Node.js + Express backend server
│   ├── src/
│   │   ├── routes/         # API routes (auth, courses, youtube, ai)
│   │   ├── models/         # MongoDB schemas and models
│   │   └── ...
└── package.json            # Root configuration and workspaces
