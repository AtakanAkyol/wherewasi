# WhereWasI? 🎬

[🇹🇷 Türkçe Sürüm İçin Aşağıya Kaydırın (Scroll down for Turkish)](#türkçe-sürüm-tr)

A cross-platform (Web & Android) TV series tracking application that helps users find where they left off or "vaguely remember" using AI. This project aims to deliver a Full-Stack SaaS architecture by combining modern web technologies with a native mobile experience.

## 🌐 Live Demo & Test Account

You can try the application directly without setting it up locally:

* **Live Web Version:** [wherewasi.vercel.app](https://wherewasi.vercel.app) *(Kendi Vercel linkinle değiştir)*
* **Test Account Email:** `test@mail.com`
* **Test Account Password:** `test1234`

*(Note: The test account has been granted direct access via Supabase, bypassing the email verification step.)*

## 📸 Screenshots

*(Add your screenshots here by dragging and dropping them into the GitHub editor)*
![Search and Discover Screen](link-1-here)
![AI Memory Scan Result](link-2-here)

## 🚀 Key Features

* **AI-Powered Episode Finder:** The user inputs a vague memory from a show. The system analyzes this text using Gemini AI integration and TMDB API data to pinpoint the exact episode.
* **Binary Search Manual Tracking:** A filtering system that quickly determines where the user left off by narrowing down the pool of watched/unwatched episodes.
* **Cross-Platform Architecture:** Built with a Single Codebase using React, and wrapped with Capacitor to deliver both a modern web app and a hardware-accelerated Android APK.
* **Secure Authentication:** User data isolation is ensured using Supabase infrastructure and RLS (Row Level Security) policies.

## 🛠 Tech Stack

* **Frontend:** React.js, Vite, Tailwind CSS
* **Backend & API:** Supabase (PostgreSQL), TMDB REST API, Google Gemini AI (gemini-flash)
* **Mobile Integration:** Capacitor.js (Android SDK 34)

## 🏗 Engineering Decisions

1. **Why Supabase over Firebase?**
   To maintain relational data integrity and leverage the power of open-source SQL, PostgreSQL-based Supabase was chosen over NoSQL alternatives.
2. **Why Hybrid (Capacitor) over Native?**
   To minimize time-to-market and development costs, the "Write once, run anywhere" philosophy was adopted. UI design is centralized, preventing cross-platform inconsistencies.
3. **Performance Optimization:**
   A **Debounce** method is implemented in the search bar to prevent excessive requests to the TMDB API on every keystroke, avoiding Rate Limit issues.

## 💻 Local Setup

1. Clone the repository:
   ```bash
   git clone [https://github.com/KULLANICI_ADIN/wherewasi.git](https://github.com/KULLANICI_ADIN/wherewasi.git)
