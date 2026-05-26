# 🧠 Neurovascular Dynamic Lab (NeuroDynamic Learning)
[![Platform Status](https://img.shields.io/badge/Status-Active-brightgreen)](https://gideon-olukanni.github.io/neurovascular-dynamic-lab/)
[![Hosting](https://img.shields.io/badge/Hosted_on-GitHub_Pages-blue)](https://gideon-olukanni.github.io/neurovascular-dynamic-lab/)
[![Database](https://img.shields.io/badge/Backend-Firebase-orange)](https://firebase.google.com/)
[![Code Philosophy](https://img.shields.io/badge/Architecture-Vanilla_JS-yellow)]()
The Neurovascular Dynamic Lab is a comprehensive, full-stack neuroscience educational platform engineered entirely from scratch without the use of templates or heavy JavaScript frameworks. 
Built to democratize access to high-level STEM and neuroengineering concepts, the platform features 11 highly interactive modules that bridge the gap between complex brain biology and intuitive, gamified user experiences. 
🔗 **Live Application:** [gideon-olukanni.github.io/neurovascular-dynamic-lab](https://gideon-olukanni.github.io/neurovascular-dynamic-lab/)
---
## 🛑 Development Context & Constraints (The "No Excuses" Architecture)
This platform was not built in a traditional development environment. It was engineered under extreme hardware, environmental, and temporal constraints, proving a commitment to building critical infrastructure regardless of limitations.
* **100% Mobile-Engineered:** Every line of HTML, custom CSS, Vanilla JS, and Firebase backend logic—including complex SVG DOM manipulation—was typed, tested, and deployed entirely on a mobile smartphone screen without a physical keyboard or laptop.
* **Built Under Academic Fire:** The core infrastructure and logic were architected during the 2026 West African Senior School Certificate Examination (WASSCE) period. Development occurred simultaneously alongside intense academic preparation for advanced sciences (Physics, Chemistry, etc.), demonstrating an uncompromising intrinsic drive to build.
* **Low-Bandwidth Optimization:** Designed specifically for the African digital landscape, the architecture deliberately avoids bloated libraries (like React or Angular) to ensure the platform loads lightning-fast on erratic or expensive mobile data networks.
## 🚀 Core Features & Infrastructure
### 1. Interactive Anatomical Mapping (`brain-map.html`)
* Features a custom SVG-mapped lateral hemisphere.
* Implements asynchronous JavaScript listeners across 12 distinct anatomical zones. Interacting with these zones triggers dynamic DOM updates detailing structural functions, clinical neuropathology (e.g., Ischemic stroke, Alzheimer's etiology), and core biological facts.
### 2. Cognitive State Management & Learning (`learn.html`)
* Integrates a live Firebase Realtime Database backend to synchronize student progression and state.
* Features a custom-built **Pomodoro Engine** to mathematically optimize study sessions, preventing cognitive fatigue and leveraging spaced-repetition principles directly within the UI.
### 3. Gamified Assessment Suite (`quiz.html` & `flashcards.html`)
* **Dynamic Quiz Engine:** A 20-question timed assessment tool scaling from Beginner to Advanced tiers, featuring cloud-saved high-score tracking and immediate answer-validation logic.
* **Active Recall Deck:** A 30-card spaced-repetition flashcard system spanning 5 core neuro-disciplines, designed for rapid memory consolidation.
### 4. Infrastructure-Empathetic Resources (`resources.html`)
* Recognizing that students frequently lose internet access, this module offers highly compressed, cleanly formatted offline resources.
* Includes downloadable PDF curriculum modules, anatomical puzzles, and offline glossaries designed for deep, disconnected study.
---
## 💻 Technical Specifications
To ensure maximum performance and absolute control over the codebase, this application relies exclusively on foundational web technologies:

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend/UI** | Semantic HTML5, CSS3 (CSS Variables, Flexbox/Grid layouts, fluid typography for mobile-first responsiveness). |
| **Logic & State** | Vanilla ECMAScript 6+ JavaScript (Event delegation, asynchronous callbacks, DOM manipulation, `localStorage` API). |
| **Backend (BaaS)** | Firebase SDK (Authentication for user sessions, Realtime Database for metric tracking). |
| **Deployment** | Git & GitHub Pages for continuous delivery. |

---
## 🔧 Local Setup & Development
While this platform was coded on a mobile device (utilizing mobile IDEs), it can be cloned and run on standard development machines.
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Gideon-olukanni/neurovascular-dynamic-lab.git](https://github.com/Gideon-olukanni/neurovascular-dynamic-lab.git)
   cd neurovascular-dynamic-lab
