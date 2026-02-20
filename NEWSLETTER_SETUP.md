# VerifyIt Newsletter Email Setup Guide

## 🚀 Quick Setup

1. **Gmail App Password Setup** (Recommended)
   - Go to your Google Account settings
   - Enable 2-factor authentication
   - Generate an App Password for VerifyIt
   - Use this App Password (not your regular password)

2. **Update .env Configuration**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   EMAIL_FROM_NAME=VerifyIt Security Alerts
   EMAIL_FROM_ADDRESS=your-email@gmail.com
   ```

3. **Alternative Email Providers**
   - **Outlook**: Set `EMAIL_SERVICE=outlook`
   - **Yahoo**: Set `EMAIL_SERVICE=yahoo`
   - **Custom SMTP**: Use detailed SMTP configuration

## 📧 Newsletter Features

### Automatic Fraud Alerts
- Triggered when content scores below 25 (high risk)
- Cooldown period: 1 hour between alerts
- Sends to all active subscribers

### Email Templates
- **Welcome Email**: Sent on subscription
- **Fraud Alerts**: Critical security notifications
- **Weekly Reports**: Trend summaries (future feature)

### Subscriber Management
- Neon PostgreSQL storage via Drizzle ORM
- Automatic email validation
- Unsubscribe functionality
- Privacy protected

### Database Configuration
Add this to `config/.env`:
```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

## 🔧 API Endpoints

### Subscribe to Newsletter
```bash
POST /api/newsletter/subscribe
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Unsubscribe
```bash
POST /api/newsletter/unsubscribe
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Get Stats (Admin)
```bash
GET /api/newsletter/stats
```

## 📊 Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `NEWSLETTER_ENABLED` | `true` | Enable/disable newsletter system |
| `HIGH_RISK_THRESHOLD` | `25` | Score threshold for fraud alerts |
| `FRAUD_ALERT_COOLDOWN` | `3600000` | Cooldown in milliseconds (1 hour) |
| `EMAIL_SERVICE` | `gmail` | Email service provider |

## 🛡️ Security Features

- Email validation
- Rate limiting on subscriptions
- Secure credential storage
- Unsubscribe protection
- Privacy-first design

## 📝 Data Storage

Subscribers are stored in Neon tables:
- `subscribers(email, subscribed_at, active, alerts_received)`
- `alert_state(id, last_fraud_alert_at, last_fraud_alert_signature)`

## 🚨 Troubleshooting

**Email not sending?**
1. Check APP PASSWORD (not regular password)
2. Verify 2-factor authentication is enabled
3. Check server console for specific error messages
4. Test with personal email first

**Newsletter not working?**
1. Ensure `NEWSLETTER_ENABLED=true` in .env
2. Check email credentials are set
3. Verify `DATABASE_URL` is set and points to your Neon database

## 💡 Production Recommendations

1. Use dedicated email service (SendGrid, Mailgun)
2. Implement proper logging
3. Add email queue for high volume
4. Add explicit migration scripts for schema versioning
5. Advanced analytics and tracking

---

**Ready to go!** Your VerifyIt newsletter system is now fully functional. 🎉