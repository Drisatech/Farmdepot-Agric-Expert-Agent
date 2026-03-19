# 🌾 FarmDepot Agric Expert Agent

> **An AI-powered multilingual voice assistant enabling farmers to access digital marketplaces using natural speech.**

---

## 🚀 Live Demo

🔗 *[Farmdepot Agric Expert Agent](https://farmdepot-chatbot-448742322230.us-west1.run.app/)*

📹 *Demo Video:* *YouTube link*

---

## 🧠 Problem Statement

Millions of farmers across Africa face a critical barrier:

[
\text{Market Access} = f(\text{Literacy}, \text{Language}, \text{Digital Skills})
]

Unfortunately:

* Many farmers are **non-literate**
* Most platforms are **English-only**
* Interfaces require **typing and navigation skills**

👉 Result: **Farmers are digitally excluded despite having products to sell.**

---

## 💡 Solution

**FarmDepot Agric Expert Agent** transforms digital access into a **voice-first, multilingual experience**.

Users can:

* 🎤 Speak in their **native language**
* 🛒 Post agricultural products
* 🔍 Search for buyers/sellers
* 🔊 Receive voice responses
* 📩 Automatically log and report interactions

---

## ✨ Key Features

* 🌍 **Multilingual AI Support** (English, Hausa, Yoruba, Igbo)
* 🎙️ **Speech-to-Text & Text-to-Speech (Gemini APIs)**
* 🧠 **AI Intent Detection & Smart Response Generation**
* 💬 **Voice + Text Interaction**
* ☁️ **Cloud-native scalable architecture (Google Cloud Run)**
* 📊 **Session logging & analytics via Firestore**
* 📧 **Automated email reporting (Nodemailer/SMTP)**

---

## 🏗️ Architecture Diagram

![FarmDepot Architecture](public/app%20images/Farmdepot%20Agric%20Expert%20Agent%20Architecture%20Daigram.png)

---

## ⚙️ Tech Stack

### 🖥️ Frontend

* WordPress (Main Platform)
* React (Embedded AI Widget)

### 🧩 Backend

* Node.js
* Express.js

### 🧠 AI & Voice

* Google Gemini APIs (Speech-to-Text, Language, Reasoning)
* WebSocket / Gemini TTS for voice output

### 🗄️ Database

* Google Firestore

### ☁️ Cloud & DevOps

* Google Cloud Run (Deployment & Scalability)
* Google Cloud Functions (Event Processing)
* GitHub (CI/CD & Version Control)

### 📧 Communication Layer

* Nodemailer / SMTP (Automated email reports)

---

## 🔄 System Workflow

```mermaid
flowchart LR
    A[User Voice/Text Input] --> B[React Widget (WordPress)]
    B --> C[Node.js Backend]
    C --> D[Gemini APIs]
    C --> E[Firestore Database]
    E --> F[Cloud Function]
    F --> G[Email Report (SMTP)]
    C --> H[Response Generation]
    H --> B
    B --> A
```

---

## 🧠 How It Works

1. User interacts via voice/text on the website
2. Input is processed using **Gemini Speech-to-Text**
3. Backend performs:

   * Language detection
   * Translation (if needed)
   * Intent recognition
4. Action is executed:

   * Post product OR search listings
5. Data is stored in **Firestore**
6. **Cloud Function triggers:**

   * Structures session logs
   * Sends formatted report via email
7. Response is converted to speech and returned to the user

---

## 🚧 Challenges We Faced

* 🎙️ Handling **diverse local accents**
* 🌍 Maintaining **translation accuracy across languages**
* 🔗 Integrating **voice + AI + database seamlessly**
* 📶 Optimizing for **low-bandwidth environments**
* ⚡ Real-time processing with minimal latency

---

## 🏆 Achievements

* ✅ Built a **working real-time AI voice agent**
* ✅ Enabled **non-literate farmers to use digital platforms**
* ✅ Integrated **end-to-end multilingual pipeline**
* ✅ Designed a **scalable cloud-native architecture**
* ✅ Implemented **automated session intelligence & reporting**

---

## 📚 What We Learned

* Inclusion is the **true power of AI**
* Voice interfaces are critical for **emerging markets**
* Simplicity drives **adoption**
* Local context matters more than global assumptions

---

## 🔮 Future Roadmap

### 🌱 Short-Term

* Add more languages (Ebira, Igala)
* Improve speech accuracy with local datasets
* Offline/low-data mode

### 🚀 Long-Term Vision

[
\text{Goal: } >80% \text{ adoption among Nigerian farmers in 5 years}
]

* WhatsApp voice integration
* AI-driven price prediction
* Logistics & delivery integration
* Expansion across Africa

---

## 👤 Author

**Aliyu Idris Adeiza**
AI Engineer | Data Scientist | Founder, FarmDepot

* 🌐 GitHub: *[GitHub:](https://github.com/Drisatech/)*
* 💼 LinkedIn: *[LinkedIn](https://linkedin.com/in/aliyu-idris/)*
* 📧 Email: *drisatech@gmail.com*

---

## 🤝 Contributing

Contributions, ideas, and collaborations are welcome!

---

## 🧾 License

This project is provided for educational and hackathon purposes.
All rights reserved © 2026.

---

## 🌍 Final Note

> *This is not just an AI system — it is a bridge between farmers and opportunity.*
