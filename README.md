# Malicious-Email-Scorer

Shield Malware Scorer is a security-focused Gmail add-on that provides real-time phishing detection and risk assessment. It evaluates incoming messages through a transparent 5-point security scan to help users identify malicious intent before interacting with content.

🛡 Implemented Features: The 5-Point Scan
1. Personal Blacklist
Users can manually flag dangerous senders. Once blacklisted, all future emails from that address are automatically assigned a maximum risk score (100).

2. Domain Identity (Typosquatting)
The system uses the Levenshtein Distance algorithm to detect brand impersonation.

What it is: It measures the edit distance (insertions, deletions, substitutions) between strings.

Implementation: If a sender's domain is within 1 or 2 edits of a trusted brand (e.g., amaz0n.com vs amazon.com), it is flagged as a high-confidence threat.

3. Email Authentication Check
The scanner verifies three critical hidden security standards in the email headers:

SPF (Sender Policy Framework): Validates if the sending server is authorized.

DKIM (DomainKeys Identified Mail): Uses a digital signature to ensure the content was not tampered with.

DMARC: A policy layer that ties SPF and DKIM together to prevent spoofing.

4. Link Safety Analysis
A deep heuristic scan that analyzes link behavior:

Volume: Flags emails with an unusually high number of links.

Obfuscation: Detects URL shorteners and Open Redirects (links that use trusted domains to mask a malicious destination).

5. AI Intent Analysis (Current: Mock / Future: Gemini API)
This signal analyzes the psychological tone of the message to identify social engineering.

Current State: Implemented as a rule-based Mock API that identifies high-risk keywords and urgent phrasing.

Improvement Path: Designed to integrate with the Gemini 1.5 Flash API using a specialized system prompt for deep behavioral analysis.

💾 Technical Decisions: Why PropertiesService?
The project utilizes Google's native PropertiesService.getUserProperties() for data persistence:

Performance: Near-instant read/write operations within the Apps Script environment.

Privacy: Data is scoped strictly to the individual user's account, ensuring high data security.

Maintenance: Removes the need for external database management (like SQL or Firebase) for a lightweight, self-contained solution.

🚀 Deployment
Create a new project in Google Apps Script.

Copy the provided .gs and appsscript.json files.

Set Script Property: Add your GEMINI_API_KEY in the Project Settings.

Test Deployment: Click Deploy > Test Deployments > Install.

⚠️ Known Limitations & Future Roadmap
AI Engine Enhancement: The current AI analysis is a rule-based mock. Transitioning to a live LLM API (like Gemini) would provide significantly better detection of complex psychological manipulation.

Dynamic Threat Intelligence: The brand list for typosquatting detection is currently hardcoded in Constants.gs. Future versions could integrate with Google Safe Browsing or the VirusTotal API for real-time, global threat intelligence.

Spam Folder Restriction: Due to Google’s native security architecture, third-party add-ons are often restricted from running active scripts in the Spam folder to prevent accidental execution of malicious code.
