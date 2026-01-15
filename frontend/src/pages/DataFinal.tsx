import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Checkbox,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Divider
} from '@mui/material';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Category options
const CATEGORIES = [
  { value: "BUSINESS_ENTREPRENEURSHIP", label: "Business & Entrepreneurship" },
  { value: "MARKETING_SEO", label: "Marketing & SEO" },
  { value: "TECHNOLOGY_GADGETS", label: "Technology & Gadgets" },
  { value: "HEALTH_FITNESS", label: "Health & Fitness" },
  { value: "LIFESTYLE_WELLNESS", label: "Lifestyle & Wellness" },
  { value: "FINANCE_INVESTMENT", label: "Finance & Investment" },
  { value: "EDUCATION_CAREER", label: "Education & Career" },
  { value: "TRAVEL_TOURISM", label: "Travel & Tourism" },
  { value: "FOOD_NUTRITION", label: "Food & Nutrition" },
  { value: "REAL_ESTATE_HOME_IMPROVEMENT", label: "Real Estate & Home Improvement" },
  { value: "AI_FUTURE_TECH", label: "AI & Future Tech" },
  { value: "ECOMMERCE_STARTUPS", label: "E-commerce & Startups" },
  { value: "SUSTAINABILITY_GREEN_LIVING", label: "Sustainability & Green Living" },
  { value: "PARENTING_RELATIONSHIPS", label: "Parenting & Relationships" },
  { value: "FASHION_BEAUTY", label: "Fashion & Beauty" },
  { value: "ENTERTAINMENT_MEDIA", label: "Entertainment & Media" },
  { value: "SPORTS_FITNESS", label: "Sports & Fitness" },
  { value: "GENERAL", label: "General" },
  { value: "OTHERS", label: "Others" }
];

// Country options with ISO codes (matching main tool format)
const COUNTRIES = [
  { value: "AF", label: "Afghanistan" },
  { value: "AL", label: "Albania" },
  { value: "DZ", label: "Algeria" },
  { value: "AD", label: "Andorra" },
  { value: "AO", label: "Angola" },
  { value: "AG", label: "Antigua and Barbuda" },
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaijan" },
  { value: "BS", label: "Bahamas" },
  { value: "BH", label: "Bahrain" },
  { value: "BD", label: "Bangladesh" },
  { value: "BB", label: "Barbados" },
  { value: "BY", label: "Belarus" },
  { value: "BE", label: "Belgium" },
  { value: "BZ", label: "Belize" },
  { value: "BJ", label: "Benin" },
  { value: "BT", label: "Bhutan" },
  { value: "BO", label: "Bolivia" },
  { value: "BA", label: "Bosnia and Herzegovina" },
  { value: "BW", label: "Botswana" },
  { value: "BR", label: "Brazil" },
  { value: "BN", label: "Brunei" },
  { value: "BG", label: "Bulgaria" },
  { value: "BF", label: "Burkina Faso" },
  { value: "BI", label: "Burundi" },
  { value: "CV", label: "Cabo Verde" },
  { value: "KH", label: "Cambodia" },
  { value: "CM", label: "Cameroon" },
  { value: "CA", label: "Canada" },
  { value: "CF", label: "Central African Republic" },
  { value: "TD", label: "Chad" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CO", label: "Colombia" },
  { value: "KM", label: "Comoros" },
  { value: "CG", label: "Congo" },
  { value: "CR", label: "Costa Rica" },
  { value: "HR", label: "Croatia" },
  { value: "CU", label: "Cuba" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czech Republic" },
  { value: "DK", label: "Denmark" },
  { value: "DJ", label: "Djibouti" },
  { value: "DM", label: "Dominica" },
  { value: "DO", label: "Dominican Republic" },
  { value: "EC", label: "Ecuador" },
  { value: "EG", label: "Egypt" },
  { value: "SV", label: "El Salvador" },
  { value: "GQ", label: "Equatorial Guinea" },
  { value: "ER", label: "Eritrea" },
  { value: "EE", label: "Estonia" },
  { value: "SZ", label: "Eswatini" },
  { value: "ET", label: "Ethiopia" },
  { value: "FJ", label: "Fiji" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "GA", label: "Gabon" },
  { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "GR", label: "Greece" },
  { value: "GD", label: "Grenada" },
  { value: "GT", label: "Guatemala" },
  { value: "GN", label: "Guinea" },
  { value: "GW", label: "Guinea-Bissau" },
  { value: "GY", label: "Guyana" },
  { value: "HT", label: "Haiti" },
  { value: "HN", label: "Honduras" },
  { value: "HU", label: "Hungary" },
  { value: "IS", label: "Iceland" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IR", label: "Iran" },
  { value: "IQ", label: "Iraq" },
  { value: "IE", label: "Ireland" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "JM", label: "Jamaica" },
  { value: "JP", label: "Japan" },
  { value: "JO", label: "Jordan" },
  { value: "KZ", label: "Kazakhstan" },
  { value: "KE", label: "Kenya" },
  { value: "KI", label: "Kiribati" },
  { value: "KW", label: "Kuwait" },
  { value: "KG", label: "Kyrgyzstan" },
  { value: "LA", label: "Laos" },
  { value: "LV", label: "Latvia" },
  { value: "LB", label: "Lebanon" },
  { value: "LS", label: "Lesotho" },
  { value: "LR", label: "Liberia" },
  { value: "LY", label: "Libya" },
  { value: "LI", label: "Liechtenstein" },
  { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" },
  { value: "MG", label: "Madagascar" },
  { value: "MW", label: "Malawi" },
  { value: "MY", label: "Malaysia" },
  { value: "MV", label: "Maldives" },
  { value: "ML", label: "Mali" },
  { value: "MT", label: "Malta" },
  { value: "MH", label: "Marshall Islands" },
  { value: "MR", label: "Mauritania" },
  { value: "MU", label: "Mauritius" },
  { value: "MX", label: "Mexico" },
  { value: "FM", label: "Micronesia" },
  { value: "MD", label: "Moldova" },
  { value: "MC", label: "Monaco" },
  { value: "MN", label: "Mongolia" },
  { value: "ME", label: "Montenegro" },
  { value: "MA", label: "Morocco" },
  { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar" },
  { value: "NA", label: "Namibia" },
  { value: "NR", label: "Nauru" },
  { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands" },
  { value: "NZ", label: "New Zealand" },
  { value: "NI", label: "Nicaragua" },
  { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" },
  { value: "KP", label: "North Korea" },
  { value: "MK", label: "North Macedonia" },
  { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" },
  { value: "PK", label: "Pakistan" },
  { value: "PW", label: "Palau" },
  { value: "PS", label: "Palestine" },
  { value: "PA", label: "Panama" },
  { value: "PG", label: "Papua New Guinea" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "QA", label: "Qatar" },
  { value: "RO", label: "Romania" },
  { value: "RU", label: "Russia" },
  { value: "RW", label: "Rwanda" },
  { value: "KN", label: "Saint Kitts and Nevis" },
  { value: "LC", label: "Saint Lucia" },
  { value: "VC", label: "Saint Vincent and the Grenadines" },
  { value: "WS", label: "Samoa" },
  { value: "SM", label: "San Marino" },
  { value: "ST", label: "Sao Tome and Principe" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "SN", label: "Senegal" },
  { value: "RS", label: "Serbia" },
  { value: "SC", label: "Seychelles" },
  { value: "SL", label: "Sierra Leone" },
  { value: "SG", label: "Singapore" },
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "SB", label: "Solomon Islands" },
  { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" },
  { value: "KR", label: "South Korea" },
  { value: "SS", label: "South Sudan" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "SD", label: "Sudan" },
  { value: "SR", label: "Suriname" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "SY", label: "Syria" },
  { value: "TW", label: "Taiwan" },
  { value: "TJ", label: "Tajikistan" },
  { value: "TZ", label: "Tanzania" },
  { value: "TH", label: "Thailand" },
  { value: "TL", label: "Timor-Leste" },
  { value: "TG", label: "Togo" },
  { value: "TO", label: "Tonga" },
  { value: "TT", label: "Trinidad and Tobago" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Turkey" },
  { value: "TM", label: "Turkmenistan" },
  { value: "TV", label: "Tuvalu" },
  { value: "UG", label: "Uganda" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "UK", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistan" },
  { value: "VU", label: "Vanuatu" },
  { value: "VA", label: "Vatican City" },
  { value: "VE", label: "Venezuela" },
  { value: "VN", label: "Vietnam" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" }
];

// Language options with lowercase short codes
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
  { value: "bn", label: "Bengali" },
  { value: "pa", label: "Punjabi" },
  { value: "ur", label: "Urdu" },
  { value: "vi", label: "Vietnamese" },
  { value: "th", label: "Thai" },
  { value: "tr", label: "Turkish" },
  { value: "pl", label: "Polish" },
  { value: "uk", label: "Ukrainian" },
  { value: "ro", label: "Romanian" },
  { value: "nl", label: "Dutch" },
  { value: "el", label: "Greek" },
  { value: "hu", label: "Hungarian" },
  { value: "cs", label: "Czech" },
  { value: "sv", label: "Swedish" },
  { value: "da", label: "Danish" },
  { value: "fi", label: "Finnish" },
  { value: "no", label: "Norwegian" },
  { value: "sk", label: "Slovak" },
  { value: "hr", label: "Croatian" },
  { value: "bg", label: "Bulgarian" },
  { value: "sr", label: "Serbian" },
  { value: "sl", label: "Slovenian" },
  { value: "lt", label: "Lithuanian" },
  { value: "lv", label: "Latvian" },
  { value: "et", label: "Estonian" },
  { value: "he", label: "Hebrew" },
  { value: "id", label: "Indonesian" },
  { value: "ms", label: "Malay" },
  { value: "tl", label: "Filipino" },
  { value: "sw", label: "Swahili" },
  { value: "fa", label: "Persian" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "mr", label: "Marathi" },
  { value: "gu", label: "Gujarati" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
  { value: "ne", label: "Nepali" },
  { value: "si", label: "Sinhala" },
  { value: "my", label: "Burmese" },
  { value: "km", label: "Khmer" },
  { value: "lo", label: "Lao" },
  { value: "am", label: "Amharic" },
  { value: "other", label: "Other" }
];

interface Publisher {
  id: string;
  email: string | null;
  publisherName: string;
}

interface DataFinalRecord {
  id: string;
  websiteUrl: string;
  publisherName?: string;
  publisherEmail?: string;
  publisherId?: string;
  publisherMatched?: boolean;
  contactName?: string;
  contactEmail?: string;
  da?: number;
  dr?: number;
  traffic?: number;
  ss?: number;
  keywords?: number;
  category?: string;
  country?: string;
  language?: string;
  tat?: string;
  gbBasePrice?: number;
  liBasePrice?: number;
  status: string;
  negotiationStatus: string;
  createdAt: string;
  reachedBy?: string;
  reachedByName?: string;
  reachedAt?: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
  mainProjectId?: string;
  pushedAt?: string;
  pushedBy?: string;
  reachedByUser?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

const DataFinal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DataFinalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<DataFinalRecord | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterByUser, setFilterByUser] = useState<string>('all');
  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState('');
  const [pushing, setPushing] = useState(false);
  const [creatingPublisher, setCreatingPublisher] = useState(false);
  const [showCreatePublisherDialog, setShowCreatePublisherDialog] = useState(false);
  const [createPublisherRecord, setCreatePublisherRecord] = useState<DataFinalRecord | null>(null);
  
  // Export state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportPublishers, setExportPublishers] = useState<Array<{
    id: string;
    email: string;
    name: string;
    isMatched: boolean;
    recordCount: number;
  }>>([]);
  const [selectedExportPublisher, setSelectedExportPublisher] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  
  // Publisher state
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loadingPublishers, setLoadingPublishers] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(null);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    publisherEmail: '',
    publisherName: '',
    publisherMatched: false,
    contactName: '',
    contactEmail: '',
    da: '',
    dr: '',
    traffic: '',
    ss: '',
    keywords: '',
    category: '',
    country: '',
    language: '',
    tat: '',
    gbBasePrice: '',
    liBasePrice: '',
    status: '',
    negotiationStatus: ''
  });

  // Fetch publishers from main project
  const fetchPublishers = useCallback(async () => {
    setLoadingPublishers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/publishers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPublishers(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch publishers:', err);
    } finally {
      setLoadingPublishers(false);
    }
  }, []);

  // Fetch publishers for export dropdown
  const fetchExportPublishers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/data-final/publishers/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setExportPublishers(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch export publishers:', err);
    }
  };

  // Handle publisher selection - auto-fill email and name
  const handlePublisherChange = (publisher: Publisher | null) => {
    setSelectedPublisher(publisher);
    if (publisher) {
      setEditFormData(prev => ({
        ...prev,
        publisherEmail: publisher.email || '',
        publisherName: publisher.publisherName || ''
      }));
    }
  };

  useEffect(() => {
    fetchData();
    fetchPublishers();
    if (user?.role === 'SUPER_ADMIN') {
      fetchUsers();
      fetchExportPublishers();
    }
  }, [fetchPublishers]);

  useEffect(() => {
    fetchData();
  }, [filterByUser]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/users?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data.data.users || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API_BASE_URL}/data-final`;
      if (filterByUser !== 'all') {
        url += `?reachedBy=${filterByUser}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = response.data.data;
      console.log('[DataFinal] Fetched data sample:', result.data?.[0]);
      console.log('[DataFinal] Price fields check:', {
        hasGbBasePrice: result.data?.[0]?.gbBasePrice !== undefined,
        hasLiBasePrice: result.data?.[0]?.liBasePrice !== undefined,
        gbBasePriceValue: result.data?.[0]?.gbBasePrice,
        liBasePriceValue: result.data?.[0]?.liBasePrice
      });
      setData(result.data || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record: DataFinalRecord) => {
    setSelectedRecord(record);
    setShowViewDialog(true);
  };

  const handleEdit = (record: DataFinalRecord) => {
    setSelectedRecord(record);
    setEditFormData({
      publisherEmail: record.publisherEmail || '',
      publisherName: record.publisherName || '',
      publisherMatched: record.publisherMatched || false,
      contactName: record.contactName || '',
      contactEmail: record.contactEmail || '',
      da: record.da?.toString() || '',
      dr: record.dr?.toString() || '',
      traffic: record.traffic?.toString() || '',
      ss: record.ss?.toString() || '',
      keywords: record.keywords?.toString() || '',
      category: record.category || '',
      country: record.country || '',
      language: record.language || '',
      tat: record.tat || '',
      gbBasePrice: record.gbBasePrice?.toString() || '',
      liBasePrice: record.liBasePrice?.toString() || '',
      status: record.status,
      negotiationStatus: record.negotiationStatus
    });
    // Find matching publisher from list
    const matchingPublisher = publishers.find(p => 
      p.email?.toLowerCase() === record.publisherEmail?.toLowerCase()
    );
    setSelectedPublisher(matchingPublisher || null);
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/data-final/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setData(data.filter(item => item.id !== id));
      alert('Record deleted successfully');
    } catch (err: any) {
      console.error('Error deleting record:', err);
      alert(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Prepare update data
      const updateData = {
        publisherEmail: editFormData.publisherEmail,
        publisherName: editFormData.publisherName,
        contactName: editFormData.contactName,
        contactEmail: editFormData.contactEmail,
        da: editFormData.da ? parseInt(editFormData.da) : undefined,
        dr: editFormData.dr ? parseInt(editFormData.dr) : undefined,
        traffic: editFormData.traffic ? parseInt(editFormData.traffic) : undefined,
        ss: editFormData.ss ? parseInt(editFormData.ss) : undefined,
        keywords: editFormData.keywords ? parseInt(editFormData.keywords) : undefined,
        category: editFormData.category,
        country: editFormData.country,
        language: editFormData.language,
        tat: editFormData.tat,
        gbBasePrice: editFormData.gbBasePrice ? parseFloat(editFormData.gbBasePrice) : undefined,
        liBasePrice: editFormData.liBasePrice ? parseFloat(editFormData.liBasePrice) : undefined,
        status: editFormData.status,
        negotiationStatus: editFormData.negotiationStatus
      };

      const response = await axios.put(
        `${API_BASE_URL}/data-final/${selectedRecord.id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update the record in the list
        setData(data.map(item => 
          item.id === selectedRecord.id 
            ? { ...item, ...updateData }
            : item
        ));
        alert('Record updated successfully');
        setShowEditDialog(false);
        setSelectedRecord(null);
      }
    } catch (err: any) {
      console.error('Error updating record:', err);
      alert(err.response?.data?.message || 'Failed to update record');
    } finally {
      setSaving(false);
    }
  };

  // Handle marking contact info as publisher
  const handleCreatePublisher = async () => {
    if (!createPublisherRecord) return;
    
    const name = createPublisherRecord.contactName;
    const email = createPublisherRecord.contactEmail;
    
    if (!name && !email) {
      alert('No contact information available to mark as publisher');
      return;
    }
    
    setCreatingPublisher(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/publishers`,
        {
          name: name || email?.split('@')[0] || 'Unknown',
          email: email,
          dataFinalId: createPublisherRecord.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const publisherName = response.data.data.publisherName;
        const publisherEmail = response.data.data.email || '';
        
        // Update the record in the list
        setData(data.map(item => 
          item.id === createPublisherRecord.id 
            ? { 
                ...item, 
                publisherId: response.data.data.id,
                publisherName: publisherName,
                publisherEmail: publisherEmail,
                publisherMatched: true
              }
            : item
        ));
        
        // Also update editFormData if we're editing this record
        setEditFormData(prev => ({
          ...prev,
          publisherName: publisherName,
          publisherEmail: publisherEmail,
          publisherMatched: true
        }));
        
        setSuccess(`Marked as Publisher: "${publisherName}". When you push this record to the LM Tool, the publisher will be created or linked automatically.`);
        setShowCreatePublisherDialog(false);
        setCreatePublisherRecord(null);
        
        // Refresh data from backend to ensure consistency
        fetchData();
        fetchPublishers();
      }
    } catch (err: any) {
      console.error('Error marking as publisher:', err);
      alert(err.response?.data?.error || 'Failed to mark as publisher');
    } finally {
      setCreatingPublisher(false);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = new Set(data.map(record => record.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      setError('Please select at least one record to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} record(s)?`)) {
      return;
    }

    setDeleting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const deletePromises = Array.from(selectedIds).map(id =>
        axios.delete(`${API_BASE_URL}/data-final/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      await Promise.all(deletePromises);
      
      setSuccess(`Successfully deleted ${selectedIds.size} record(s)`);
      setSelectedIds(new Set());
      fetchData();
    } catch (err: any) {
      console.error('Error deleting records:', err);
      setError(err.response?.data?.message || 'Failed to delete records');
    } finally {
      setDeleting(false);
    }
  };

  const handlePushSelected = async () => {
    if (selectedIds.size === 0) return;
    
    // Check if all selected records have GB Base Price
    const selectedRecords = data.filter(d => selectedIds.has(d.id));
    const recordsWithoutPrice = selectedRecords.filter(r => !r.gbBasePrice || r.gbBasePrice <= 0);
    
    if (recordsWithoutPrice.length > 0) {
      const siteUrls = recordsWithoutPrice.map(r => r.websiteUrl).join('\n- ');
      setError(`GB Base Price is required before pushing to LM Tool. The following sites are missing GB Base Price:\n- ${siteUrls}`);
      return;
    }
    
    // Check if all selected records have publisher email (either from matched publisher or contact)
    const recordsWithoutPublisher = selectedRecords.filter(r => 
      !r.publisherEmail && !r.contactEmail
    );
    
    if (recordsWithoutPublisher.length > 0) {
      const siteUrls = recordsWithoutPublisher.map(r => r.websiteUrl).join('\n- ');
      setError(`Publisher/Contact Email is required before pushing to LM Tool. The following sites are missing email:\n- ${siteUrls}`);
      return;
    }
    
    if (!window.confirm(`Push ${selectedIds.size} site(s) to LM Tool?`)) {
      return;
    }
    
    setPushing(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/data-final/push-to-main-project`,
        { recordIds: Array.from(selectedIds) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Frontend received response:', response.data);
      const result = response.data.data;
      
      // Use the detailed message from backend
      let message = result.message || `Pushed ${result.successful} site(s) to LM Tool.`;
      
      // Show skipped site details if available
      if (result.details?.skipped && result.details.skipped.length > 0) {
        const skippedDetails = result.details.skipped.map((s: any) => `${s.site_url}: ${s.reason}`).join('\n');
        console.log('Skipped sites:', skippedDetails);
      }
      
      if (result.failed > 0) {
        message += ` ${result.failed} failed.`;
      }
      
      setSuccess(message);
      setSelectedIds(new Set());
      fetchData();
      
      // Navigate to Pushed Data page after 2 seconds
      setTimeout(() => {
        navigate('/pushed-data');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to push sites');
      setPushing(false);
    }
  };

  // Handle publisher export
  const handleExportByPublisher = async () => {
    if (!selectedExportPublisher) {
      setError('Please select a publisher to export');
      return;
    }

    setExporting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const selectedPublisher = exportPublishers.find(p => p.email === selectedExportPublisher);
      
      const response = await axios.get(
        `${API_BASE_URL}/data-final/export/publisher?publisherEmail=${encodeURIComponent(selectedExportPublisher)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const publisherName = selectedPublisher?.name || 'Unknown';
      const sanitizedName = publisherName.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `publisher_${sanitizedName}_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(`Successfully exported ${selectedPublisher?.recordCount || 0} records for ${publisherName}`);
      setShowExportDialog(false);
      setSelectedExportPublisher('');
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.response?.data?.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handlePushAll = async () => {
    const unpushedRecords = data.filter(d => !d.mainProjectId);
    const unpushedCount = unpushedRecords.length;
    
    if (unpushedCount === 0) {
      setError('No unpushed sites to transfer');
      return;
    }
    
    // Check if all unpushed records have GB Base Price
    const recordsWithoutPrice = unpushedRecords.filter(r => !r.gbBasePrice || r.gbBasePrice <= 0);
    
    if (recordsWithoutPrice.length > 0) {
      const siteUrls = recordsWithoutPrice.map(r => r.websiteUrl).join('\n- ');
      setError(`GB Base Price is required before pushing to LM Tool. The following sites are missing GB Base Price:\n- ${siteUrls}`);
      return;
    }
    
    if (!window.confirm(`Push all ${unpushedCount} unpushed site(s) to LM Tool?`)) {
      return;
    }
    
    setPushing(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/data-final/push-to-main-project`,
        { recordIds: [] }, // Empty = all unpushed
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Frontend received response (push all):', response.data);
      const result = response.data.data;
      
      // Use the detailed message from backend
      let message = result.message || `Pushed ${result.successful} site(s) to LM Tool.`;
      
      // Show skipped site details if available
      if (result.details?.skipped && result.details.skipped.length > 0) {
        const skippedDetails = result.details.skipped.map((s: any) => `${s.site_url}: ${s.reason}`).join('\n');
        console.log('Skipped sites:', skippedDetails);
      }
      
      if (result.failed > 0) {
        message += ` ${result.failed} failed.`;
      }
      
      setSuccess(message);
      fetchData();
      
      // Navigate to Pushed Data page after 2 seconds
      setTimeout(() => {
        navigate('/pushed-data');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to push sites');
      setPushing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'default';
      default:
        return 'default';
    }
  };

  const getNegotiationStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'warning';
      case 'DONE':
        return 'success';
      default:
        return 'default';
    }
  };

  // Get category label from value
  const getCategoryLabel = (value: string | undefined) => {
    if (!value) return null;
    const category = CATEGORIES.find(c => c.value === value);
    return category ? category.label : value;
  };

  // Get language label from value
  const getLanguageLabel = (value: string | undefined) => {
    if (!value) return null;
    const language = LANGUAGES.find(l => l.value === value || l.value === value?.toLowerCase());
    return language ? language.label : value;
  };

  // Get country label from value
  const getCountryLabel = (value: string | undefined) => {
    if (!value) return null;
    const country = COUNTRIES.find(c => c.value === value || c.value === value?.toUpperCase());
    return country ? country.label : value;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Paginated data
  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Data Final
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Records marked as Reached by Admin users (Super Admin Only)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filter and Export - Inline for Super Admin */}
      {user?.role === 'SUPER_ADMIN' && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Filter by Completed By</InputLabel>
            <Select
              value={filterByUser}
              label="Filter by Completed By"
              onChange={(e) => setFilterByUser(e.target.value)}
            >
              <MenuItem value="all">All Users</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Export Button - Inline with filter */}
          {data.length > 0 && exportPublishers.length > 0 && (
            <Button
              variant="outlined"
              color="info"
              size="small"
              onClick={() => setShowExportDialog(true)}
              startIcon={<span>📊</span>}
            >
              Export by Publisher
            </Button>
          )}
        </Box>
      )}

      <Card>
        <CardContent>
          {/* Push Buttons */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={handlePushSelected}
                  disabled={pushing}
                >
                  {pushing ? '⏳ Pushing...' : `📤 Push ${selectedIds.size} to LM Tool`}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={handleBulkDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Selected'}
                </Button>
                <Typography variant="body2" sx={{ alignSelf: 'center', ml: 1 }}>
                  {selectedIds.size} record(s) selected
                </Typography>
              </>
            )}
            
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={handlePushAll}
              disabled={pushing || data.filter(d => !d.mainProjectId).length === 0}
            >
              📤 Push All to LM Tool
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : data.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                No records in Data Final yet. Records will appear here when Admins mark them as Reached.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.size === data.length && data.length > 0}
                        indeterminate={selectedIds.size > 0 && selectedIds.size < data.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 50 }}><strong>Edit</strong></TableCell>
                    <TableCell><strong>Site URL</strong></TableCell>
                    <TableCell><strong>Publisher / Contact</strong></TableCell>
                    {user?.role === 'SUPER_ADMIN' && <TableCell><strong>Email</strong></TableCell>}
                    <TableCell><strong>DA</strong></TableCell>
                    <TableCell><strong>DR</strong></TableCell>
                    <TableCell><strong>Traffic</strong></TableCell>
                    <TableCell><strong>SS</strong></TableCell>
                    <TableCell><strong>Keywords</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Country</strong></TableCell>
                    <TableCell><strong>Language</strong></TableCell>
                    <TableCell><strong>TAT</strong></TableCell>
                    <TableCell><strong>GB Base Price</strong></TableCell>
                    <TableCell><strong>LI Base Price</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Negotiation Status</strong></TableCell>
                    <TableCell><strong>Marked As Reached By</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleSelectOne(row.id)}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ width: 50 }}>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEdit(row)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          component="a"
                          href={row.websiteUrl.startsWith('http') ? row.websiteUrl : `https://${row.websiteUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 'bold',
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {row.websiteUrl}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {row.publisherMatched ? (
                          <Box>
                            <Typography variant="body2">{row.publisherName}</Typography>
                            <Typography variant="caption" color="success.main">✓ Publisher</Typography>
                          </Box>
                        ) : row.contactName || row.contactEmail ? (
                          <Box>
                            <Typography variant="body2">{row.contactName || 'No name'}</Typography>
                            <Typography variant="caption" color="info.main">Contact</Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Not set</Typography>
                        )}
                      </TableCell>
                      {user?.role === 'SUPER_ADMIN' && (
                        <TableCell>
                          {row.publisherMatched ? (
                            row.publisherEmail || <Typography variant="caption" color="text.secondary">-</Typography>
                          ) : (
                            row.contactEmail || <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {row.da || <Typography variant="caption" color="text.secondary">-</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.dr || <Typography variant="caption" color="text.secondary">-</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.traffic || <Typography variant="caption" color="text.secondary">-</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.ss || <Typography variant="caption" color="text.secondary">-</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.keywords || <Typography variant="caption" color="text.secondary">-</Typography>}
                      </TableCell>
                      <TableCell>
                        {getCategoryLabel(row.category) || <Typography variant="caption" color="text.secondary">Not set</Typography>}
                      </TableCell>
                      <TableCell>
                        {getCountryLabel(row.country) || <Typography variant="caption" color="text.secondary">Not set</Typography>}
                      </TableCell>
                      <TableCell>
                        {getLanguageLabel(row.language) || <Typography variant="caption" color="text.secondary">Not set</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.tat || <Typography variant="caption" color="text.secondary">Not set</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.gbBasePrice ? `$${row.gbBasePrice}` : <Typography variant="caption" color="text.secondary">Not set</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.liBasePrice ? `$${row.liBasePrice}` : <Typography variant="caption" color="text.secondary">Not set</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.status} 
                          color={getStatusColor(row.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.negotiationStatus.replace('_', ' ')} 
                          color={getNegotiationStatusColor(row.negotiationStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {row.reachedByUser ? (
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'primary.main',
                                fontWeight: 500
                              }}
                            >
                              {row.reachedByUser.firstName}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.7rem',
                                color: 'text.secondary',
                                display: 'block'
                              }}
                            >
                              {row.reachedByUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {row.reachedByName || 'Unknown'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleView(row)}
                          >
                            <RemoveRedEyeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(row.id)}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {/* Mark as Publisher button - only for Super Admin and records with contact info but no matched publisher */}
                        {user?.role === 'SUPER_ADMIN' && !row.publisherMatched && (row.contactName || row.contactEmail) && (
                          <Tooltip title="Mark as Publisher">
                            <Button
                              size="small"
                              variant="outlined"
                              color="info"
                              onClick={() => {
                                setCreatePublisherRecord(row);
                                setShowCreatePublisherDialog(true);
                              }}
                              sx={{ ml: 1, minWidth: 'auto', px: 1 }}
                            >
                              Mark Publisher
                            </Button>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {/* Pagination - show when data exists */}
          {data.length > 0 && (
            <TablePagination
              component="div"
              count={data.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[25, 50, 100, 250, 500]}
              showFirstButton
              showLastButton
            />
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>View Record Details</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedRecord && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website URL"
                  value={selectedRecord.websiteUrl}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              {selectedRecord.publisherMatched ? (
                <>
                  <Grid item xs={12}>
                    <Alert severity="success">
                      {selectedRecord.publisherId?.startsWith('pending_')
                        ? 'Publisher will be created in the LM Tool when you push this record.'
                        : 'Publisher matched from LM Tool'}
                    </Alert>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Publisher Name"
                      value={selectedRecord.publisherName || ''}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Publisher Email"
                      value={selectedRecord.publisherEmail || ''}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Contact Name"
                      value={selectedRecord.contactName || ''}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Contact Email"
                      value={selectedRecord.contactEmail || ''}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="DA"
                  value={selectedRecord.da || '-'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="DR"
                  value={selectedRecord.dr || '-'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Traffic"
                  value={selectedRecord.traffic || '-'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="SS"
                  value={selectedRecord.ss || '-'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Keywords"
                  value={selectedRecord.keywords || '-'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Category"
                  value={selectedRecord.category || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Country"
                  value={selectedRecord.country || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Language"
                  value={selectedRecord.language || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="TAT"
                  value={selectedRecord.tat || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Status"
                  value={selectedRecord.status}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="GB Base Price"
                  value={selectedRecord.gbBasePrice ? `$${selectedRecord.gbBasePrice}` : 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="LI Base Price"
                  value={selectedRecord.liBasePrice ? `$${selectedRecord.liBasePrice}` : 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Negotiation Status"
                  value={selectedRecord.negotiationStatus.replace('_', ' ')}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Created At"
                  value={formatDate(selectedRecord.createdAt)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Record</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedRecord && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Site URL: <strong>{selectedRecord.websiteUrl}</strong> (Non-editable)
              </Typography>
              
              <Grid container spacing={2}>
                {/* Publisher info - read-only when matched from main tool, editable when pending */}
                {editFormData.publisherMatched ? (
                  <>
                    <Grid item xs={12}>
                      <Alert severity="success" sx={{ mb: 1 }}>
                        {selectedRecord.publisherId?.startsWith('pending_') ? (
                          <>Publisher will be created in the LM Tool when you push this record.</>
                        ) : (
                          <>Publisher matched from LM Tool: <strong>{editFormData.publisherName}</strong></>
                        )}
                      </Alert>
                    </Grid>
                    {user?.role === 'SUPER_ADMIN' && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Publisher Name"
                            value={editFormData.publisherName}
                            onChange={(e) => setEditFormData({...editFormData, publisherName: e.target.value})}
                            helperText="Editable - update publisher name if needed"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Publisher Email"
                            type="email"
                            value={editFormData.publisherEmail || ''}
                            onChange={(e) => setEditFormData({...editFormData, publisherEmail: e.target.value})}
                            helperText="Editable - update publisher email if needed"
                          />
                        </Grid>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Contact fields - only visible when publisher is NOT matched */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Contact Name"
                        value={editFormData.contactName || ''}
                        onChange={(e) => setEditFormData({...editFormData, contactName: e.target.value})}
                        placeholder="Enter contact person name"
                        helperText="Name of the contact person for this site"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Contact Email"
                        type="email"
                        value={editFormData.contactEmail || ''}
                        onChange={(e) => setEditFormData({...editFormData, contactEmail: e.target.value})}
                        placeholder="contact@example.com"
                        helperText="Email of the contact person for this site"
                      />
                    </Grid>
                    
                    {/* Mark as Publisher button - when contact info exists */}
                    {user?.role === 'SUPER_ADMIN' && (editFormData.contactName || editFormData.contactEmail) && (
                      <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
                          <Button
                            variant="contained"
                            color="info"
                            onClick={() => {
                              if (selectedRecord) {
                                setCreatePublisherRecord({
                                  ...selectedRecord,
                                  contactName: editFormData.contactName,
                                  contactEmail: editFormData.contactEmail
                                });
                                setShowCreatePublisherDialog(true);
                              }
                            }}
                            sx={{ mb: 1 }}
                          >
                            Mark as Publisher
                          </Button>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            This will save the contact info as publisher details. When you push this record to the LM Tool:
                          </Typography>
                          <Typography variant="body2" color="text.secondary" component="ul" sx={{ mt: 0.5, pl: 2 }}>
                            <li>If a publisher with this email already exists in LM Tool, it will be linked automatically</li>
                            <li>If not, a new publisher will be created in the LM Tool</li>
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </>
                )}
                {/* First row - DA, DR, Traffic */}
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="DA"
                    type="number"
                    value={editFormData.da}
                    onChange={(e) => setEditFormData({...editFormData, da: e.target.value})}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="DR"
                    type="number"
                    value={editFormData.dr}
                    onChange={(e) => setEditFormData({...editFormData, dr: e.target.value})}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Traffic"
                    type="number"
                    value={editFormData.traffic}
                    onChange={(e) => setEditFormData({...editFormData, traffic: e.target.value})}
                  />
                </Grid>
                {/* Second row - SS, Keywords */}
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="SS"
                    type="number"
                    value={editFormData.ss}
                    onChange={(e) => setEditFormData({...editFormData, ss: e.target.value})}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Keywords"
                    type="number"
                    value={editFormData.keywords}
                    onChange={(e) => setEditFormData({...editFormData, keywords: e.target.value})}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={editFormData.category}
                      label="Category"
                      onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                    >
                      <MenuItem value="">
                        <em>Select Category</em>
                      </MenuItem>
                      {CATEGORIES.map((cat) => (
                        <MenuItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={COUNTRIES}
                    getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
                    value={COUNTRIES.find(c => c.value === editFormData.country) || null}
                    onChange={(_, newValue) => setEditFormData({...editFormData, country: newValue?.value || ''})}
                    isOptionEqualToValue={(option, value) => option.value === value?.value}
                    renderInput={(params) => (
                      <TextField {...params} label="Country" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={editFormData.language}
                      label="Language"
                      onChange={(e) => setEditFormData({...editFormData, language: e.target.value})}
                    >
                      <MenuItem value="">
                        <em>Select Language</em>
                      </MenuItem>
                      {LANGUAGES.map((lang) => (
                        <MenuItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="TAT"
                    value={editFormData.tat}
                    onChange={(e) => setEditFormData({...editFormData, tat: e.target.value})}
                    placeholder="e.g., 1-2 days"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="GB Base Price"
                    type="number"
                    value={editFormData.gbBasePrice}
                    onChange={(e) => setEditFormData({...editFormData, gbBasePrice: e.target.value})}
                    InputProps={{ startAdornment: '$' }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="LI Base Price"
                    type="number"
                    value={editFormData.liBasePrice}
                    onChange={(e) => setEditFormData({...editFormData, liBasePrice: e.target.value})}
                    InputProps={{ startAdornment: '$' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editFormData.status}
                      label="Status"
                      onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    >
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="INACTIVE">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Negotiation Status</InputLabel>
                    <Select
                      value={editFormData.negotiationStatus}
                      label="Negotiation Status"
                      onChange={(e) => setEditFormData({...editFormData, negotiationStatus: e.target.value})}
                    >
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="DONE">Done</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained" 
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mark as Publisher Dialog */}
      <Dialog open={showCreatePublisherDialog} onClose={() => setShowCreatePublisherDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark as Publisher</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {createPublisherRecord && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                This will save the contact info as publisher details for this site.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Site URL"
                    value={createPublisherRecord.websiteUrl}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Publisher Name"
                    value={createPublisherRecord.contactName || ''}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Publisher Email"
                    value={createPublisherRecord.contactEmail || ''}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
              <Alert severity="success" sx={{ mt: 2 }}>
                <strong>When you push this record to the LM Tool:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>If a publisher with this email already exists, it will be linked automatically</li>
                  <li>If not, a new publisher will be created in the LM Tool</li>
                  <li>Other sites with the same email will also use this publisher</li>
                </ul>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreatePublisherDialog(false)} disabled={creatingPublisher}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreatePublisher} 
            variant="contained" 
            color="info"
            disabled={creatingPublisher}
            startIcon={creatingPublisher ? <CircularProgress size={16} /> : null}
          >
            {creatingPublisher ? 'Marking...' : 'Mark as Publisher'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export by Publisher Dialog */}
      <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Data by Publisher</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Export all records for a specific publisher as CSV file.
            </Alert>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Publisher</InputLabel>
              <Select
                value={selectedExportPublisher}
                label="Select Publisher"
                onChange={(e) => setSelectedExportPublisher(e.target.value)}
              >
                {exportPublishers.map((publisher) => (
                  <MenuItem key={publisher.email} value={publisher.email}>
                    <Box>
                      <Typography variant="body2">
                        {publisher.name} ({publisher.recordCount} records)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {publisher.email} {publisher.isMatched ? '• Matched Publisher' : '• Contact'}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {selectedExportPublisher && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <strong>Export will include:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>All website records for this publisher</li>
                  <li>Complete site details (DA, DR, Traffic, SS, etc.)</li>
                  <li>Pricing information and status</li>
                  <li>Push status and timestamps</li>
                </ul>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowExportDialog(false);
            setSelectedExportPublisher('');
          }} disabled={exporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExportByPublisher} 
            variant="contained" 
            color="info"
            disabled={exporting || !selectedExportPublisher}
            startIcon={exporting ? <CircularProgress size={16} /> : <span>📊</span>}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataFinal;
