import { useState, useEffect } from 'react';
import { 
  territoryService, 
  authService,
  userService,
  formService,
  formSubmissionService,
  formOptionService
} from '../services/apiServices';

// ============================================================================
// GENERIC API HOOK
// ============================================================================

// This is a reusable hook for any API call
export const useApi = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
};

// ============================================================================
// TERRITORY HOOKS
// ============================================================================

export const useCountries = () => {
  return useApi(territoryService.countries.getAll);
};

export const useProvinces = () => {
  return useApi(territoryService.provinces.getAll);
};

export const useProvincesByCountry = (countryUuid) => {
  return useApi(() => territoryService.provinces.getAllPaginated(1, 100), [countryUuid]);
};

export const useAreas = () => {
  return useApi(territoryService.areas.getAll);
};

export const useAreasByProvince = (provinceUuid) => {
  return useApi(() => territoryService.areas.getByProvinceUuid(provinceUuid), [provinceUuid]);
};

// Territory actions hook
export const useTerritoryActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createCountry = async (countryData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await territoryService.countries.create(countryData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createProvince = async (provinceData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await territoryService.provinces.create(provinceData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createArea = async (areaData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await territoryService.areas.create(areaData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createCountry, createProvince, createArea, loading, error };
};

// ============================================================================
// AUTHENTICATION HOOKS
// ============================================================================

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.login(credentials);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.register(userData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.logout();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, register, logout, loading, error };
};

export const useAuthUser = () => {
  return useApi(authService.getAuthUser);
};

// ============================================================================
// USER HOOKS
// ============================================================================

export const useUsers = () => {
  return useApi(userService.getAll);
};

export const useUserById = (uuid) => {
  return useApi(() => userService.getByUuid(uuid), [uuid]);
};

// ============================================================================
// FORM HOOKS
// ============================================================================

export const useForms = () => {
  return useApi(formService.getAll);
};

export const useFormById = (uuid) => {
  return useApi(() => formService.getByUuid(uuid), [uuid]);
};

export const useFormSubmissions = () => {
  return useApi(formSubmissionService.getAll);
};

export const useFormOptions = () => {
  return useApi(formOptionService.getAll);
};
