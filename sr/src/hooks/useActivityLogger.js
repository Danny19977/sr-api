/*!

=========================================================
* TeamOnSite (TOS) - Activity Logging Hook
=========================================================

* React hook for automatic activity logging
* Tracks page views, user interactions, and system events

=========================================================

*/

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import userActivityLogger from '../services/userActivityLogger';

// Hook for automatic page view logging
export const usePageViewLogger = (pageName, customData = {}) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !hasLoggedRef.current) {
      userActivityLogger.logPageView(pageName, location.pathname);
      hasLoggedRef.current = true;
    }

    // Reset when location changes
    return () => {
      hasLoggedRef.current = false;
    };
  }, [pageName, location.pathname, isAuthenticated, user]);
};

// Hook for logging CRUD operations
export const useCrudLogger = () => {
  const { user, isAuthenticated } = useAuth();

  const logCreate = (entityType, entityName, entityId = null) => {
    if (isAuthenticated && user) {
      userActivityLogger.logCreate(entityType, entityName, entityId);
    }
  };

  const logUpdate = (entityType, entityName, entityId = null, changes = {}) => {
    if (isAuthenticated && user) {
      userActivityLogger.logUpdate(entityType, entityName, entityId, changes);
    }
  };

  const logDelete = (entityType, entityName, entityId = null) => {
    if (isAuthenticated && user) {
      userActivityLogger.logDelete(entityType, entityName, entityId);
    }
  };

  const logView = (entityType, entityName, entityId = null) => {
    if (isAuthenticated && user) {
      userActivityLogger.logActivity(
        'VIEW',
        `view_${entityType}`,
        `Viewed ${entityType}: ${entityName}`,
        { entity_type: entityType, entity_name: entityName, entity_id: entityId }
      );
    }
  };

  return { logCreate, logUpdate, logDelete, logView };
};

// Hook for logging data operations (import/export)
export const useDataLogger = () => {
  const { user, isAuthenticated } = useAuth();

  const logExport = (entityType, format, recordCount = 0) => {
    if (isAuthenticated && user) {
      userActivityLogger.logDataExport(entityType, format, recordCount);
    }
  };

  const logImport = (entityType, format, recordCount = 0) => {
    if (isAuthenticated && user) {
      userActivityLogger.logDataImport(entityType, format, recordCount);
    }
  };

  return { logExport, logImport };
};

// Hook for logging errors and warnings
export const useErrorLogger = () => {
  const { user, isAuthenticated } = useAuth();

  const logError = (errorType, errorMessage, context = {}) => {
    // Log errors even if user is not authenticated for system monitoring
    userActivityLogger.logError(errorType, errorMessage, {
      ...context,
      user_authenticated: isAuthenticated,
      user_id: user?.uuid || 'anonymous'
    });
  };

  const logWarning = (warningType, warningMessage, context = {}) => {
    if (isAuthenticated && user) {
      userActivityLogger.logWarning(warningType, warningMessage, context);
    }
  };

  return { logError, logWarning };
};

// Hook for logging form interactions
export const useFormLogger = (formName) => {
  const { user, isAuthenticated } = useAuth();

  const logFormSubmit = (action, data = {}) => {
    if (isAuthenticated && user) {
      userActivityLogger.logActivity(
        'FORM_SUBMIT',
        `${formName}_submit`,
        `Submitted form: ${formName} (${action})`,
        { form_name: formName, action, data_fields: Object.keys(data).join(', ') }
      );
    }
  };

  const logFormValidationError = (errors = {}) => {
    if (isAuthenticated && user) {
      userActivityLogger.logActivity(
        'FORM_ERROR',
        `${formName}_validation_error`,
        `Form validation errors in ${formName}`,
        { form_name: formName, error_fields: Object.keys(errors).join(', ') }
      );
    }
  };

  return { logFormSubmit, logFormValidationError };
};

// Hook for logging search and filter operations
export const useSearchLogger = () => {
  const { user, isAuthenticated } = useAuth();

  const logSearch = (searchTerm, entityType, resultCount = 0) => {
    if (isAuthenticated && user) {
      userActivityLogger.logActivity(
        'SEARCH',
        `search_${entityType}`,
        `Searched ${entityType} with term: "${searchTerm}" (${resultCount} results)`,
        { 
          search_term: searchTerm, 
          entity_type: entityType, 
          result_count: resultCount 
        }
      );
    }
  };

  const logFilter = (filterType, filterValue, entityType, resultCount = 0) => {
    if (isAuthenticated && user) {
      userActivityLogger.logActivity(
        'FILTER',
        `filter_${entityType}`,
        `Applied ${filterType} filter: "${filterValue}" to ${entityType} (${resultCount} results)`,
        { 
          filter_type: filterType, 
          filter_value: filterValue, 
          entity_type: entityType, 
          result_count: resultCount 
        }
      );
    }
  };

  return { logSearch, logFilter };
};

// Custom hook for general activity logging
export const useActivityLogger = () => {
  const { user, isAuthenticated } = useAuth();

  const logCustomActivity = (action, name, description, additionalData = {}) => {
    if (isAuthenticated && user) {
      userActivityLogger.logActivity(action, name, description, additionalData);
    }
  };

  return { logCustomActivity, userActivityLogger };
};

// Default export for convenience
export default {
  usePageViewLogger,
  useCrudLogger,
  useDataLogger,
  useErrorLogger,
  useFormLogger,
  useSearchLogger,
  useActivityLogger
};
