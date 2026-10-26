# SJT FARMS — WhatsApp Business Platform & Cloud API Setup Guide

This guide details the complete, safe, and policy-compliant procedure for connecting SJT FARMS to the official **Meta WhatsApp Business Platform (Cloud API)**.

---

## ⚠️ Critical Number Coexistence & Migration Notice

> **DO NOT MIGRATE OR DISRUPT THE EXISTING WHATSAPP BUSINESS APP NUMBER WITHOUT FORMAL OWNER APPROVAL.**
>
> **Important Meta Rule:** A single phone number **cannot** be simultaneously connected to both the mobile **WhatsApp Business App** on a phone and the **WhatsApp Cloud API / On-Premises API**.
>
> - If `+91 8121020111` is currently registered on the mobile WhatsApp Business App, registering it directly into Cloud API will permanently deregister it from the mobile app.
> - **Recommended Approach:**
>   1. **Phase A (Current):** Use the high-conversion **Click-to-Chat (`wa.me`)** integration currently implemented across the website with bilingual prefilled templates. The business team can continue using the physical phone/WhatsApp Business App without any disruption.
>   2. **Phase B (Cloud API Trial):** Obtain a dedicated secondary or virtual phone number (e.g. from an authorized telecom or virtual number provider) for testing automated Cloud API menus and webhooks.
>   3. **Phase C (Final Production Cutover):** Only migrate `+91 8121020111` to Cloud API when 24/7 server infrastructure, automated agents, or a shared inbox dashboard (like Meta Business Suite or an official BSP) is ready to handle all customer interactions.

---

## Step 1: Meta Developer Account & Business Manager Setup

1. **Log in to Meta for Developers:**
   - Go to [developers.facebook.com](https://developers.facebook.com/) with an administrator Facebook account.
2. **Create a Meta App:**
   - Click **My Apps** > **Create App**.
   - Select **Other** as the use case, then choose **Business** as the app type.
   - Enter App Name: `SJT FARMS WhatsApp Concierge`.
   - Select or connect the verified **Meta Business Account** for SJT Farms.
3. **Add WhatsApp Product:**
   - In the App Dashboard sidebar, scroll to **Add Products to Your App**.
   - Locate **WhatsApp** and click **Set Up**.

---

## Step 2: System User & Permanent Access Token Configuration

> **Note:** Temporary tokens generated in the API Setup tool expire after 24 hours. Production requires a permanent System User Token.

1. Navigate to **Meta Business Settings** ([business.facebook.com/settings](https://business.facebook.com/settings)).
2. Go to **Users** > **System Users** > Click **Add**.
3. Name: `SJT-Farms-Cloud-API-Service`. Role: **Admin** or **Employee**.
4. Click **Assign Assets**:
   - Assign the `SJT FARMS WhatsApp Concierge` app with full control.
   - Assign the **WhatsApp Business Account (WABA)** with full messaging permissions.
5. Click **Generate New Token**:
   - Select App: `SJT FARMS WhatsApp Concierge`.
   - Token Expiration: **Never**.
   - Required Permissions:
     - `whatsapp_business_messaging` (Required to send customer messages)
     - `whatsapp_business_management` (Required to manage templates and account details)
6. Copy the generated permanent token immediately and store it securely in your server's secret manager.

---

## Step 3: Webhook Endpoint Configuration

1. In the Meta App Dashboard, go to **WhatsApp** > **Configuration**.
2. Locate the **Webhook** section and click **Edit**:
   - **Callback URL:** `https://api.sjtfarms.com/webhook/whatsapp` (or your Firebase Functions/Cloud Run URL).
   - **Verify Token:** The secure random token defined in your server environment (`META_WA_WEBHOOK_VERIFY_TOKEN`).
3. Click **Verify and Save**. Meta will execute a `GET` request with `hub.mode=subscribe` and `hub.challenge`. The server's `handleWebhookVerification` in `server/whatsapp-cloud-api/webhookHandler.ts` validates this.
4. Under **Webhook Fields**, click **Manage**:
   - Subscribe to `messages` (incoming texts, button clicks, list selections).
   - Optionally subscribe to `message_template_status_update` and `phone_number_quality_update`.

---

## Step 4: Security & Webhook Signature Validation

Every incoming `POST` request from Meta includes an `X-Hub-Signature-256` header calculated with your `META_APP_SECRET`.
- The handler in `server/whatsapp-cloud-api/webhookHandler.ts` enforces `crypto.timingSafeEqual` to prevent replay and timing attacks.
- Ensure that the raw request body buffer is preserved prior to JSON parsing for accurate HMAC signature computation.

---

## Step 5: Conversation Windows & Messaging Policies

Meta enforces strict customer communication windows:
1. **Customer-Initiated 24-Hour Window (Service Conversation):**
   - When a customer messages SJT Farms (e.g. by tapping "Enquire on WhatsApp" or texting the business number), a 24-hour window opens.
   - Within this 24 hours, the server can send interactive buttons, lists, and free-form text messages without pre-approval.
2. **Business-Initiated Messages (Outside 24-Hour Window):**
   - Any message initiated by SJT Farms outside the 24-hour window (e.g. shipping notifications, payment confirmation alerts) **MUST** use a pre-approved **Meta Template**.
   - Free-form messages sent outside the 24-hour window will be rejected with error code `131047`.

---

## Step 6: Meta Template Registration (Sample Out-of-Session Notification)

Submit the following order dispatch template for approval in the WhatsApp Business Manager:

- **Template Name:** `sjt_order_dispatch_update`
- **Category:** `UTILITY`
- **Languages:** English (`en_US`) and Telugu (`te`)
- **Body Text (English):**
  ```text
  Hello {{1}}! ☕
  Your SJT Farms coffee order #{{2}} has been roasted and dispatched via {{3}}.
  Tracking Number: {{4}}
  Live tracking: https://sjtfarms.com/#track-order?order={{2}}
  ```
- **Body Text (Telugu):**
  ```text
  నమస్కారం {{1}}! ☕
  మీ SJT Farms ఆర్డర్ #{{2}} తాజాగా రోస్ట్ చేయబడి {{3}} ద్వారా పంపబడింది.
  ట్రాకింగ్ నంబర్: {{4}}
  లైవ్ ట్రాకింగ్: https://sjtfarms.com/#track-order?order={{2}}
  ```

---

## Step 7: Environment Variables Setup (Server Only)

In your secure server environment (e.g. Google Cloud Run, AWS Parameter Store, Firebase Cloud Functions config), set:

```env
META_GRAPH_API_VERSION=v21.0
META_APP_ID=<your-app-id>
META_APP_SECRET=<your-app-secret>
META_WA_BUSINESS_ACCOUNT_ID=<your-waba-id>
META_WA_PHONE_NUMBER_ID=<your-phone-number-id>
META_WA_ACCESS_TOKEN=<your-permanent-system-user-token>
META_WA_WEBHOOK_VERIFY_TOKEN=<your-chosen-secret-verify-token>
CANONICAL_STORE_URL=https://sjtfarms.com
```

---

## Step 8: Controlled End-to-End Testing & Rollback Plan

### Testing
1. In Meta App Dashboard, navigate to **WhatsApp** > **API Setup**.
2. Add up to 5 tester mobile numbers under **To** dropdown.
3. Verify test messages from the Meta dashboard.
4. Send "Hi" from a test number to the phone number ID.
5. Verify webhook receipt, signature check, and automated interactive menu reply.

### Rollback Plan
- If automated messaging encounters issues or downtime, traffic is automatically maintained via the website's native **Click-to-Chat (`wa.me`)** links.
- Removing or un-subscribing the webhook in Meta App Dashboard immediately halts automated processing, routing conversations back to standard WhatsApp Business inbox tools.
