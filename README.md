# Gudang Mitra

Gudang Mitra is an inventory management system designed to help organizations track and manage their inventory requests and stock levels.

## Features

- User authentication and role-based access control
- Inventory request management
- Stock management
- Notifications system
- User management

## Deployment with Vercel and Supabase

This repository is set up for deployment on Vercel with Supabase as the database.

### Setup Supabase

1. Create a new Supabase project
2. Set up the database tables using the SQL in `supabase-setup.sql`
3. Get your Supabase URL and API Key from the Supabase dashboard:
   - Go to Project Settings > API
   - Copy the URL and anon/public key

### Deployment Steps

1. Copy your frontend build files to the `dist` directory in this folder

2. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

3. Log in to Vercel:
   ```
   vercel login
   ```

4. Set up Vercel environment variables:
   ```
   vercel secrets add supabase_url "YOUR_SUPABASE_URL"
   vercel secrets add supabase_key "YOUR_SUPABASE_API_KEY"
   ```

5. Deploy to Vercel:
   ```
   vercel
   ```

6. Follow the prompts to complete the deployment

## Default Login Credentials

- Email: admin@gudangmitra.com
- Password: admin123

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Developed by jsnugroho
