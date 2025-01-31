# cloudflare-dns-update

**TLDR: DDNS (sorta)**

## Prerequisites

- Node.js
- A Cloudflare account with API access.
- A Telegram bot for notifications. (optional)

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/vo1ter/cloudflare-dns-update
   cd cloudflare-dns-update
   ```

2. Install the dependencies:

   ```bash
   npm i
   ```

3. Create a `.env` file in the root directory of the project and configure it with your environment variables:

   ```plaintext
   CLOUDFLARE_EMAIL=your-cloudflare-email
   CLOUDFLARE_API_KEY=your-cloudflare-api-key
   ZONE_ID=your-cloudflare-zone-id
   NAMES_TO_CHANGE=your,domain,names
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   TELEGRAM_CHAT_ID=your-telegram-chat-id
   FETCH_INTERVAL=60000  # Interval in milliseconds for checking the IP (e.g., 60000 ms = 1 min)
   ENABLE_TELEGRAM_NOTIFICATIONS=1/0 (1 - enabled, 0 - disabled)
   ```

   - Replace `your-cloudflare-email`, `your-cloudflare-api-key`, `your-cloudflare-zone-id`, `your,domain,names` (domain names should comma separated, e.g. test1.vo1ter.me,test2.vo1ter.me), `your-telegram-bot-token`, `your-telegram-chat-id` with your actual credentials and IDs.
   - Adjust `FETCH_INTERVAL` to your preferred interval for IP checks and `ENABLE_TELEGRAM_NOTIFICATIONS` to enable/disable telegram notifications.

4. Start the application:

   ```bash
   npm start
   ```

The application will now periodically check your external IP address and update the specified Cloudflare DNS record if it changes, sending a notification to your Telegram chat.