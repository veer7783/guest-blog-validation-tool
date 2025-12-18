import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Tooltip,
  Autocomplete
} from '@mui/material';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

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

interface DataInProcess {
  id: string;
  websiteUrl: string;
  publisherEmail?: string;
  publisherName?: string;
  publisherId?: string;
  publisherMatched?: boolean;
  contactName?: string;
  contactEmail?: string;
  da?: number;
  dr?: number;
  traffic?: number;
  ss?: number;
  category?: string;
  country?: string;
  language?: string;
  tat?: string;
  price?: number;
  gbBasePrice?: number;
  liBasePrice?: number;
  status: string;
  createdAt: string;
  uploadTask?: {
    fileName: string;
    assignedTo: string;
    assignedToUser?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

// User type for filter dropdown
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const DataManagement: React.FC = () => {
  const [data, setData] = useState<DataInProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<DataInProcess | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Search and filter state
  const [searchText, setSearchText] = useState('');
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  
  // Publisher state
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loadingPublishers, setLoadingPublishers] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(null);
  const [creatingPublisher, setCreatingPublisher] = useState(false);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    publisherEmail: '',
    publisherName: '',
    publisherId: '',
    publisherMatched: false,
    contactName: '',
    contactEmail: '',
    da: '',
    dr: '',
    traffic: '',
    ss: '',
    gbBasePrice: '',
    liBasePrice: '',
    category: '',
    country: '',
    language: '',
    tat: '',
    status: ''
  });

  // Fetch publishers from main project
  const fetchPublishers = useCallback(async () => {
    setLoadingPublishers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/publishers', {
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

  // Fetch users for filter dropdown
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        // API returns { data: { users: [...], pagination: {...} } }
        const usersData = response.data.data;
        let usersList: User[] = [];
        if (usersData && Array.isArray(usersData.users)) {
          usersList = usersData.users;
        } else if (Array.isArray(usersData)) {
          usersList = usersData;
        }
        // Filter out SUPER_ADMIN users from the dropdown
        setUsers(usersList.filter((u: any) => u.role !== 'SUPER_ADMIN'));
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Get user role from localStorage or auth context
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
  }, []);

  useEffect(() => {
    fetchData();
    fetchPublishers();
    // Only fetch users for SUPER_ADMIN (for the filter dropdown)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'SUPER_ADMIN') {
      fetchUsers();
    }
  }, [fetchPublishers, fetchUsers]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/data-in-process', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Backend returns { data: { data: [...], pagination: {...} } }
        const result = response.data.data;
        setData(result.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'REACHED':
        return 'success';
      case 'NOT_REACHED':
        return 'error';
      case 'VERIFIED':
        return 'info';
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

  const handleView = (record: DataInProcess) => {
    setSelectedRecord(record);
    setShowViewDialog(true);
  };

  const handleEdit = (record: DataInProcess) => {
    setSelectedRecord(record);
    setEditFormData({
      publisherEmail: record.publisherEmail || '',
      publisherName: record.publisherName || '',
      publisherId: record.publisherId || '',
      publisherMatched: record.publisherMatched || false,
      contactName: record.contactName || '',
      contactEmail: record.contactEmail || '',
      da: record.da?.toString() || '',
      dr: record.dr?.toString() || '',
      traffic: record.traffic?.toString() || '',
      ss: record.ss?.toString() || '',
      gbBasePrice: (record.price || record.gbBasePrice)?.toString() || '',
      liBasePrice: record.liBasePrice?.toString() || '',
      category: record.category || '',
      country: record.country || '',
      language: record.language || '',
      tat: record.tat || '',
      status: record.status
    });
    // Find matching publisher from list (if publisher was matched)
    if (record.publisherMatched && record.publisherId) {
      const matchingPublisher = publishers.find(p => p.id === record.publisherId);
      setSelectedPublisher(matchingPublisher || null);
    } else {
      setSelectedPublisher(null);
    }
    setShowEditDialog(true);
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

  // Handle marking contact info as publisher
  const handleCreatePublisherFromEdit = async () => {
    if (!selectedRecord) return;
    
    const name = editFormData.contactName;
    const email = editFormData.contactEmail;
    
    if (!name && !email) {
      alert('Please enter contact name or email first');
      return;
    }
    
    setCreatingPublisher(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/publishers',
        {
          name: name || email?.split('@')[0] || 'Unknown',
          email: email,
          dataInProcessId: selectedRecord.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Update the form data with the new publisher info
        setEditFormData(prev => ({
          ...prev,
          publisherId: response.data.data.id,
          publisherName: response.data.data.publisherName,
          publisherEmail: response.data.data.email || '',
          publisherMatched: true
        }));
        
        // Update the record in the list
        setData(data.map(item => 
          item.id === selectedRecord.id 
            ? { 
                ...item, 
                publisherId: response.data.data.id,
                publisherName: response.data.data.publisherName,
                publisherEmail: response.data.data.email,
                publisherMatched: true
              }
            : item
        ));
        
        alert(`Marked as Publisher: "${response.data.data.publisherName}"\n\nWhen you push this record to the LM Tool, the publisher will be created or linked automatically.`);
        fetchPublishers(); // Refresh publishers list
      }
    } catch (err: any) {
      console.error('Error marking as publisher:', err);
      alert(err.response?.data?.error || 'Failed to mark as publisher');
    } finally {
      setCreatingPublisher(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/data-in-process/${id}`, {
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

    // Validate DR and Traffic are required
    if (!editFormData.dr || !editFormData.traffic) {
      alert('DR and Traffic fields are required before saving.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Prepare update data
      const updateData: any = {
        publisherEmail: editFormData.publisherEmail,
        publisherName: editFormData.publisherName,
        publisherId: editFormData.publisherId || undefined,
        publisherMatched: editFormData.publisherMatched,
        contactName: editFormData.contactName || undefined,
        contactEmail: editFormData.contactEmail || undefined,
        da: editFormData.da ? parseInt(editFormData.da) : undefined,
        dr: editFormData.dr ? parseInt(editFormData.dr) : undefined,
        traffic: editFormData.traffic ? parseInt(editFormData.traffic) : undefined,
        ss: editFormData.ss ? parseInt(editFormData.ss) : undefined,
        price: editFormData.gbBasePrice ? parseFloat(editFormData.gbBasePrice) : undefined,
        gbBasePrice: editFormData.gbBasePrice ? parseFloat(editFormData.gbBasePrice) : undefined,
        liBasePrice: editFormData.liBasePrice ? parseFloat(editFormData.liBasePrice) : undefined,
        category: editFormData.category,
        country: editFormData.country,
        language: editFormData.language,
        tat: editFormData.tat,
        status: editFormData.status
      };

      const response = await axios.put(
        `http://localhost:5000/api/data-in-process/${selectedRecord.id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // If status changed to REACHED, remove from list (moved to Data Final)
        if (editFormData.status === 'REACHED') {
          setData(data.filter(item => item.id !== selectedRecord.id));
          alert('Record marked as Reached and moved to Data Final!');
        } else {
          // Update the record in the list
          setData(data.map(item => 
            item.id === selectedRecord.id 
              ? { ...item, ...updateData }
              : item
          ));
          alert('Record updated successfully');
        }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '🕓';
      case 'REACHED':
        return '🟢';
      case 'NOT_REACHED':
        return '🔴';
      case 'NO_ACTION_NEEDED':
        return '⚪';
      default:
        return '🕓';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'REACHED':
        return 'Reached';
      case 'NOT_REACHED':
        return 'Not Reached';
      case 'NO_ACTION_NEEDED':
        return 'No Action Needed';
      default:
        return status;
    }
  };

  // Filter data based on search text and assigned user
  const filteredData = data.filter((row) => {
    // Search filter - check website URL
    const matchesSearch = searchText === '' || 
      row.websiteUrl.toLowerCase().includes(searchText.toLowerCase());
    
    // Assigned user filter
    const matchesAssignedTo = filterAssignedTo === '' || 
      row.uploadTask?.assignedTo === filterAssignedTo;
    
    return matchesSearch && matchesAssignedTo;
  });

  // Paginated data
  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
        Data Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View and manage guest blog website data in process
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* Search and Filter Section */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by site URL..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}>🔍</Box>
                ),
              }}
            />
            
            {userRole === 'SUPER_ADMIN' && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Assigned User</InputLabel>
                <Select
                  value={filterAssignedTo}
                  label="Filter by Assigned User"
                  onChange={(e) => setFilterAssignedTo(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Users</em>
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {(searchText || filterAssignedTo) && (
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setSearchText('');
                  setFilterAssignedTo('');
                }}
              >
                Clear Filters
              </Button>
            )}
            
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              Showing {Math.min(rowsPerPage, filteredData.length)} of {filteredData.length} records
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : data.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                No data available. Upload a CSV file to get started.
              </Typography>
            </Box>
          ) : filteredData.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                No records match your search criteria.
              </Typography>
              <Button 
                variant="text" 
                onClick={() => { setSearchText(''); setFilterAssignedTo(''); }}
                sx={{ mt: 1 }}
              >
                Clear Filters
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell align="center" sx={{ width: 50 }}><strong>Edit</strong></TableCell>
                    <TableCell><strong>Site URL</strong></TableCell>
                    {userRole === 'SUPER_ADMIN' && <TableCell><strong>Publisher</strong></TableCell>}
                    {userRole === 'SUPER_ADMIN' && <TableCell><strong>Publisher Email</strong></TableCell>}
                    <TableCell><strong>Contact Name</strong></TableCell>
                    <TableCell><strong>Contact Email</strong></TableCell>
                    <TableCell><strong>DA</strong></TableCell>
                    <TableCell><strong>DR</strong></TableCell>
                    <TableCell><strong>Traffic</strong></TableCell>
                    <TableCell><strong>SS</strong></TableCell>
                    {userRole === 'SUPER_ADMIN' && <TableCell><strong>GB Base Price</strong></TableCell>}
                    {userRole === 'SUPER_ADMIN' && <TableCell><strong>LI Base Price</strong></TableCell>}
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Country</strong></TableCell>
                    <TableCell><strong>Language</strong></TableCell>
                    <TableCell><strong>TAT</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Last Modified By</strong></TableCell>
                    {userRole === 'SUPER_ADMIN' && <TableCell><strong>Assigned To</strong></TableCell>}
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row) => (
                    <TableRow key={row.id} hover>
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
                      {userRole === 'SUPER_ADMIN' && (
                        <TableCell>
                          {row.publisherMatched ? (
                            <Box>
                              <Typography variant="body2">{row.publisherName}</Typography>
                              <Typography variant="caption" color="success.main">✓ Matched</Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">Not matched</Typography>
                          )}
                        </TableCell>
                      )}
                      {userRole === 'SUPER_ADMIN' && (
                        <TableCell>
                          {row.publisherMatched ? (
                            row.publisherEmail || <Typography variant="caption" color="text.secondary">-</Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {row.publisherMatched ? (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        ) : (
                          row.contactName || <Typography variant="caption" color="text.secondary">Not set</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.publisherMatched ? (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        ) : (
                          row.contactEmail || <Typography variant="caption" color="text.secondary">Not set</Typography>
                        )}
                      </TableCell>
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
                      {userRole === 'SUPER_ADMIN' && (
                        <TableCell>
                          {row.price || row.gbBasePrice ? `$${row.price || row.gbBasePrice}` : <Typography variant="caption" color="text.secondary">-</Typography>}
                        </TableCell>
                      )}
                      {userRole === 'SUPER_ADMIN' && (
                        <TableCell>
                          {row.liBasePrice ? `$${row.liBasePrice}` : <Typography variant="caption" color="text.secondary">-</Typography>}
                        </TableCell>
                      )}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{getStatusIcon(row.status)}</span>
                          <Chip 
                            label={getStatusLabel(row.status)} 
                            color={getStatusColor(row.status) as any}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {(row as any).lastModifiedByName || 'Not modified'}
                        </Typography>
                      </TableCell>
                      {userRole === 'SUPER_ADMIN' && (
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {row.uploadTask?.assignedToUser 
                              ? `${row.uploadTask.assignedToUser.firstName} ${row.uploadTask.assignedToUser.lastName}`
                              : 'Not assigned'}
                          </Typography>
                        </TableCell>
                      )}
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
                        {userRole === 'SUPER_ADMIN' && (
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
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {/* Pagination - show when data exists */}
          {filteredData.length > 0 && (
            <TablePagination
              component="div"
              count={filteredData.length}
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
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Category"
                  value={selectedRecord.category || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
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
                  label="Country"
                  value={selectedRecord.country || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Status"
                  value={`${getStatusIcon(selectedRecord.status)} ${getStatusLabel(selectedRecord.status)}`}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Upload Source"
                  value={selectedRecord.uploadTask?.fileName || 'Unknown'}
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
                {/* Publisher info - only visible to Super Admin when matched */}
                {userRole === 'SUPER_ADMIN' && editFormData.publisherMatched && (
                  <>
                    <Grid item xs={12}>
                      <Alert severity="success" sx={{ mb: 1 }}>
                        Publisher matched from LM Tool: <strong>{editFormData.publisherName}</strong>
                      </Alert>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Publisher Name"
                        value={editFormData.publisherName}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Publisher Email"
                        value={editFormData.publisherEmail || ''}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  </>
                )}
                
                {/* Contact fields - only visible when publisher is NOT matched */}
                {!editFormData.publisherMatched && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Contact Name"
                        value={editFormData.contactName}
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
                        value={editFormData.contactEmail}
                        onChange={(e) => setEditFormData({...editFormData, contactEmail: e.target.value})}
                        placeholder="contact@example.com"
                        helperText="Email of the contact person for this site"
                      />
                    </Grid>
                    
                    {/* Mark as Publisher button - Super Admin only, when contact info exists */}
                    {userRole === 'SUPER_ADMIN' && (editFormData.contactName || editFormData.contactEmail) && (
                      <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
                          <Button
                            variant="contained"
                            color="info"
                            onClick={handleCreatePublisherFromEdit}
                            disabled={creatingPublisher}
                            startIcon={creatingPublisher ? <CircularProgress size={16} /> : null}
                            sx={{ mb: 1 }}
                          >
                            {creatingPublisher ? 'Marking...' : 'Mark as Publisher'}
                          </Button>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            This will save the contact info as publisher details. When you push this record to the LM Tool:
                          </Typography>
                          <Typography variant="body2" color="text.secondary" component="ul" sx={{ mt: 0.5, pl: 2 }}>
                            <li>If a publisher with this email already exists in LM Tool, it will be linked automatically</li>
                            <li>If not, a new publisher will be created in the LM Tool</li>
                            <li>Other sites with the same contact email will also use this publisher</li>
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </>
                )}
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="DA"
                    type="number"
                    value={editFormData.da}
                    onChange={(e) => setEditFormData({...editFormData, da: e.target.value})}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    required
                    label="DR"
                    type="number"
                    value={editFormData.dr}
                    onChange={(e) => setEditFormData({...editFormData, dr: e.target.value})}
                    inputProps={{ min: 0, max: 100 }}
                    error={!editFormData.dr}
                    helperText={!editFormData.dr ? 'Required' : ''}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    required
                    label="Traffic"
                    type="number"
                    value={editFormData.traffic}
                    onChange={(e) => setEditFormData({...editFormData, traffic: e.target.value})}
                    error={!editFormData.traffic}
                    helperText={!editFormData.traffic ? 'Required' : ''}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="SS"
                    type="number"
                    value={editFormData.ss}
                    onChange={(e) => setEditFormData({...editFormData, ss: e.target.value})}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                {userRole === 'SUPER_ADMIN' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="GB Base Price ($)"
                      type="number"
                      value={editFormData.gbBasePrice}
                      onChange={(e) => setEditFormData({...editFormData, gbBasePrice: e.target.value})}
                      inputProps={{ min: 0, step: 0.01 }}
                      placeholder="e.g., 50"
                    />
                  </Grid>
                )}
                {userRole === 'SUPER_ADMIN' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="LI Base Price ($)"
                      type="number"
                      value={editFormData.liBasePrice}
                      onChange={(e) => setEditFormData({...editFormData, liBasePrice: e.target.value})}
                      inputProps={{ min: 0, step: 0.01 }}
                      placeholder="e.g., 75"
                    />
                  </Grid>
                )}
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="TAT (Turnaround Time)"
                    value={editFormData.tat}
                    onChange={(e) => setEditFormData({...editFormData, tat: e.target.value})}
                    placeholder="e.g., 1-2 days"
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
                      <MenuItem value="PENDING">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>🕓</span> Pending
                        </Box>
                      </MenuItem>
                      <MenuItem value="REACHED">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>🟢</span> Reached
                        </Box>
                      </MenuItem>
                      <MenuItem value="NOT_REACHED">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>🔴</span> Not Reached
                        </Box>
                      </MenuItem>
                      <MenuItem value="NO_ACTION_NEEDED">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>⚪</span> No Action Needed
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {editFormData.status === 'REACHED' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Note:</strong> Marking as "Reached" will move this record to Data Final page.
                </Alert>
              )}
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
    </Box>
  );
};

export default DataManagement;
