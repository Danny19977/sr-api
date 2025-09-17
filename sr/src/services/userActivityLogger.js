/*!

=========================================================
* TeamOnSite (TOS) - User Activity Logger
=========================================================

* Service for logging user activities and system events
* Automatically tracks user actions throughout the application

=========================================================

*/

import { userLogsService } from './apiServices';

class UserActivityLogger {
  constructor() {
    this.isEnabled = true;
    this.queuedLogs = [];
    this.isProcessing = false;
  }

  // Enable or disable logging
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Log user activity
  async logActivity(action, name, description, additionalData = {}) {
    if (!this.isEnabled) return;

    try {
      // Get current user from localStorage or auth context
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || !user.uuid) {
        console.warn('Cannot log activity: User not authenticated');
        return;
      }

      const logData = {
        name: name || `${action}_action`,
        action: action.toUpperCase(),
        Description: description || `User performed ${action} action`,
        user_uuid: user.uuid,
        Signature: this.generateSignature(action, name, user.uuid),
        ...additionalData
      };

      // Queue the log for processing
      this.queuedLogs.push(logData);
      
      // Process the queue
      this.processLogQueue();

    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  }

  // Process queued logs
  async processLogQueue() {
    if (this.isProcessing || this.queuedLogs.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queuedLogs.length > 0) {
      const logData = this.queuedLogs.shift();
      
      try {
        await userLogsService.create(logData);
        console.log(`✅ Activity logged: ${logData.action} - ${logData.name}`);
      } catch (error) {
        console.error('Failed to log activity:', error);
        // Re-queue failed logs for retry (optional)
        if (this.queuedLogs.length < 10) {
          this.queuedLogs.push(logData);
        }
      }
      
      // Small delay to prevent API spam
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.isProcessing = false;
  }

  // Generate a signature for the log entry
  generateSignature(action, name, userUuid) {
    const timestamp = new Date().toISOString();
    const data = `${action}:${name}:${userUuid}:${timestamp}`;
    return btoa(data); // Base64 encode for simple signature
  }

  // Specific logging methods for common actions
  
  // Authentication logs
  logLogin(userInfo) {
    this.logActivity(
      'LOGIN', 
      'user_login', 
      `User ${userInfo.fullname} logged into the system from ${this.getBrowserInfo()}`,
      { 
        browser_info: this.getBrowserInfo(),
        ip_address: 'client_side' // Will be detected on server side
      }
    );
  }

  logLogout(userInfo) {
    this.logActivity(
      'LOGOUT', 
      'user_logout', 
      `User ${userInfo.fullname} logged out of the system`,
      { 
        session_duration: this.getSessionDuration()
      }
    );
  }

  // CRUD operations
  logCreate(entityType, entityName, entityId = null) {
    this.logActivity(
      'CREATE', 
      `create_${entityType}`, 
      `Created new ${entityType}: ${entityName}`,
      { 
        entity_type: entityType,
        entity_name: entityName,
        entity_id: entityId
      }
    );
  }

  logUpdate(entityType, entityName, entityId = null, changes = {}) {
    this.logActivity(
      'UPDATE', 
      `update_${entityType}`, 
      `Updated ${entityType}: ${entityName}`,
      { 
        entity_type: entityType,
        entity_name: entityName,
        entity_id: entityId,
        changes: Object.keys(changes).join(', ')
      }
    );
  }

  logDelete(entityType, entityName, entityId = null) {
    this.logActivity(
      'DELETE', 
      `delete_${entityType}`, 
      `Deleted ${entityType}: ${entityName}`,
      { 
        entity_type: entityType,
        entity_name: entityName,
        entity_id: entityId
      }
    );
  }

  // View/Access logs
  logPageView(pageName, route) {
    this.logActivity(
      'VIEW', 
      `view_${pageName}`, 
      `Accessed page: ${pageName} (${route})`,
      { 
        page_name: pageName,
        route: route,
        timestamp: new Date().toISOString()
      }
    );
  }

  logDataExport(entityType, format, recordCount = 0) {
    this.logActivity(
      'EXPORT', 
      `export_${entityType}`, 
      `Exported ${recordCount} ${entityType} records to ${format.toUpperCase()}`,
      { 
        entity_type: entityType,
        export_format: format,
        record_count: recordCount
      }
    );
  }

  logDataImport(entityType, format, recordCount = 0) {
    this.logActivity(
      'IMPORT', 
      `import_${entityType}`, 
      `Imported ${recordCount} ${entityType} records from ${format.toUpperCase()}`,
      { 
        entity_type: entityType,
        import_format: format,
        record_count: recordCount
      }
    );
  }

  // System logs
  logError(errorType, errorMessage, context = {}) {
    this.logActivity(
      'ERROR', 
      `error_${errorType}`, 
      `System error: ${errorMessage}`,
      { 
        error_type: errorType,
        error_message: errorMessage,
        context: JSON.stringify(context)
      }
    );
  }

  logWarning(warningType, warningMessage, context = {}) {
    this.logActivity(
      'WARNING', 
      `warning_${warningType}`, 
      `System warning: ${warningMessage}`,
      { 
        warning_type: warningType,
        warning_message: warningMessage,
        context: JSON.stringify(context)
      }
    );
  }

  // Helper methods
  getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    
    if (userAgent.indexOf('Chrome') > -1) browserName = 'Chrome';
    else if (userAgent.indexOf('Firefox') > -1) browserName = 'Firefox';
    else if (userAgent.indexOf('Safari') > -1) browserName = 'Safari';
    else if (userAgent.indexOf('Edge') > -1) browserName = 'Edge';
    else if (userAgent.indexOf('Opera') > -1) browserName = 'Opera';
    
    return `${browserName} on ${navigator.platform}`;
  }

  getSessionDuration() {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return 'Unknown';
    
    const duration = Date.now() - parseInt(loginTime);
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  // Batch logging for multiple activities
  async logBatch(activities) {
    for (const activity of activities) {
      await this.logActivity(
        activity.action,
        activity.name,
        activity.description,
        activity.additionalData
      );
    }
  }
}

// Create and export a singleton instance
const userActivityLogger = new UserActivityLogger();

export default userActivityLogger;

// Export specific methods for convenience
export const {
  logActivity,
  logLogin,
  logLogout,
  logCreate,
  logUpdate,
  logDelete,
  logPageView,
  logDataExport,
  logDataImport,
  logError,
  logWarning,
  setEnabled
} = userActivityLogger;
