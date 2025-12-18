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
    existingPrice?: number | null;
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
        
        console.log('=== DUPLICATE CHECK RESPONSE ===');
        console.log('existingDomains:', data.existingDomains);
        console.log('existingSites:', JSON.stringify(data.existingSites, null, 2));
        console.log('================================');
        
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
          
          console.log(`URL: ${url}, isDuplicate: ${isDuplicate}, existingSite: ${JSON.stringify(existingSite)}`);
          
          return {
            websiteUrl: url,
            isDuplicate: isDuplicate || !!existingSite,
            existingId: existingSite?.id,
            existingPrice: existingSite?.base_price ?? null
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
    status?: string;
    negotiationStatus?: string;
  }>): Promise<PushToMainProjectResponse> {
    try {
      const axiosInstance = await this.getAxiosInstance();
      // Map data to main project format
      // Use publisherEmail if available, otherwise fall back to contactEmail
      const sites = data.map(site => ({
        site_url: site.websiteUrl,
        publisher_email: site.publisherEmail || (site as any).contactEmail,
        publisher_name: site.publisherName || (site as any).contactName,
        da: site.da || 0,
        dr: site.dr || 0,
        ahrefs_traffic: site.traffic || 0,
        ss: site.ss,
        category: site.category || 'GENERAL',
        country: site.country || 'US',
        site_language: site.language || 'en',
        tat: site.tat || '3-5 days',
        base_price: site.gbBasePrice || 0,
        li_base_price: site.liBasePrice,
        status: site.status || 'ACTIVE',
        negotiation_status: site.negotiationStatus || 'DONE'
      }));
      
      console.log('Sending to main project:', sites.length, 'sites');
      console.log('Sites data:', JSON.stringify(sites, null, 2));
      
      const response = await axiosInstance.post<MainProjectAPIResponse>(
        '/bulk-import',
        { 
          sites, 
          autoCreatePublisher: true,
          source: 'validation-tool'
        }
      );

      console.log('Main project response:', JSON.stringify(response.data, null, 2));

      if (response.data.success && response.data.data) {
        const responseData = response.data.data;
        console.log('Response data summary:', JSON.stringify(responseData.summary, null, 2));
        console.log('Success array:', JSON.stringify(responseData.success, null, 2));
        
        // Use summary counts from main project response, fallback to array lengths
        const successArray = responseData.success || [];
        const errorArray = responseData.errors || [];
        
        const successCount = responseData.summary?.successful || successArray.length;
        const errorCount = responseData.summary?.errors || errorArray.length;
        
        console.log('Calculated successCount:', successCount);
        console.log('Calculated errorCount:', errorCount);
        
        return {
          success: true,
          pushedCount: successCount,
          failedCount: errorCount,
          results: successArray
        };
      }

      console.log('Main project API returned non-success response');

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
   * Check prices for sites in main project (compares against base_price)
   * If new price < existing base_price -> UPDATE (proceed)
   * If new price >= existing base_price -> SKIP
   */
  static async checkPrices(sites: Array<{ site_url: string; new_price: number }>): Promise<{
    success: boolean;
    results: Array<{
      site_url: string;
      exists: boolean;
      current_price?: number;
      new_price: number;
      action: 'CREATE' | 'UPDATE' | 'SKIP_SAME' | 'SKIP_HIGHER';
      existing_id?: string;
      price_difference?: number;
    }>;
    summary: {
      total: number;
      toCreate: number;
      toUpdate: number;
      skipSamePrice: number;
      skipHigherPrice: number;
    };
    error?: string;
  }> {
    try {
      const axiosInstance = await this.getAxiosInstance();
      
      // Use the /check-prices endpoint from main tool
      // Send sites with base_price (main tool expects this field name)
      const sitesForApi = sites.map(s => ({
        site_url: s.site_url,
        base_price: s.new_price
      }));
      
      const response = await axiosInstance.post<MainProjectAPIResponse>(
        '/check-prices',
        { sites: sitesForApi }
      );

      if (response.data.success && response.data.data) {
        const apiResults = response.data.data.results || [];
        const apiSummary = response.data.data.summary || {};
        
        // Map API response to our format
        const results = apiResults.map((r: any) => ({
          site_url: r.site_url,
          exists: r.exists,
          current_price: r.current_price,
          new_price: r.new_price,
          action: r.action === 'SKIP_SAME_PRICE' ? 'SKIP_SAME' as const : 
                  r.action === 'SKIP_HIGHER_PRICE' ? 'SKIP_HIGHER' as const :
                  r.action as 'CREATE' | 'UPDATE' | 'SKIP_SAME' | 'SKIP_HIGHER',
          existing_id: r.existing_site_id,
          price_difference: r.price_difference
        }));

        return {
          success: true,
          results,
          summary: {
            total: apiSummary.total || sites.length,
            toCreate: apiSummary.toCreate || 0,
            toUpdate: apiSummary.toUpdate || 0,
            skipSamePrice: apiSummary.skipSamePrice || 0,
            skipHigherPrice: apiSummary.skipHigherPrice || 0
          }
        };
      }

      return {
        success: false,
        results: [],
        summary: { total: 0, toCreate: 0, toUpdate: 0, skipSamePrice: 0, skipHigherPrice: 0 },
        error: 'Invalid response from main project'
      };
    } catch (error: any) {
      console.error('Main project check prices error:', error.message);
      return {
        success: false,
        results: [],
        summary: { total: 0, toCreate: 0, toUpdate: 0, skipSamePrice: 0, skipHigherPrice: 0 },
        error: error.message
      };
    }
  }

  /**
   * Submit sites for approval (instead of direct import)
   */
  static async submitForApproval(data: Array<{
    websiteUrl: string;
    category?: string;
    language?: string;
    country?: string;
    da?: number;
    dr?: number;
    traffic?: number;
    ss?: number;
    gbBasePrice?: number;
    liBasePrice?: number;
    tat?: string;
    publisherName?: string;
    publisherEmail?: string;
    contactName?: string;
    contactEmail?: string;
    status?: string;
    negotiationStatus?: string;
  }>): Promise<{
    success: boolean;
    submitted: number;
    skipped: number;
    errors: number;
    details: {
      submitted: Array<{ site_url: string; action_type: string; old_price?: number; new_price?: number }>;
      skipped: Array<{ site_url: string; reason: string }>;
      errors: Array<{ site_url: string; reason: string }>;
    };
  }> {
    try {
      const axiosInstance = await this.getAxiosInstance();
      
      // Map data to main project format
      // Use publisherEmail if available, otherwise fall back to contactEmail
      const sites = data.map(site => ({
        site_url: site.websiteUrl,
        publisher_email: site.publisherEmail || (site as any).contactEmail,
        publisher_name: site.publisherName || (site as any).contactName,
        da: site.da || 0,
        dr: site.dr || 0,
        ahrefs_traffic: site.traffic || 0,
        ss: site.ss,
        category: site.category || 'GENERAL',
        country: site.country || 'US',
        site_language: site.language || 'en',
        tat: site.tat || '3-5 days',
        base_price: site.gbBasePrice || 0,
        li_base_price: site.liBasePrice,
        status: site.status || 'ACTIVE',
        negotiation_status: site.negotiationStatus || 'DONE'
      }));

      // console.log('Submitting for approval:', sites.length, 'sites');
      // console.log('=== DATA BEING SENT TO MAIN TOOL ===');
      // console.log('Sample INPUT data (before mapping):', JSON.stringify(data[0], null, 2));
      // console.log('Sample OUTPUT data (after mapping):', JSON.stringify(sites[0], null, 2));
      // console.log('Fields check - DA:', sites[0]?.da, 'DR:', sites[0]?.dr, 'Traffic:', sites[0]?.ahrefs_traffic);
      // console.log('Fields check - SS:', sites[0]?.ss, 'TAT:', sites[0]?.tat);
      // console.log('Fields check - Country:', sites[0]?.country, 'Language:', sites[0]?.site_language);
      // console.log('=====================================');

      const response = await axiosInstance.post<MainProjectAPIResponse>(
        '/submit-for-approval',
        { sites, source: 'validation-tool' }
      );

      console.log('Submit for approval response:', JSON.stringify(response.data, null, 2));

      if (response.data.success && response.data.data) {
        const responseData = response.data.data;
        const summary = response.data.summary || {};

        // Log skipped sites with reasons
        if (responseData.skipped && responseData.skipped.length > 0) {
          console.log('=== SKIPPED SITES ===');
          responseData.skipped.forEach((s: any) => {
            console.log(`  - ${s.site_url}: ${s.reason}`);
          });
          console.log('=====================');
        }

        return {
          success: true,
          submitted: summary.submitted || responseData.submitted?.length || 0,
          skipped: summary.skipped || responseData.skipped?.length || 0,
          errors: summary.errors || responseData.errors?.length || 0,
          details: {
            submitted: responseData.submitted || [],
            skipped: responseData.skipped || [],
            errors: responseData.errors || []
          }
        };
      }

      return {
        success: false,
        submitted: 0,
        skipped: 0,
        errors: data.length,
        details: { submitted: [], skipped: [], errors: [] }
      };
    } catch (error: any) {
      console.error('Main project submit for approval error:', error.message);
      return {
        success: false,
        submitted: 0,
        skipped: 0,
        errors: data.length,
        details: { submitted: [], skipped: [], errors: [{ site_url: 'all', reason: error.message }] }
      };
    }
  }

  /**
   * Fetch all publishers from main project
   */
  static async fetchPublishers(): Promise<{
    success: boolean;
    publishers: Array<{
      id: string;
      email: string | null;
      publisherName: string;
      modeOfCommunication?: string;
    }>;
    error?: string;
  }> {
    try {
      const axiosInstance = await this.getAxiosInstance();
      const response = await axiosInstance.get<MainProjectAPIResponse>('/publishers');

      if (response.data.success && response.data.data) {
        return {
          success: true,
          publishers: response.data.data.publishers || []
        };
      }

      return {
        success: false,
        publishers: [],
        error: 'Invalid response from main project'
      };
    } catch (error: any) {
      console.error('Main project fetch publishers error:', error.message);
      return {
        success: false,
        publishers: [],
        error: error.message
      };
    }
  }

  /**
   * Search publishers by email or name
   */
  static async searchPublishers(query: string): Promise<{
    success: boolean;
    publishers: Array<{
      id: string;
      email: string | null;
      publisherName: string;
    }>;
    error?: string;
  }> {
    try {
      const result = await this.fetchPublishers();
      if (!result.success) {
        return result;
      }

      // Filter publishers by query (email or name)
      const lowerQuery = query.toLowerCase();
      const filtered = result.publishers.filter(p => 
        p.email?.toLowerCase().includes(lowerQuery) ||
        p.publisherName?.toLowerCase().includes(lowerQuery)
      );

      return {
        success: true,
        publishers: filtered
      };
    } catch (error: any) {
      return {
        success: false,
        publishers: [],
        error: error.message
      };
    }
  }

  /**
   * Get publisher by email
   */
  static async getPublisherByEmail(email: string): Promise<{
    success: boolean;
    publisher?: {
      id: string;
      email: string | null;
      publisherName: string;
    };
    error?: string;
  }> {
    try {
      const result = await this.fetchPublishers();
      if (!result.success) {
        return { success: false, error: result.error };
      }

      const publisher = result.publishers.find(p => 
        p.email?.toLowerCase() === email.toLowerCase()
      );

      if (publisher) {
        return { success: true, publisher };
      }

      return { success: false, error: 'Publisher not found' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new publisher record locally
   * Note: The main tool API doesn't have a direct endpoint to create publishers.
   * Publishers are auto-created when sites are pushed via bulk-import with autoCreatePublisher: true.
   * This method creates a local record that will be synced when the site is pushed.
   */
  static async createPublisher(publisherData: {
    name: string;
    email?: string;
  }): Promise<{
    success: boolean;
    publisher?: {
      id: string;
      email: string | null;
      publisherName: string;
    };
    error?: string;
  }> {
    try {
      // Generate a local ID for tracking - the actual publisher will be created
      // in the main tool when the site is pushed via bulk-import with autoCreatePublisher: true
      const localId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Creating local publisher record (will sync on push):', {
        id: localId,
        name: publisherData.name,
        email: publisherData.email
      });
      
      return {
        success: true,
        publisher: {
          id: localId,
          email: publisherData.email || null,
          publisherName: publisherData.name
        }
      };
    } catch (error: any) {
      console.error('Create publisher error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check prices against pending sites in main project (accepted/rejected/pending)
   * This checks the PendingSite table in the main tool
   */
  static async checkPricesAgainstPendingSites(sites: Array<{ site_url: string; new_price: number }>): Promise<{
    success: boolean;
    results: Array<{
      site_url: string;
      exists: boolean;
      current_price?: number;
      new_price: number;
      action: 'CREATE' | 'UPDATE' | 'SKIP_SAME' | 'SKIP_HIGHER';
      status?: string;
    }>;
  }> {
    try {
      const axiosInstance = await this.getAxiosInstance();
      
      // Use the /check-pending-prices endpoint from main tool
      const sitesForApi = sites.map(s => ({
        site_url: s.site_url,
        base_price: s.new_price
      }));
      
      const response = await axiosInstance.post<MainProjectAPIResponse>(
        '/check-pending-prices',
        { sites: sitesForApi }
      );

      if (response.data.success && response.data.data) {
        const apiResults = response.data.data.results || [];
        
        const results = apiResults.map((r: any) => ({
          site_url: r.site_url,
          exists: r.exists,
          current_price: r.current_price,
          new_price: r.new_price,
          action: r.action === 'SKIP_SAME_PRICE' ? 'SKIP_SAME' as const : 
                  r.action === 'SKIP_HIGHER_PRICE' ? 'SKIP_HIGHER' as const :
                  r.action as 'CREATE' | 'UPDATE' | 'SKIP_SAME' | 'SKIP_HIGHER',
          status: r.status
        }));

        return { success: true, results };
      }

      return { success: false, results: [] };
    } catch (error: any) {
      console.error('Main project check pending prices error:', error.message);
      // If endpoint doesn't exist, return empty results (not a failure)
      return { success: true, results: [] };
    }
  }

  /**
   * Comprehensive price check against ALL modules in main tool:
   * - Guest Blog Sites (main sites)
   * - Pending Sites (accepted/rejected/pending)
   */
  static async checkPricesAllModules(sites: Array<{ site_url: string; new_price: number }>): Promise<{
    success: boolean;
    results: Array<{
      site_url: string;
      exists: boolean;
      current_price?: number;
      new_price: number;
      action: 'CREATE' | 'UPDATE' | 'SKIP_SAME' | 'SKIP_HIGHER';
      source?: string;
    }>;
    summary: {
      total: number;
      toCreate: number;
      toUpdate: number;
      skipSamePrice: number;
      skipHigherPrice: number;
    };
  }> {
    try {
      // Check against main guest blog sites
      const mainSitesResult = await this.checkPrices(sites);
      
      // Check against pending sites
      const pendingSitesResult = await this.checkPricesAgainstPendingSites(sites);
      
      // Merge results - use the most restrictive action (skip if exists anywhere with same/higher price)
      const mergedResults = sites.map(site => {
        const normalizedUrl = normalizeDomain(site.site_url);
        
        // Find result from main sites check
        const mainResult = mainSitesResult.results.find(r => 
          normalizeDomain(r.site_url) === normalizedUrl
        );
        
        // Find result from pending sites check
        const pendingResult = pendingSitesResult.results.find(r => 
          normalizeDomain(r.site_url) === normalizedUrl
        );
        
        // Determine final action based on both checks
        // Priority: SKIP_SAME > SKIP_HIGHER > UPDATE > CREATE
        let finalAction: 'CREATE' | 'UPDATE' | 'SKIP_SAME' | 'SKIP_HIGHER' = 'CREATE';
        let finalPrice: number | undefined;
        let source: string | undefined;
        let exists = false;
        
        // Check main sites result
        if (mainResult?.exists) {
          exists = true;
          finalPrice = mainResult.current_price;
          source = 'guest_blog_sites';
          finalAction = mainResult.action;
        }
        
        // Check pending sites result - override if more restrictive
        if (pendingResult?.exists) {
          const pendingAction = pendingResult.action;
          
          // If pending has same/higher price, use that (more restrictive)
          if (pendingAction === 'SKIP_SAME' || pendingAction === 'SKIP_HIGHER') {
            // Only override if main didn't already skip, or if pending price is lower
            if (finalAction === 'CREATE' || finalAction === 'UPDATE' || 
                (pendingResult.current_price !== undefined && 
                 (finalPrice === undefined || pendingResult.current_price <= finalPrice))) {
              exists = true;
              finalPrice = pendingResult.current_price;
              source = 'pending_sites';
              finalAction = pendingAction;
            }
          } else if (pendingAction === 'UPDATE' && finalAction === 'CREATE') {
            // Pending exists but with higher price - can update
            exists = true;
            finalPrice = pendingResult.current_price;
            source = 'pending_sites';
            finalAction = 'UPDATE';
          }
        }
        
        return {
          site_url: site.site_url,
          exists,
          current_price: finalPrice,
          new_price: site.new_price,
          action: finalAction,
          source
        };
      });
      
      // Calculate summary
      const summary = {
        total: mergedResults.length,
        toCreate: mergedResults.filter(r => r.action === 'CREATE').length,
        toUpdate: mergedResults.filter(r => r.action === 'UPDATE').length,
        skipSamePrice: mergedResults.filter(r => r.action === 'SKIP_SAME').length,
        skipHigherPrice: mergedResults.filter(r => r.action === 'SKIP_HIGHER').length
      };
      
      return { success: true, results: mergedResults, summary };
    } catch (error: any) {
      console.error('Main project check prices all modules error:', error.message);
      return {
        success: false,
        results: [],
        summary: { total: 0, toCreate: 0, toUpdate: 0, skipSamePrice: 0, skipHigherPrice: 0 }
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
