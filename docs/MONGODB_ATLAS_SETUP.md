# Connecting to MongoDB Atlas

This guide will help you connect your Trading Journal application to MongoDB Atlas.

## Step 1: Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (or log in if you already have one)
3. Complete the account setup

## Step 2: Create a Cluster

1. After logging in, click **"Build a Database"** or **"Create"**
2. Choose the **FREE (M0) tier** (perfect for development)
3. Select your preferred cloud provider and region (choose one closest to you)
4. Give your cluster a name (e.g., "TradingJournal")
5. Click **"Create"** and wait for the cluster to be created (takes 1-3 minutes)

## Step 3: Create a Database User

1. In the **Security** section, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication method
4. Enter a username (e.g., `tradingjournal`)
5. Click **"Autogenerate Secure Password"** or create your own strong password
6. **IMPORTANT:** Copy and save the password - you won't be able to see it again!
7. Under **"Database User Privileges"**, select **"Atlas admin"** (or **"Read and write to any database"**)
8. Click **"Add User"**

## Step 4: Configure Network Access

1. In the **Security** section, click **"Network Access"**
2. Click **"Add IP Address"**
3. For development, click **"Add Current IP Address"**
4. For production, you can:
   - Add specific IP addresses
   - Use **"Allow Access from Anywhere"** (0.0.0.0/0) - **Only for production with proper security**
5. Click **"Confirm"**

## Step 5: Get Your Connection String

1. Go back to **"Database"** (or **"Clusters"**)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver and **"6.0 or later"** as the version
5. Copy the connection string (it will look like this):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update Your .env File

1. Open your `.env` file in the root of your project
2. Replace the `DATABASE_URL` with your MongoDB Atlas connection string:

   ```env
   # MongoDB Atlas Connection String
   DATABASE_URL="mongodb+srv://tradingjournal:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/trading-journal?retryWrites=true&w=majority"
   ```

   **Important points:**
   - Replace `<username>` with your database username
   - Replace `<password>` with your database password (URL encode special characters if needed)
   - Replace `cluster0.xxxxx` with your actual cluster name
   - Add `/trading-journal` before the `?` to specify the database name
   - Keep the query parameters (`?retryWrites=true&w=majority`)

3. **URL Encoding Special Characters:**
   If your password contains special characters, you need to URL encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - `&` → `%26`
   - `+` → `%2B`
   - `=` → `%3D`
   - `?` → `%3F`
   - `/` → `%2F`

   Example: If your password is `P@ssw0rd#123`, it should be `P%40ssw0rd%23123`

## Step 7: Push Your Schema to MongoDB Atlas

1. Make sure your `.env` file has the correct `DATABASE_URL`
2. Run the following commands:

   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Push your schema to MongoDB Atlas
   npx prisma db push
   ```

   This will create all your collections in MongoDB Atlas based on your Prisma schema.

## Step 8: Verify the Connection

1. In MongoDB Atlas, go to **"Database"** → **"Browse Collections"**
2. You should see your collections:
   - `users`
   - `trades`
   - `exchanges`
   - `rules`
   - `accounts`
   - `sessions`
   - `verificationtokens`
   - `comments`

## Troubleshooting

### Connection Timeout
- Check that your IP address is whitelisted in Network Access
- Verify your connection string is correct
- Make sure you're using the correct database name

### Authentication Failed
- Double-check your username and password
- Ensure special characters in password are URL encoded
- Verify the user has the correct permissions

### SSL/TLS Issues - "received fatal alert: InternalError"

If you see errors like `received fatal alert: InternalError` or `Server selection timeout: No available servers`, try these solutions:

1. **Check Network Access in MongoDB Atlas:**
   - Go to MongoDB Atlas → Security → Network Access
   - Ensure your current IP address is whitelisted
   - For development, you can temporarily allow all IPs (0.0.0.0/0) - **NOT recommended for production**

2. **Verify Connection String:**
   - Ensure your connection string uses `mongodb+srv://` (not `mongodb://`)
   - Check that the password is correctly URL-encoded (special characters)
   - Verify the cluster name matches your Atlas cluster

3. **Update Connection String Parameters:**
   Add these parameters to your connection string for better reliability:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/trading-journal?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=false
   ```

4. **Check MongoDB Atlas Cluster Status:**
   - Log into MongoDB Atlas dashboard
   - Verify your cluster is running (not paused)
   - Check for any service alerts or maintenance

5. **Firewall/Antivirus:**
   - Temporarily disable firewall/antivirus to test if it's blocking the connection
   - Add MongoDB Atlas IP ranges to firewall exceptions if needed

6. **Node.js Version:**
   - Ensure you're using Node.js 20.9+ (required for Next.js 16)
   - Older Node.js versions may have TLS compatibility issues

7. **Connection String Format:**
   Make sure your connection string follows this format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority
   ```

8. **Test Connection:**
   - Try connecting using MongoDB Compass or `mongosh` to verify the connection string works
   - If it works in Compass but not in the app, the issue is likely with Prisma/Node.js configuration

9. **Regenerate Connection String:**
   - In MongoDB Atlas, go to Connect → Connect your application
   - Generate a new connection string
   - Update your `.env` file with the new string

10. **Restart Development Server:**
    - After updating `.env`, restart your Next.js development server
    - Clear `.next` cache: `rm -rf .next` (or `rmdir /s .next` on Windows)

## Production Considerations

1. **Use Environment Variables:** Never commit your `.env` file to version control
2. **Use Strong Passwords:** Generate a strong, unique password for your database user
3. **Restrict IP Access:** Only allow specific IP addresses in production
4. **Enable Monitoring:** Use MongoDB Atlas monitoring to track performance
5. **Backup:** Set up automated backups in MongoDB Atlas
6. **Connection Pooling:** MongoDB Atlas handles connection pooling automatically

## Example .env File

```env
# MongoDB Atlas Connection
DATABASE_URL="mongodb+srv://tradingjournal:MySecurePassword123@cluster0.abc123.mongodb.net/trading-journal?retryWrites=true&w=majority"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

## Need Help?

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Prisma MongoDB Guide](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [MongoDB Atlas Support](https://www.mongodb.com/docs/atlas/support/)
