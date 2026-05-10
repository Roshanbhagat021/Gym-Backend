# 🏋️‍♂️ Gym Management System - Backend

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeORM-FE0803?style=for-the-badge&logo=typeorm&logoColor=white" alt="TypeORM" />
</p>

## 🌟 Introduction

Welcome to the **Gym Management System Backend**! This is a powerful, production-ready API designed to streamline gym operations. Whether you're managing members, handling recurring payments, or tracking staff actions, this system provides a robust foundation for your fitness business.

> [!NOTE]
> This project is built with **NestJS**, a progressive Node.js framework for building efficient and scalable server-side applications.

---

## ✨ Key Features

### 👤 Member Management
- **Smooth Onboarding**: Easily register new members with secure password hashing.
- **Profile Snapshots**: Automatically capture member details, emergency contacts, and active memberships.

### 📜 Membership Plans
- **Dynamic Plans**: Create flexible plans with different durations (Daily, Monthly, Yearly).
- **Historical Accuracy**: 🛡️ **Unique Feature**: When a member joins, we snapshot the plan's price and name. Even if you change your plan prices later, historical records stay accurate!

### 💳 Payments & Billing
- **Multiple Gateways**: Integrated support for Cash, Razorpay, and PhonePe.
- **Auto-Activation**: Memberships are automatically activated or queued as "Upcoming" upon successful payment.

### 🔍 Global Audit Logging
- **Total Transparency**: Every sensitive action (Create, Update, Delete) is automatically logged.
- **Time Travel**: The system records exactly what data looked like **before** and **after** an update, so you never lose track of changes.

---

## 🛠️ Tech Stack

- **Backend**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Security**: JWT Authentication + Bcrypt hashing
- **Documentation**: Swagger API UI

---

## 🚀 Quick Start (For Beginners)

Getting started is easy! Just follow these steps:

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [PostgreSQL](https://www.postgresql.org/) installed on your computer.

### 2. Installation
Open your terminal and run:
```bash
npm install
```

### 3. Environment Setup
Create a file named `.env` in the root directory and add your database credentials (check `.env.example` if available).

### 4. Running the App
Start the server in development mode:
```bash
npm run start:dev
```
Your API will be running at `http://localhost:3000`!

---

## 📖 API Documentation

Once the server is running, you can explore all available endpoints using our built-in **Swagger UI**:

👉 [http://localhost:3000/api](http://localhost:3000/api)

This interactive page allows you to test every feature directly from your browser.

---

## 🏗️ Architecture Highlights

### **1. Data Snapshotting**
We don't just link to a Plan ID. We copy the `pricePaid` and `planName` into the `MemberMembership` record. This prevents financial discrepancies when plan prices are updated in the future.

### **2. Global Audit Interceptor**
We use a high-level NestJS Interceptor that watches all `POST`, `PATCH`, and `DELETE` requests. It automatically identifies the user and the entity being changed, logging the "Before" and "After" states without requiring manual code in every service.

---

## 📜 License

This project is licensed under the MIT License. Feel free to use it for your own gym or project!

---
<p align="center">Made with ❤️ for Fitness Entrepreneurs</p>
