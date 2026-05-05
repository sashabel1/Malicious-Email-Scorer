# 🛡️ Shield Malware Scorer
**A Smart Gmail Security Add-on for Real-Time Phishing Detection**

Shield Malware Scorer is a specialized security tool designed to identify phishing attempts and malicious intent directly within the Gmail interface. It evaluates incoming messages through a **transparent 5-point security scan**, providing users with a comprehensive risk assessment before they interact with potentially dangerous content.

---

## 🛡️ Key Features: The 5-Point Scan

### 1️⃣ Personal Blacklist
Empowers users to take control of their inbox security.
* **Manual Flagging:** Users can manually block dangerous or repetitive senders.
* **Instant Enforcement:** Once an address is blacklisted, all future emails from that sender are automatically assigned a maximum **Risk Score of 100**.

---

### 2️⃣ Domain Identity (Typosquatting)
Detects sophisticated brand impersonation using the **Levenshtein Distance algorithm**.

> **What is it?**
> It measures "edit distance"—the number of character changes (insertions, deletions, or substitutions) needed to turn one string into another.

* **The Logic:** If a sender’s domain is only 1 or 2 edits away from a trusted brand (e.g., `amaz0n.com` vs. `amazon.com`), the system flags it as a high-confidence threat.

---

### 3️⃣ Email Authentication Check
The scanner performs a deep-dive into hidden email headers to verify industry-standard security protocols:
* **SPF (Sender Policy Framework):** Validates that the sending server is authorized by the domain owner.
* **DKIM (DomainKeys Identified Mail):** Uses digital signatures to ensure the email content wasn't tampered with during transit.
* **DMARC:** A critical policy layer that ties SPF and DKIM together to prevent advanced spoofing.

---

### 4️⃣ Link Safety Analysis
A heuristic scan that analyzes the behavior and structure of embedded links:
* **Volume Detection:** Flags emails containing an unusually high number of links, a common tactic in mass phishing.
* **Obfuscation Detection:** Identifies URL shorteners and **Open Redirects**—malicious links that use trusted domains (like Google) as a "mask" to redirect users to scam sites.

---

### 5️⃣ AI Intent Analysis
Analyzes the psychological tone of the message to identify social engineering tactics.
* **Current State:** Operates via a **rule-based Mock API** that identifies high-risk keywords and urgent phrasing.
* **Future Roadmap:** Designed for full integration with the **Gemini 1.5 Flash API** to perform deep behavioral and contextual analysis.

---

## 💾 Technical Decisions: Why `PropertiesService`?

Rather than using an external database, this project utilizes Google’s native `PropertiesService.getUserProperties()` for data persistence.

* **⚡ Performance:** Provides near-instant read/write operations within the Apps Script environment.
* **🔒 Privacy:** Data is scoped strictly to the individual user’s account, ensuring high security and no cross-user data exposure.
* **🛠️ Maintenance:** Eliminates the need for external server management (like SQL or Firebase), resulting in a lightweight and self-contained solution.

---

## 🚀 Deployment Instructions

Follow these steps to deploy the add-on to your environment:

1. **Create Project:** Open [Google Apps Script](https://script.google.com/) and create a new project.
2. **Copy Files:** Copy the provided `.gs` files and the `appsscript.json` manifest into your project.
3. **Configure API:** In **Project Settings**, add a new Script Property:
   * **Key:** `GEMINI_API_KEY`
   * **Value:** [Your Gemini API Key]
4. **Install:** Click **Deploy** > **Test Deployments** > **Install**.

---

## ⚠️ Known Limitations & Future Roadmap

* **AI Engine:** The current analysis is a rule-based mock. Moving to a live LLM API (Gemini) is the priority to improve detection of complex manipulation.
* **Threat Intelligence:** Typosquatting brands are currently hardcoded in `Constants.gs`. Future iterations will integrate with the **Google Safe Browsing** or **VirusTotal API** for real-time global updates.
* **Spam Folder Restrictions:** Due to Google’s native security architecture, third-party add-ons are restricted from running active scripts in the **Spam folder** to prevent the accidental execution of malicious code.

---
link: https://script.google.com/d/1Tx71dn-tfRiLAHp_Wh9_EL_vhpz9dsdany2kWuFs7rvvbW5sdpQyUC26/edit?usp=sharing
