# Supabase Integration Setup Guide

## 🚀 Quick Setup Instructions

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: PMC Tech SDMS
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. Get Your API Keys
1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (something like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 3. Update Configuration
1. Open `supabase-client.js`
2. Replace the placeholder values:
   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

### 4. Setup Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Copy the entire content from `supabase_schema.sql`
3. Paste it in the SQL Editor
4. Click **Run** to execute all the SQL commands

### 5. Configure Authentication
1. Go to **Authentication** > **Settings**
2. Under **Site URL**, add your domain (for local development: `http://localhost:3000` or your local server)
3. Under **Redirect URLs**, add your domain
4. **Email Auth**: Enable if you want email verification
5. **Email Templates**: Customize if needed

### 6. Set Row Level Security (RLS)
The SQL schema already includes RLS policies, but verify:
1. Go to **Database** > **Tables**
2. Check that RLS is enabled for all tables
3. Verify policies are in place

## 📊 Database Tables Created

### Core Tables:
- **users** - User profiles (extends Supabase auth)
- **cases** - Main case management table
- **case_history** - Activity tracking
- **case_comments** - Comments on cases  
- **case_attachments** - File attachments
- **notifications** - System notifications
- **settings** - Application settings

### Key Features:
- ✅ Row Level Security (RLS) enabled
- ✅ Real-time subscriptions ready
- ✅ Automatic timestamps
- ✅ Proper relationships and constraints
- ✅ Performance indexes
- ✅ Data validation

## 🔐 Security Features

### Authentication:
- Email/password authentication
- Session management
- Protected routes

### Authorization:
- Users can only see their own cases
- Admin/staff can see all cases
- Proper RLS policies

### Data Protection:
- All sensitive operations require authentication
- API keys are public-safe (anon key)
- Database access controlled by RLS

## 🔄 API Functions Available

### Authentication:
```javascript
await AuthService.signUp(email, password, userData)
await AuthService.signIn(email, password)
await AuthService.signOut()
await AuthService.getCurrentUser()
```

### Case Management:
```javascript
await CaseService.createCase(caseData)
await CaseService.getCases(status)
await CaseService.updateCase(caseId, updateData)
await CaseService.updateCaseStatus(caseId, newStatus)
await CaseService.getCaseHistory(caseId)
```

### Comments:
```javascript
await CommentService.addComment(caseId, comment)
await CommentService.getComments(caseId)
```

### Notifications:
```javascript
await NotificationService.createNotification(userId, title, message)
await NotificationService.getNotifications()
await NotificationService.markAsRead(notificationId)
```

### Real-time:
```javascript
RealtimeService.subscribeToCases(callback)
RealtimeService.subscribeToCaseHistory(caseId, callback)
RealtimeService.subscribeToNotifications(callback)
```

## 🧪 Testing the Integration

### 1. Test Authentication:
1. Try to access dashboard without login (should redirect)
2. Login with invalid credentials (should show error)
3. Login with valid credentials (should work)
4. Logout (should redirect to login)

### 2. Test Case Management:
1. Create a new case (Book Case page)
2. View pending cases
3. Check case history
4. Verify real-time updates

### 3. Check Database:
1. Go to Supabase **Database** > **Tables**
2. View data in `cases` table
3. Check `case_history` for activity logs

## 🔧 Troubleshooting

### Common Issues:

**Error: "Invalid API key"**
- Check your API keys in `supabase-client.js`
- Ensure you're using the `anon` key, not the `service_role` key

**Error: "Failed to fetch"**
- Check your Project URL
- Ensure Supabase project is running
- Check browser console for CORS issues

**Authentication not working:**
- Verify Site URL in Supabase Auth settings
- Check if email confirmation is required
- Look at browser Network tab for auth errors

**RLS Policy errors:**
- Check if RLS is enabled on tables
- Verify user permissions in policies
- Test with different user roles

### Debug Mode:
Enable verbose logging by opening browser console and checking:
- Network requests to Supabase
- Console logs from the application
- Supabase client errors

## 📈 Next Steps

### Enhancements you can add:
1. **File uploads** for case attachments
2. **Email notifications** using Supabase Edge Functions
3. **Real-time chat** for case discussions
4. **Advanced reporting** with dashboard metrics
5. **Mobile app** using same Supabase backend
6. **Role-based access** (admin, staff, student roles)

### Production Deployment:
1. Update Site URLs in Supabase Auth
2. Configure custom domain
3. Set up database backups
4. Enable database logging
5. Configure rate limiting

## 🆘 Support

If you encounter issues:
1. Check Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)
2. Review console errors in browser
3. Check Supabase project logs
4. Verify API key configuration

---

**Your SDMS is now ready for production use with Supabase! 🎉**