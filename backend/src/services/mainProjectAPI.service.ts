import axios, { AxiosInstance } from 'axios';
import { DuplicateCheckResult, MainProjectAPIResponse, PushToMainProjectResponse } from '../types/upload.types';
import { normalizeDomain } from '../utils/helpers';

export class MainProjectAPIService {
  private static axiosInstance: AxiosInstance;
  private static authToken: string | null = null;
  private static tokenExpiry: number = 0;

  /**
   * Login to main project and get JWT token
   */
  private static async login(): Promise<string> {
    try {
      const baseURL = process.env.MAIN_PROJECT_API_URL?.replace('/api/guest-sites-api', '') || 'http://localhost:3001';
      const response = await axios.post(`${baseURL}/api/auth/login`, {
        email: process.env.MAIN_PROJECT_SERVICE_EMAIL || 'validation-service@usehypwave.com',
        password: process.env.MAIN_PROJECT_SERVICE_PASSWORD || '3310958d4b86d9a3d36030cd225f4f2da15b51f13b4eb46189f87c9cef590928'
      });

      if (response.data.token) {
        this.authToken = response.data.token;
        // Token expires in 7 days, refresh after 6 days
        this.tokenExpiry = Date.now() + (6 * 24 * 60 * 60 * 1000);
        return this.authToken as string;
      }

      throw new Error('No token received from login');
    } catch (error: any) {
      console.error('Main project login error:', error.message);
      throw error;
    }
  }

  /**
   * Get valid auth token (login if needed)
   */
  private static async getAuthToken(): Promise<string> {
    // Check if token exists and is not expired
    if (this.authToken && Date.now() < this.tokenExpiry) {
      return this.authToken;
    }

    // Login to get new token
    return await this.login();
  }

  /**
   * Initialize axios instance with auth
   */
  private static async getAxiosInstance(): Promise<AxiosInstance> {
    if (!this.axiosInstance) {
      this.axiosInstance = axios.create({
        baseURL: process.env.MAIN_PROJECT_API_URL || 'http://localhost:3001/api/guest-sites-api',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Add auth interceptor
      this.axiosInstance.interceptors.request.use(async (config) => {
        // Get valid token
        const token = await this.getAuthToken();
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      });
    }

    return this.axiosInstance;
  }

  /**
   * Check if a single website URL exists in main project
   */
  static async checkDuplicate(websiteUrl: string): Promise<DuplicateCheckResult> {
    try {
      const normalizedUrl = normalizeDomain(websiteUrl);
      const axiosInstance = await this.getAxiosInstance();
      const response = await axiosInstance.post<MainProjectAPIResponse>(
        '/check-duplicates',
        { domains: [normalizedUrl] }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        // Check if domain exists in existingDomains array
        const isDuplicate = data.existingDomains && data.existingDomains.includes(normalizedUrl);
        const existingSite = data.existingSites?.find((site: any) => 
          normalizeDomain(site.site_url) === normalizedUrl
        );
        
        return {
          isDuplicate: isDuplicate || false,
          existingId: existingSite?.id,
          source: 'main_project'
        };
      }

      return { isDuplicate: false };
    } catch (error: any) {
      console.error('Main project duplicate check error:', error.message);
      // Throw error to prevent upload if main project API is unreachable
      throw new Error(`Main Project API connection failed: ${error.message}`);
    }
  }

  /**
   * Check multiple website URLs for duplicates in main project
   */
  static async checkDuplicates(websiteUrls: string[]): Promise<Array<{
    websiteUrl: string;
    isDuplicate: boolean;
    existingId?: string;
  }>> {
    try {
      const normalizedUrls = websiteUrls.map(url => normalizeDomain(url));
      const axiosInstance = await this.getAxiosInstance();
      
      // Send multiple variations of each URL to increase chance of match
      const urlVariations: string[] = [];
      for (const url of normalizedUrls) {
        urlVariations.push(url);                    // techcrunch.com
        urlVariations.push(`https://${url}`);       // https://techcrunch.com
        urlVariations.push(`https://${url}/`);      // https://techcrunch.com/
        urlVariations.push(`http://${url}`);        // http://techcrunch.com
        urlVariations.push(`www.${url}`);           // www.techcrunch.com
      }
      
      const response = await axiosInstance.post<MainProjectAPIResponse>(
        '/check-duplicates',
        { domains: urlVariations }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Map response back to original normalized URLs
        return normalizedUrls.map(url => {
          // Check if any variation of this URL is in existingDomains
          const isDuplicate = data.existingDomains && data.existingDomains.some((existingUrl: string) => 
            normalizeDomain(existingUrl) === url
          );
          
          // Find existing site by normalized URL
          const existingSite = data.existingSites?.find((site: any) => 
            normalizeDomain(site.site_url) === url
          );
          
          return {
            websiteUrl: url,
            isDuplicate: isDuplicate || !!existingSite,
            existingId: existingSite?.id
          };
        });
      }

      // If API response is invalid, throw error
      throw new Error('Invalid response from Main Project API');
    } catch (error: any) {
      console.error('Main project bulk duplicate check error:', error.message);
      // Throw error to prevent upload if main project API is unreachable
      throw new Error(`Main Project API connection failed: ${error.message}`);
    }
  }

  /**
   * Verify publishers in main project
   */
  static async verifyPublishers(publisherEmails: string[]): Promise<Array<{
    email: string;
    isVerified: boolean;
    publisherId?: string;
  }>> {
    try {
      const axiosInstance = await this.getAxiosInstance();
      const response = await axiosInstance.post<MainProjectAPIResponse>(
        '/verify-publishers',
        { emails: publisherEmails }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        // Map response to expected format
        return publisherEmails.map(email => {
          const isFound = data.foundEmails && data.foundEmails.includes(email);
          const publisher = data.publishers?.find((p: any) => p.email === email);
          
          return {
            email,
            isVerified: isFound || false,
            publisherId: publisher?.id
          };
        });
      }

      // If API fails, return all as not verified
      return publisherEmails.map(email => ({
        email,
        isVerified: false
      }));
    } catch (error: any) {
      console.error('Main project publisher verification error:', error.message);
      return publisherEmails.map(email => ({
        email,
        isVerified: false
      }));
    }
  }

  /**
   * Push data to main project (bulk import)
   */
  static async bulkImport(data: Array<{
    websiteUrl: string;
    category?: string;
    language?: string;
    country?: string;
    daRange?: string;
    price?: number;
    linkType?: string;
    tat?: string;
    publisherName?: string;
    publisherEmail?: string;
    publisherContact?: string;
    notes?: string;
    da?: number;
    dr?: number;
    traffic?: number;
    ss?: number;
    gbBasePrice?: number;
    liBasePrice?: number;
  }>): Promise<PushToMainProjectResponse> {
    try {
      const axiosInstance = await this.getAxiosInstance();
      // Map data to main project format
      const sites = data.map(site => ({
        site_url: site.websiteUrl,
        category: site.category,
        language: site.language,
        country: site.country,
        da: site.da || 0,
        dr: site.dr || 0,
        ahrefs_traffic: site.traffic || 0,
        ss: site.ss || 0,
        tat: site.tat,
        base_price: site.gbBasePrice || site.price || 0,
        li_base_price: site.liBasePrice,
        publisher_name: site.publisherName,
        publisher_email: site.publisherEmail,
        status: 'ACTIVE',
        negotiation_status: 'DONE'
      }));
      
      const response = await axiosInstance.post<MainProjectAPIResponse>(
        '/bulk-import',
        { sites, autoCreatePublisher: true }
      );

      if (response.data.success && response.data.data) {
        return {
          success: true,
          pushedCount: response.data.data.successCount || 0,
          failedCount: response.data.data.failedCount || 0,
          results: response.data.data.results || []
        };
      }

      return {
        success: false,
        pushedCount: 0,
        failedCount: data.length,
        results: data.map((_, index) => ({
          dataId: index.toString(),
          success: false,
          error: 'API request failed'
        }))
      };
    } catch (error: any) {
      console.error('Main project bulk import error:', error.message);
      return {
        success: false,
        pushedCount: 0,
        failedCount: data.length,
        results: data.map((_, index) => ({
          dataId: index.toString(),
          success: false,
          error: error.message
        }))
      };
    }
  }

  /**
   * Test connection to main project API
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test login first
      await this.login();
      return {
        success: true,
        message: 'Connection successful - JWT authentication working'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }
}
