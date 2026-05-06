// Supabase Configuration and API Integration
// Your Supabase credentials

const SUPABASE_URL = 'https://etmayhvdpznsylsiqfkg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bWF5aHZkcHpuc3lsc2lxZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MjQ5MTgsImV4cCI6MjA3NTQwMDkxOH0.syAZfshOF6To5h1W5aZAfFITdfz9yYg8K-F_REvkRbo';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin Authentication Service (using custom Admin table)
class AuthService {
    static async signIn(email, password) {
        try {
            console.log('Attempting login with Admin table for:', email);
            
            const { data, error } = await supabaseClient
                .from('Admin')
                .select('*')
                .eq('Email', email)
                .eq('Password', password)
                .single();
            
            if (error) {
                console.error('Supabase query error:', error);
                if (error.code === 'PGRST116') {
                    throw new Error('Invalid email or password');
                }
                throw new Error(error.message || 'Login failed');
            }
            
            if (data) {
                console.log('Admin login successful:', data);
                
                // Store admin session data
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('adminData', JSON.stringify({
                    id: data.id,
                    name: data.Name,
                    username: data.Username,
                    email: data.Email,
                    loginTime: new Date().toISOString()
                }));
                
                return { success: true, data };
            } else {
                throw new Error('Invalid email or password');
            }
        } catch (error) {
            console.error('Admin sign in error:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async signOut() {
        try {
            // Clear local storage
            localStorage.removeItem('userLoggedIn');
            localStorage.removeItem('adminData');
            localStorage.removeItem('userData');
            
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async getCurrentUser() {
        try {
            const adminData = localStorage.getItem('adminData');
            if (adminData) {
                return JSON.parse(adminData);
            }
            return null;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    }
    
    static async isAuthenticated() {
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        const adminData = localStorage.getItem('adminData');
        return isLoggedIn && adminData;
    }
    
    // Create admin account (for testing purposes)
    static async createAdmin(name, username, email, password) {
        try {
            const { data, error } = await supabaseClient
                .from('Admin')
                .insert([{
                    Name: name,
                    Username: username,
                    Email: email,
                    Password: password
                }])
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create admin error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Cases management functions (Updated for cases_ table)
class CaseService {
    static async createCase(caseData) {
        try {
            // Upload photo to Supabase Storage if provided, fallback to base64
            let photoUrl = null;
            if (caseData.photoData) {
                photoUrl = await this.uploadPhoto(caseData.photoData, caseData.clientName);
                // If storage upload failed, store base64 directly so photo still shows
                if (!photoUrl) {
                    photoUrl = caseData.photoData;
                }
            }
            
            const { data, error } = await supabaseClient
                .from('cases_')
                .insert([{
                    Name: caseData.clientName,
                    Department: caseData.department,
                    Year: caseData.year,
                    Section: caseData.section,
                    'Reg no': caseData.regNo,
                    'Parent\'s no': caseData.parentNo,
                    Case: caseData.caseDescription,
                    'Take Photo': photoUrl,
                    'Cased Book By': caseData.casedBookBy
                }])
                .select();
            
            if (error) throw error;
            
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Create case error:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async uploadPhoto(photoDataUrl, studentName) {
        try {
            // Convert data URL to blob
            const response = await fetch(photoDataUrl);
            const blob = await response.blob();
            
            // Generate unique filename
            const timestamp = Date.now();
            const fileName = `${studentName.replace(/\s+/g, '_')}_${timestamp}.jpg`;
            
            // Upload to Supabase Storage
            const { data, error } = await supabaseClient.storage
                .from('case-files')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    upsert: false
                });
            
            if (error) throw error;
            
            // Get public URL
            const { data: urlData } = supabaseClient.storage
                .from('case-files')
                .getPublicUrl(fileName);
            
            return urlData.publicUrl;
        } catch (error) {
            console.error('Photo upload error:', error);
            return null; // Return null if upload fails
        }
    }
    
    static async getCases(statusFilter = null) {
        try {
            let query = supabaseClient
                .from('cases_')
                .select('*')
                .order('created_at', { ascending: false });
            
            // Note: The original status filter doesn't apply to this schema
            // as the status concept doesn't exist in cases_ table
            
            const { data, error } = await query;
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get cases error:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async getCaseById(caseId) {
        try {
            const { data, error } = await supabaseClient
                .from('cases_')
                .select('*')
                .eq('id', caseId)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get case by ID error:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async resolveCase(caseId, resolutionNotes = null) {
        try {
            const updateData = {
                resolved_at: new Date().toISOString(),
                resolution_notes: resolutionNotes
            };
            
            const { data, error } = await supabaseClient
                .from('cases_')
                .update(updateData)
                .eq('id', caseId)
                .select();
            
            if (error) throw error;
            
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Resolve case error:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async updateCase(caseId, updateData) {
        try {
            const { data, error } = await supabaseClient
                .from('cases_')
                .update(updateData)
                .eq('id', caseId)
                .select();
            
            if (error) throw error;
            
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Update case error:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async deleteCase(caseId) {
        try {
            const { error } = await supabaseClient
                .from('cases_')
                .delete()
                .eq('id', caseId);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete case error:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async getCaseStats() {
        try {
            const { data, error } = await supabaseClient
                .from('cases_')
                .select('*');
            
            if (error) throw error;
            
            const stats = {
                total_cases: data.length,
                pending_cases: data.length, // All cases are considered pending in this schema
                in_progress_cases: 0,
                solved_cases: 0
            };
            
            return { success: true, data: stats };
        } catch (error) {
            console.error('Get case stats error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Generate a simple case number (not used in new schema but kept for compatibility)
    static async generateCaseNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `PMC${String(timestamp).slice(-6)}${String(random).padStart(3, '0')}`;
    }
}

// Comments functions
class CommentService {
    static async addComment(caseId, comment) {
        try {
            const { data, error } = await supabaseClient
                .from('case_comments')
                .insert([{
                    case_id: caseId,
                    comment,
                    created_by: (await AuthService.getCurrentUser())?.id
                }])
                .select(`
                    *,
                    created_by_user:users!case_comments_created_by_fkey(full_name, email)
                `);
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Add comment error:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async getComments(caseId) {
        try {
            const { data, error } = await supabaseClient
                .from('case_comments')
                .select(`
                    *,
                    created_by_user:users!case_comments_created_by_fkey(full_name, email)
                `)
                .eq('case_id', caseId)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get comments error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Notifications functions
class NotificationService {
    static async createNotification(userId, title, message, type = 'info') {
        try {
            const { data, error } = await supabaseClient
                .from('notifications')
                .insert([{
                    user_id: userId,
                    title,
                    message,
                    type
                }]);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create notification error:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async getNotifications(limit = 10) {
        try {
            const user = await AuthService.getCurrentUser();
            if (!user) throw new Error('User not authenticated');
            
            const { data, error } = await supabaseClient
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get notifications error:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async markAsRead(notificationId) {
        try {
            const { error } = await supabaseClient
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Mark notification as read error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Real-time subscriptions
class RealtimeService {
    static subscribeToCases(callback) {
        return supabaseClient
            .channel('cases')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'cases' }, 
                callback
            )
            .subscribe();
    }
    
    static subscribeToCaseHistory(caseId, callback) {
        return supabaseClient
            .channel(`case_history_${caseId}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'case_history',
                    filter: `case_id=eq.${caseId}`
                }, 
                callback
            )
            .subscribe();
    }
    
    static subscribeToNotifications(callback) {
        return supabaseClient
            .channel('notifications')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'notifications' }, 
                callback
            )
            .subscribe();
    }
    
    static unsubscribe(subscription) {
        supabaseClient.removeChannel(subscription);
    }
}

// Export services for use in other files
window.AuthService = AuthService;
window.CaseService = CaseService;
window.CommentService = CommentService;
window.NotificationService = NotificationService;
window.RealtimeService = RealtimeService;
window.supabaseClient = supabaseClient;