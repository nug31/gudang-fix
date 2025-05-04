const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true, message: 'Supabase connection successful' });
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error connecting to Supabase', 
      error: error.message 
    });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    // Get user from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const user = users[0];
    
    // Compare passwords
    let isPasswordValid = false;
    
    // First try bcrypt compare
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error('Error comparing passwords with bcrypt:', bcryptError);
      
      // If bcrypt fails, try direct comparison (for legacy passwords)
      isPasswordValid = password === user.password;
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Remove password from user object
    delete user.password;
    
    // Transform user object to match expected format
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at
    };
    
    res.json({ user: transformedUser, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Database operations endpoint
app.post('/db/:table', async (req, res) => {
  const { table } = req.params;
  const { action, ...data } = req.body;
  
  // Validate table name to prevent injection
  const validTables = ['users', 'item_requests', 'inventory', 'notifications'];
  if (!validTables.includes(table)) {
    return res.status(400).json({ message: 'Invalid table name' });
  }
  
  try {
    switch (action) {
      case 'getAll':
        let query = supabase.from(table).select('*');
        
        // Special case for requests to join with user info
        if (table === 'item_requests') {
          // Supabase doesn't support JOINs directly in the API
          // We'll need to fetch requests and users separately and join them in code
          const { data: requests, error: requestsError } = await supabase
            .from('item_requests')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (requestsError) {
            throw requestsError;
          }
          
          // Get all unique user IDs from requests
          const userIds = [...new Set(requests.map(req => req.user_id))];
          
          // Fetch users
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, department')
            .in('id', userIds);
          
          if (usersError) {
            throw usersError;
          }
          
          // Create a map of user IDs to user objects for quick lookup
          const userMap = {};
          users.forEach(user => {
            userMap[user.id] = user;
          });
          
          // Join requests with user info
          const joinedRequests = requests.map(request => {
            const user = userMap[request.user_id] || {};
            return {
              id: request.id,
              userId: request.user_id,
              itemName: request.item_name,
              quantity: request.quantity,
              category: request.category,
              status: request.status,
              createdAt: request.created_at,
              updatedAt: request.updated_at,
              adminComment: request.admin_comment,
              userName: user.name || 'Unknown',
              userDepartment: user.department || null
            };
          });
          
          return res.json(joinedRequests);
        } else {
          // For other tables, just fetch all records
          const { data: records, error } = await query;
          
          if (error) {
            throw error;
          }
          
          // Transform records to match expected format
          let transformedRecords = records;
          
          if (table === 'users') {
            transformedRecords = records.map(user => {
              // Remove password from user objects
              const { password, ...userWithoutPassword } = user;
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                avatarUrl: user.avatar_url,
                createdAt: user.created_at
              };
            });
          } else if (table === 'inventory') {
            transformedRecords = records.map(item => ({
              id: item.id,
              itemName: item.item_name,
              quantity: item.quantity,
              category: item.category,
              location: item.location,
              createdAt: item.created_at,
              updatedAt: item.updated_at
            }));
          } else if (table === 'notifications') {
            transformedRecords = records.map(notification => ({
              id: notification.id,
              userId: notification.user_id,
              message: notification.message,
              read: notification.read,
              type: notification.type,
              createdAt: notification.created_at
            }));
          }
          
          return res.json(transformedRecords);
        }
        break;
        
      // Other cases omitted for brevity...
    }
  } catch (error) {
    console.error('Database operation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Serve React app for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server if not in production (Vercel will handle this in production)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
