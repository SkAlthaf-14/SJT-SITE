# SJT FARMS — Meta WhatsApp Cloud API Onboarding & Coexistence Guide

> **CRITICAL PRODUCTION SAFETY NOTICE FOR +91 8121020111**  
> **DO NOT** attempt to register `+91 8121020111` directly in the Meta Cloud API dashboard without reading the **Coexistence vs Standard Onboarding** section below.  
> Standard registration will **immediately and permanently deregister** the number from the WhatsApp Business mobile app on the owner's phone.  
> The website's native Click-to-Chat (`wa.me`) integration is already active and works 100% safely with the mobile app today without any disruption.

---

## Table of Contents
1. [Understanding Number Architectures (Safety First)](#1-understanding-number-architectures)
2. [Step 1: Create Meta Developer Account & Business App](#step-1-create-meta-developer-account--business-app)
3. [Step 2: Add WhatsApp Product & Get Test Sandbox](#step-2-add-whatsapp-product--get-test-sandbox)
4. [Step 3: Configure & Verify the Cloud Functions Webhook](#step-3-configure--verify-the-cloud-functions-webhook)
5. [Step 4: Test Inbound and Outbound Messages](#step-4-test-inbound-and-outbound-messages)
6. [Step 5: Business Portfolio & WABA Verification](#step-5-business-portfolio--waba-verification)
7. [Step 6: Phone Number Coexistence vs Migration Analysis](#step-6-phone-number-coexistence-vs-migration-analysis)
8. [Step 7: Configure Message Templates for Notifications](#step-7-configure-message-templates-for-notifications)
9. [Step 8: Secrets Management (Never Commit Secrets)](#step-8-secrets-management)
10. [Checklist for Safe Production Go-Live](#10-checklist-for-safe-production-go-live)

---

## 1. Understanding Number Architectures

Meta offers three distinct operational setups:

| Setup Mode | How It Works | Impact on Phone's WhatsApp Business App | Recommended For |
| :--- | :--- | :--- | :--- |
| **1. Meta Test Number (Sandbox)** | Meta provides a free virtual US test number (e.g. `+1 555-xxx-xxxx`) directly inside your developer dashboard. | **ZERO IMPACT**. +91 8121020111 continues operating as normal on the phone. | **Developing, testing webhooks, verifying chatbot logic & orders.** |
| **2. Coexistence Mode (Cloud API + Mobile App)** | Supported by Meta via **Embedded Signup** (typically through an official Tech Provider or Meta Business Solution Partner). Allows incoming/outgoing messages on both the Cloud API and mobile WhatsApp Business app simultaneously. | Preserves the mobile app, but requires specific Meta eligibility, Embedded Signup v3, and dual-routing support. | **Production only after verifying account eligibility in Business Manager.** |
| **3. Standard Cloud API Migration** | Registers the phone number exclusively with Meta's Cloud servers. | **DELETES/DEREGISTERS** the account from the mobile app. The owner can no longer use the WhatsApp Business app on their smartphone. | **Only recommended if using a dedicated CRM / shared inbox dashboard (Zendesk, Freshchat, etc.).** |

> **Recommendation for SJT FARMS:**  
> Start with **Mode 1 (Test Sandbox)** for 100% of bot validation and webhook testing. Maintain the website's active Click-to-Chat (`wa.me`) buttons for real customer interactions until Coexistence Mode eligibility is verified.

---

## Step 1: Create Meta Developer Account & Business App

1. Go to [https://developers.facebook.com/](https://developers.facebook.com/) and click **Log In** using your primary business Facebook account.
2. If this is your first time, click **Get Started** and verify your account via mobile SMS.
3. Click **My Apps** in the top navigation bar, then click the green **Create App** button.
4. **Select App Type:**
   - Choose **Other** (or **Business** if presented directly).
   - Select **Business** as the app type and click **Next**.
5. **App Details:**
   - **App Name:** `SJT FARMS WhatsApp Concierge`
   - **App Contact Email:** Enter your business email (e.g., `contact@sjtfarms.com`).
   - **Business Portfolio:** Select your **SJT FARMS** Meta Business Account (or create one if not yet created).
6. Click **Create App** and enter your Facebook password to confirm.

---

## Step 2: Add WhatsApp Product & Get Test Sandbox

1. On your new app's **Dashboard**, scroll down to find the **Add products to your app** section.
2. Locate **WhatsApp** and click **Set Up**.
3. You will be taken to **WhatsApp > API Setup** in the left sidebar.
4. Meta automatically creates:
   - A **Test Phone Number** (e.g., `+1 555 085 4101`).
   - A **Phone Number ID** (e.g., `104857201948102`).
   - A **WhatsApp Business Account (WABA) ID** (e.g., `102948102948192`).
   - A **Temporary Access Token** (valid for 24 hours).
5. **Authorize Your Personal Phone for Testing:**
   - In the **To** field under "Send and receive messages", select **Manage phone number list**.
   - Enter your personal phone number with country code (e.g. `+91 9876543210` or `+91 8121020111`).
   - Enter the 6-digit verification code sent via WhatsApp to your phone.
   - Click **Send Message**. You will immediately receive a test "Hello World" template on your phone from Meta!

---

## Step 3: Configure & Verify the Cloud Functions Webhook

Your Firebase Cloud Function is ready to receive and process webhook events at:
```
https://us-central1-sjtfarms-5eaeb.cloudfunctions.net/whatsappWebhook
```

### 1. In Meta App Dashboard:
1. In the left sidebar, click **WhatsApp** > **Configuration**.
2. Under **Webhook**, click **Edit**.
3. **Callback URL:**
   ```
   https://us-central1-sjtfarms-5eaeb.cloudfunctions.net/whatsappWebhook
   ```
4. **Verify Token:**
   Enter the secret verification token you configure in Firebase Secrets (e.g. `SjtFarms_Verify_2026_SecureKey`).
5. Click **Verify and Save**. Meta will send a `GET` request with challenge parameters. The function verifies the token and responds with the challenge, completing verification instantly.

### 2. Subscribe to Webhook Fields:
1. In the same Webhook section, click **Manage** under "Webhook fields".
2. Locate **messages** and click **Subscribe**.
3. (Optional) Locate **message_template_status_update** and click **Subscribe**.

---

## Step 4: Test Inbound and Outbound Messages

1. Open WhatsApp on your authorized tester phone.
2. Send a message saying **"Hi"** or **"Menu"** to the Meta Test Number provided in Step 2.
3. Observe the automated response:
   - The bot responds with the bilingual greeting:
     *"Welcome to SJT FARMS Coffee! ☕ Discover our Araku coffee collection. How can we help you today?"*
   - It presents the 9 interactive options / numbered menu:
     1. Explore Products
     2. Check Prices & Pack Sizes
     3. Product Recommendations
     4. Place / Complete Order
     5. Payment Assistance (Manual UPI)
     6. Track an Order
     7. Shipping & Delivery
     8. Cancellation & Refunds
     9. Talk to Human / Contact Us
4. Test sending `1` or `PRODUCTS` to inspect the 4 authentic Araku coffee blends.
5. Test sending `TELUGU` to switch language, and `ENGLISH` to return.
6. Test order tracking by typing `TRACK SJT-1001` or entering your registered phone number.

---

## Step 5: Business Portfolio & WABA Verification

To move from sandbox to production:
1. Visit **Meta Business Settings**: [https://business.facebook.com/settings](https://business.facebook.com/settings)
2. Go to **Security Center** > **Business Verification**.
3. Upload official business documentation for SJT FARMS (GST Certificate, FSSAI registration, or Business Bank Statement matching the legal business name and address).
4. Once verified, your messaging tier increases from 250 conversations/day to 1,000 to 10,000+ conversations/day.
5. Create a **System User** to obtain a permanent access token:
   - Go to **Users** > **System Users** > Click **Add**.
   - Name: `sjt-cloud-api-bot`. Role: `Admin`.
   - Click **Add Assets** > assign your App and WABA with full access.
   - Click **Generate New Token**, select permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
   - Store this token securely in Firebase Secret Manager.

---

## Step 6: Phone Number Coexistence vs Migration Analysis

### The Problem:
SJT FARMS has built valuable customer goodwill on `+91 8121020111` using the WhatsApp Business mobile app.

### Analysis of Coexistence:
- **What is WhatsApp Business App Coexistence?**  
  Meta introduced coexistence allowing businesses to use the WhatsApp Business App on a smartphone AND connect the Cloud API simultaneously.
- **Requirements for Coexistence:**
  1. The onboarding MUST occur through **Embedded Signup** (OAuth flow initiated by an approved Meta Tech Provider or Partner).
  2. Coexistence cannot be activated through the basic developer app dashboard direct-registration modal (doing that directly prompts to delete the mobile app).
  3. The phone must remain connected with WhatsApp Business app version 2.24.17+ or newer.
- **Safety Protocol:**
  - **Do NOT enter `+91 8121020111` into the standard "Add Phone Number" screen in Developer App.**
  - If you want automated bots on `+91 8121020111` without losing the phone app, use an official Meta Tech Provider (such as Wati, Interakt, Aisensy, or Meta's official Embedded Signup SDK).
  - Alternatively, use a **dedicated secondary virtual number** for the Cloud API automated concierge, while keeping `+91 8121020111` for VIP direct human chat.

---

## Step 7: Configure Message Templates for Notifications

Outside the 24-hour customer service window, notifications (order updates, shipping tracking, payment confirmation) require pre-approved Meta message templates.

In **WhatsApp Manager** ([https://business.facebook.com/wa/manage/home](https://business.facebook.com/wa/manage/home)), go to **Account Tools** > **Message Templates** > **Create Template**:

### 1. Template: `sjt_order_received`
- **Category:** `UTILITY`
- **Language:** English (`en_US`)
- **Body:**
  ```text
  Hello {{1}}! ☕
  Thank you for your order with SJT FARMS Coffee.
  Order ID: #{{2}}
  Total Amount: ₹{{3}}
  Payment Method: Manual UPI Verification
  
  We will verify your payment and roast your coffee fresh from Araku Valley.
  Track your order: https://sjtfarms.com/#track-order?order={{2}}
  ```

### 2. Template: `sjt_payment_verified`
- **Category:** `UTILITY`
- **Language:** English (`en_US`)
- **Body:**
  ```text
  Hello {{1}}! ☕
  Great news! Your payment of ₹{{3}} for order #{{2}} has been verified.
  Your coffee is now being queued for fresh roasting and packaging.
  Track your order: https://sjtfarms.com/#track-order?order={{2}}
  ```

### 3. Template: `sjt_order_shipped`
- **Category:** `UTILITY`
- **Language:** English (`en_US`)
- **Body:**
  ```text
  Hello {{1}}! ☕
  Your SJT FARMS order #{{2}} has been shipped via {{3}}!
  Tracking Number / AWB: {{4}}
  
  Track your delivery live: https://sjtfarms.com/#track-order?order={{2}}
  ```

---

## Step 8: Secrets Management

### ⚠️ NEVER SHARE OR COMMIT SECRETS
Never paste tokens or secrets in chat, public tickets, or Git repositories.

### Setting Secrets in Firebase Cloud Functions:
Run the following Google Cloud / Firebase CLI commands on your local machine:
```bash
firebase functions:secrets:set META_WA_ACCESS_TOKEN
# When prompted, paste your permanent Meta System User token

firebase functions:secrets:set META_APP_SECRET
# When prompted, paste your Meta App Secret from App Settings > Basic

firebase functions:secrets:set META_WA_WEBHOOK_VERIFY_TOKEN
# When prompted, paste your secret webhook verify string (e.g. SjtFarms_Verify_2026_SecureKey)
```

The Cloud Functions in `functions/src/config.ts` will automatically read these securely at runtime using Google Cloud Secret Manager.

---

## 10. Checklist for Safe Production Go-Live

- [x] Website Click-to-Chat (`wa.me`) active with bilingual templates and copy-to-clipboard fallback.
- [x] Cloud Functions webhook GET verification implemented.
- [x] HMAC-SHA256 request signature validation implemented.
- [x] Chatbot state machine with 9 menu options, numbered replies, and Telugu support implemented.
- [x] Product catalogue synced with 4 authentic Araku blends (50g, 100g, 250g) and canonical store links.
- [x] Customer order privacy verification (phone number match required before revealing details).
- [x] Safe human-agent handoff implemented without echo loops.
- [ ] Meta Developer App created by business owner.
- [ ] Test number validated with incoming and outgoing WhatsApp messages.
- [ ] Business Verification submitted on Meta Business Manager.
- [ ] Production System User token generated and stored in Firebase Secret Manager.
- [ ] Production Coexistence verified before attempting any migration of `+91 8121020111`.
