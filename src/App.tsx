/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Home, 
  Users, 
  MessageSquareText, 
  Search, 
  Plus, 
  Share2, 
  Phone, 
  MessageCircle, 
  LogOut, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  MapPin, 
  DollarSign, 
  UserCheck, 
  FileText, 
  Download,
  Info,
  ChevronRight,
  Clock,
  Briefcase,
  Loader2,
  ShieldCheck,
  Check,
  X,
  Map as MapIcon,
  Menu,
  Sun,
  Moon,
  CheckSquare,
  Square,
  SlidersHorizontal,
  ArrowUpDown,
  Edit3,
  Calendar,
  RefreshCw,
  Calculator,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  Bell,
  Send,
  Camera,
  TrendingUp,
  Layers,
  Copy,
  Columns,
  BarChart3
} from 'lucide-react';
import L from 'leaflet';

// Fix Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Types matching TLC-2
interface InventoryItem {
  id: string;
  type: 'Commercial' | 'Residential';
  title: string;
  locationLine: string;
  priceBadge: string;
  transactionType: string;
  carpetSqft: string;
  builtUpSqft: string;
  chargeableSqft: string;
  subType: string;
  furnishing: string;
  possession: string;
  contactPerson: string;
  phone: string;
  notes: string;
  dateAdded: string;
  propertyType: string;
  status: string;
  rawPrice: number;
  rawArea: number;
  rawAnnualRent: number;
  ratePerSqft: string;
  yieldPercent: string;
  photoUrl?: string;
  parking: string;
  deposit: string;
  tenantPreference: string;
}

interface ProjectItem {
  id: string;
  name: string;
  type: 'Commercial' | 'Residential';
  location: string;
  developer: string;
  totalUnits: string;
  availableUnits: string;
  priceRange: string;
  status: string;
  notes: string;
}

interface CRMItem {
  id: string;
  clientName: string;
  phone: string;
  type: 'Requirement' | 'Follow-Up';
  requirementSummary: string;
  budget: string;
  preferredLocation: string;
  status: 'New' | 'In Progress' | 'Closed' | 'Site Visit';
  notes: string;
  date: string;
  nextFollowUp?: string;
}

interface TenantItem {
  id: string;
  tenantName: string;
  propertyTitle: string;
  rentAmount: string;
  leaseStart: string;
  leaseEnd: string;
  phone: string;
  status: string;
}

interface BrokerItem {
  id: string;
  name: string;
  company: string;
  phone: string;
  category: 'Commercial Broker' | 'Residential Broker' | 'Vendor';
  notes: string;
}

interface ReportItem {
  id: string;
  executiveName: string;
  callsMade: string;
  siteVisits: string;
  dealsClosed: string;
  date: string;
  notes: string;
}

interface CallLogItem {
  id: string;
  callerName: string;
  clientName: string;
  duration: string;
  timestamp: string;
  notes: string;
  outcome: string;
}

interface AllocationItem {
  id: string;
  propertyTitle: string;
  executiveName: string;
  assignedDate: string;
  status: string;
}

interface ApprovalItem {
  id: string;
  requestType: string;
  requestedBy: string;
  details: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
}

// Flexible value getter
function getVal(obj: any, ...keys: string[]): string {
  if (!obj || typeof obj !== 'object') return '';
  for (const k of keys) {
    const cleanK = String(k || '').trim().toLowerCase();
    for (const objKey of Object.keys(obj)) {
      const cleanObjKey = String(objKey || '').trim().toLowerCase();
      if (cleanObjKey === cleanK || cleanObjKey.includes(cleanK) || cleanK.includes(cleanObjKey)) {
        const val = obj[objKey];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return String(val).trim();
        }
      }
    }
  }
  return '';
}

// Strict value getter excluding unwanted keys
function getValExcluding(obj: any, excludeTerms: string[], ...keys: string[]): string {
  if (!obj || typeof obj !== 'object') return '';
  for (const k of keys) {
    const cleanK = String(k || '').trim().toLowerCase();
    for (const objKey of Object.keys(obj)) {
      const cleanObjKey = String(objKey || '').trim().toLowerCase();
      if (excludeTerms.some(term => cleanObjKey.includes(term))) {
        continue;
      }
      if (cleanObjKey === cleanK || cleanObjKey.includes(cleanK) || cleanK.includes(cleanObjKey)) {
        const val = obj[objKey];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return String(val).trim();
        }
      }
    }
  }
  return '';
}

function findTabMatrix(dataObj: any, ...keywords: string[]): any[][] {
  if (!dataObj || typeof dataObj !== 'object') return [];
  const keys = Object.keys(dataObj);
  for (const kw of keywords) {
    const cleanKw = String(kw || '').trim().toLowerCase();
    const match = keys.find(k => {
      const ck = String(k || '').trim().toLowerCase();
      return ck === cleanKw || ck.includes(cleanKw) || cleanKw.includes(ck);
    });
    if (match && Array.isArray(dataObj[match])) {
      return dataObj[match];
    }
  }
  return [];
}

function formatPrice(raw: string): string {
  if (!raw || raw.toLowerCase().includes('request') || raw.toLowerCase().includes('call')) {
    return 'On Request';
  }
  const trimmed = raw.trim();
  if (/[a-zA-Z]/.test(trimmed) && !trimmed.toLowerCase().includes('/mo')) {
    return trimmed.startsWith('₹') ? trimmed : `₹${trimmed}`;
  }
  const numStr = trimmed.replace(/,/g, '').replace(/[^\d.]/g, '');
  const num = parseFloat(numStr);
  if (!isNaN(num) && num > 0) {
    const formatted = num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    const lower = trimmed.toLowerCase();
    let suffix = '';
    if (lower.includes('/mo') || lower.includes('month') || lower.includes('pm')) suffix = '/mo';
    return `₹${formatted}${suffix}`;
  }
  return trimmed.startsWith('₹') ? trimmed : `₹${trimmed}`;
}

function parseMatrixToObjects(matrix: any[][], itemType: string): any[] {
  if (!Array.isArray(matrix) || matrix.length < 2) return [];
  const headers = matrix[0].map((h: any) => String(h || '').trim().toLowerCase());
  const rows = matrix.slice(1);

  return rows.map((row: any[], idx: number) => {
    if (!row || row.every(cell => cell === undefined || cell === null || String(cell).trim() === '')) {
      return null;
    }
    const obj: any = {};
    headers.forEach((h: string, colIdx: number) => {
      obj[h] = row[colIdx] !== undefined && row[colIdx] !== null ? row[colIdx] : '';
    });

    if (itemType === 'Commercial' || itemType === 'Residential') {
      return mapObjectToItem(obj, itemType as any, idx);
    } else if (itemType === 'Project') {
      return mapObjectToProject(obj, idx);
    } else if (itemType === 'CRM') {
      return mapObjectToCRM(obj, idx);
    } else if (itemType === 'Tenant') {
      return mapObjectToTenant(obj, idx);
    } else if (itemType === 'Broker') {
      return mapObjectToBroker(obj, idx);
    } else if (itemType === 'Report') {
      return mapObjectToReport(obj, idx);
    } else if (itemType === 'CallLog') {
      return mapObjectToCallLog(obj, idx);
    } else if (itemType === 'Allocation') {
      return mapObjectToAllocation(obj, idx);
    } else if (itemType === 'Approval') {
      return mapObjectToApproval(obj, idx);
    }
    return obj;
  }).filter((x): x is any => x !== null);
}

function mapObjectToItem(obj: any, itemType: 'Commercial' | 'Residential', idx: number): InventoryItem {
  const projectBuilding = getVal(obj, 'project / building', 'project/building', 'project', 'building', 'project name', 'title');
  const propType = getVal(obj, 'property type', 'type', 'asset type', 'category');
  const location = getVal(obj, 'location', 'city', 'area');
  const propId = getVal(obj, 'property id', 'id', 'sr no');

  const title = projectBuilding || (propType && location ? `${propType} in ${location}` : '') || propId || `Property #${idx + 1}`;

  const microMarket = getVal(obj, 'micro market', 'micromarket', 'sub-location', 'locality');
  const unitNo = getVal(obj, 'unit no', 'unit', 'unit number', 'flat no');
  const floor = getVal(obj, 'floor', 'floor no');

  const locationParts = [location, microMarket].filter(Boolean);
  let locationLine = locationParts.join(' • ') || 'Pune / Mumbai';
  if (unitNo || floor) {
    const extra = [unitNo ? `Unit: ${unitNo}` : '', floor ? `Floor: ${floor}` : ''].filter(Boolean).join(', ');
    locationLine += ` (${extra})`;
  }

  const salePriceStr = getVal(obj, 'sale price', 'price', 'asking price', 'amount');
  const rentStr = getVal(obj, 'rent', 'monthly rent', 'asking rent', 'lease rent', 'rental');
  const transType = getVal(obj, 'transaction type', 'deal type', 'type') || (salePriceStr ? 'Sale' : 'Lease');

  const cleanPrice = parseFloat(salePriceStr.replace(/,/g, '').replace(/[^\d.]/g, '')) || 0;
  const cleanRent = parseFloat(rentStr.replace(/,/g, '').replace(/[^\d.]/g, '')) || 0;
  const annualRent = cleanRent * 12;

  const rawPrice = salePriceStr || rentStr;
  const priceBadge = rawPrice ? formatPrice(rawPrice) : 'On Request';

  const carpet = getVal(obj, 'carpet sqft', 'carpet sq.ft', 'carpet area', 'carpet');
  const builtUp = getVal(obj, 'built-up sqft', 'built up sqft', 'builtup sqft', 'built-up area', 'builtup');
  const chargeable = getVal(obj, 'chargeable sqft', 'chargeable area', 'super built-up');

  const cleanCarpet = parseFloat(carpet.replace(/,/g, '').replace(/[^\d.]/g, '')) || 0;
  const cleanBuiltUp = parseFloat(builtUp.replace(/,/g, '').replace(/[^\d.]/g, '')) || 0;
  const cleanChargeable = parseFloat(chargeable.replace(/,/g, '').replace(/[^\d.]/g, '')) || 0;
  const subType = getVal(obj, 'sub type', 'subtype', 'configuration', 'bhk', 'config');

  // Auto Rate per Sq.Ft on Built-up Area (or Estimated Built-up from Carpet loading)
  let ratePerSqft = '';
  let effectiveBuiltUp = cleanBuiltUp;
  const activeValForRate = cleanPrice || cleanRent;

  if (activeValForRate > 0) {
    if (cleanBuiltUp > 0) {
      const perSqft = Math.round(activeValForRate / cleanBuiltUp);
      ratePerSqft = `₹${perSqft.toLocaleString('en-IN')}/sq.ft (Built-up)`;
    } else if (cleanCarpet > 0) {
      const isShop = (propType || subType || '').toLowerCase().includes('shop') || (propType || '').toLowerCase().includes('showroom');
      const loadingFactor = isShop ? 1.50 : 1.45;
      const loadingPercent = isShop ? '50%' : '45%';
      effectiveBuiltUp = Math.round(cleanCarpet * loadingFactor);
      const perSqft = Math.round(activeValForRate / effectiveBuiltUp);
      ratePerSqft = `₹${perSqft.toLocaleString('en-IN')}/sq.ft (Est. Built-up @ ${loadingPercent} loading)`;
    } else if (cleanChargeable > 0) {
      const perSqft = Math.round(activeValForRate / cleanChargeable);
      ratePerSqft = `₹${perSqft.toLocaleString('en-IN')}/sq.ft (Chargeable)`;
    }
  }

  const rawArea = effectiveBuiltUp || cleanBuiltUp || cleanCarpet || cleanChargeable || 0;

  // Auto Gross Yield % ((Annual Rent / Sale Price) * 100)
  let yieldPercent = '';
  if (cleanPrice > 0 && cleanRent > 0) {
    const y = ((annualRent / cleanPrice) * 100).toFixed(2);
    yieldPercent = `${y}% Yield`;
  }

  const furnishing = getVal(obj, 'furnishing', 'furnish status', 'status (ff/sf/uf)');
  const possession = getVal(obj, 'possession', 'availability');
  const status = getVal(obj, 'status', 'availability status') || 'Available';

  const contactPerson = getValExcluding(obj, ['source', 'file', 'filename', 'excel'], 'owner name', 'contact person', 'broker name', 'owner', 'contact', 'name') || '';
  const phone = getValExcluding(obj, ['source', 'file', 'filename', 'excel'], 'owner mobile', 'contact number', 'broker mobile', 'source mobile', 'mobile', 'phone', 'cell', 'number') || '';

  const notes = getVal(obj, 'notes', 'remarks', 'details', 'description', 'comments');
  const dateAdded = getVal(obj, 'date', 'date added', 'timestamp') || new Date().toISOString().split('T')[0];
  const photoUrl = getVal(obj, 'photo url', 'photo', 'image', 'picture', 'url') || '';
  const parking = getVal(obj, 'parking', 'car park', 'parking slots') || '1 Covered';
  const deposit = getVal(obj, 'deposit', 'security deposit', 'advance rent', 'deposit amount') || '3 Months';
  const tenantPreference = getVal(obj, 'tenant preference', 'preference', 'tenant type', 'suitable for') || 'Corporate / MNC';

  const shortPropType = propType && propType.length < 25 ? propType : (itemType === 'Commercial' ? 'Commercial' : 'Residential');

  return {
    id: propId || `inv-${idx}-${Date.now()}`,
    type: itemType,
    title,
    locationLine,
    priceBadge,
    transactionType: transType,
    carpetSqft: carpet,
    builtUpSqft: builtUp,
    chargeableSqft: chargeable,
    subType,
    furnishing,
    possession,
    contactPerson,
    phone,
    notes,
    dateAdded,
    propertyType: shortPropType,
    status,
    rawPrice: cleanPrice,
    rawArea,
    rawAnnualRent: annualRent,
    ratePerSqft,
    yieldPercent,
    photoUrl,
    parking,
    deposit,
    tenantPreference
  };
}

function mapObjectToProject(obj: any, idx: number): ProjectItem {
  const typeStr = String(getVal(obj, 'type', 'category') || '').toLowerCase();
  return {
    id: getVal(obj, 'id', 'sr no') || `proj-${idx}-${Date.now()}`,
    name: getVal(obj, 'name', 'project name', 'building') || 'Project Name',
    type: typeStr.includes('residential') ? 'Residential' : 'Commercial',
    location: getVal(obj, 'location', 'area') || 'Pune',
    developer: getVal(obj, 'developer', 'builder', 'client') || 'Developer',
    totalUnits: getVal(obj, 'total units', 'units') || '50',
    availableUnits: getVal(obj, 'available units', 'available') || '10',
    priceRange: formatPrice(getVal(obj, 'price range', 'budget', 'price') || 'On Request'),
    status: getVal(obj, 'status') || 'Active',
    notes: getVal(obj, 'notes', 'remarks') || ''
  };
}

function mapObjectToCRM(obj: any, idx: number): CRMItem {
  const typeStr = String(getVal(obj, 'type', 'lead type', 'category') || '').toLowerCase();
  const statusStr = String(getVal(obj, 'status', 'stage') || 'New');
  return {
    id: getVal(obj, 'id', 'lead id', 'sr no') || `crm-${idx}-${Date.now()}`,
    clientName: getVal(obj, 'client name', 'name', 'client', 'company') || 'Unnamed Client',
    phone: getVal(obj, 'phone', 'mobile', 'contact', 'number') || '',
    type: (typeStr.includes('follow') ? 'Follow-Up' : 'Requirement'),
    requirementSummary: getVal(obj, 'requirement', 'requirement summary', 'summary', 'details') || 'General Inquiry',
    budget: formatPrice(getVal(obj, 'budget', 'price') || 'Flexible'),
    preferredLocation: getVal(obj, 'preferred location', 'location', 'preferred area') || 'Any',
    status: (statusStr || 'New') as any,
    notes: getVal(obj, 'notes', 'remarks') || '',
    date: getVal(obj, 'date', 'timestamp') || new Date().toISOString().split('T')[0],
    nextFollowUp: getVal(obj, 'next follow-up', 'followup', 'next date') || ''
  };
}

function mapObjectToTenant(obj: any, idx: number): TenantItem {
  return {
    id: getVal(obj, 'id', 'sr no') || `ten-${idx}-${Date.now()}`,
    tenantName: getVal(obj, 'tenant name', 'name', 'client') || 'Tenant Name',
    propertyTitle: getVal(obj, 'property title', 'property', 'building') || 'Property',
    rentAmount: formatPrice(getVal(obj, 'rent amount', 'rent', 'amount') || '0'),
    leaseStart: getVal(obj, 'lease start', 'start date', 'from') || '2026-01-01',
    leaseEnd: getVal(obj, 'lease end', 'end date', 'to') || '2027-01-01',
    phone: getVal(obj, 'phone', 'mobile', 'contact') || '',
    status: getVal(obj, 'status') || 'Active'
  };
}

function mapObjectToBroker(obj: any, idx: number): BrokerItem {
  const catStr = String(getVal(obj, 'category', 'type', 'role') || '').toLowerCase();
  return {
    id: getVal(obj, 'id', 'sr no', 'broker id') || `br-${idx}-${Date.now()}`,
    name: getVal(obj, 'name', 'broker name', 'vendor name', 'contact person') || 'Broker Name',
    company: getVal(obj, 'company', 'agency', 'firm', 'business') || '',
    phone: getVal(obj, 'phone', 'mobile', 'contact', 'number') || '',
    category: (catStr.includes('residential') ? 'Residential Broker' :
               catStr.includes('vendor') ? 'Vendor' : 'Commercial Broker'),
    notes: getVal(obj, 'notes', 'specialization', 'remarks') || ''
  };
}

function mapObjectToReport(obj: any, idx: number): ReportItem {
  return {
    id: getVal(obj, 'id', 'sr no') || `rep-${idx}-${Date.now()}`,
    executiveName: getVal(obj, 'executive name', 'executive', 'name') || 'Executive',
    callsMade: getVal(obj, 'calls made', 'calls') || '0',
    siteVisits: getVal(obj, 'site visits', 'visits') || '0',
    dealsClosed: getVal(obj, 'deals closed', 'deals') || '0',
    date: getVal(obj, 'date', 'timestamp') || new Date().toISOString().split('T')[0],
    notes: getVal(obj, 'notes', 'summary') || ''
  };
}

function mapObjectToCallLog(obj: any, idx: number): CallLogItem {
  return {
    id: getVal(obj, 'id', 'sr no') || `call-${idx}-${Date.now()}`,
    callerName: getVal(obj, 'caller name', 'executive', 'name') || 'Executive',
    clientName: getVal(obj, 'client name', 'client') || 'Client',
    duration: getVal(obj, 'duration', 'time') || '5 mins',
    timestamp: getVal(obj, 'timestamp', 'date') || new Date().toISOString().split('T')[0],
    notes: getVal(obj, 'notes', 'remarks') || '',
    outcome: getVal(obj, 'outcome', 'status') || 'Connected'
  };
}

function mapObjectToAllocation(obj: any, idx: number): AllocationItem {
  return {
    id: getVal(obj, 'id', 'sr no') || `alloc-${idx}-${Date.now()}`,
    propertyTitle: getVal(obj, 'property title', 'property') || 'Property',
    executiveName: getVal(obj, 'executive name', 'executive') || 'Executive',
    assignedDate: getVal(obj, 'assigned date', 'date') || new Date().toISOString().split('T')[0],
    status: getVal(obj, 'status') || 'Allocated'
  };
}

function mapObjectToApproval(obj: any, idx: number): ApprovalItem {
  return {
    id: getVal(obj, 'id', 'sr no') || `appr-${idx}-${Date.now()}`,
    requestType: getVal(obj, 'request type', 'type') || 'Discount Approval',
    requestedBy: getVal(obj, 'requested by', 'executive') || 'Executive',
    details: getVal(obj, 'details', 'description') || 'Request details...',
    status: (getVal(obj, 'status') || 'Pending') as any,
    date: getVal(obj, 'date') || new Date().toISOString().split('T')[0]
  };
}

// Leaflet Map Component
function PropertyMap({ items }: { items: InventoryItem[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([18.5204, 73.8567], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    items.forEach((item, idx) => {
      const lat = 18.52 + (idx * 0.015) % 0.12;
      const lng = 73.85 + (idx * 0.02) % 0.12;
      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(`
        <div style="font-family:sans-serif; font-size:12px; line-height:1.4;">
          <strong style="font-size:13px; color:#E96932;">${item.title}</strong><br/>
          📍 ${item.locationLine}<br/>
          💰 <b>${item.priceBadge}</b><br/>
          ${item.contactPerson ? `📞 ${item.contactPerson} ${item.phone ? `(${item.phone})` : ''}` : ''}
        </div>
      `);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [items]);

  return <div ref={mapRef} className="w-full h-[500px] rounded-3xl shadow-md border border-gray-200 z-10" />;
}

export default function App() {
  // Phase 3 States
  const [isClientCatalogView, setIsClientCatalogView] = useState(false);
  const [catalogIds, setCatalogIds] = useState<string[]>([]);
  const [catalogRef, setCatalogRef] = useState<string>('');
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showScheduleVisitModal, setShowScheduleVisitModal] = useState(false);
  const [visitTargetTitle, setVisitTargetTitle] = useState('');
  const [visitClientName, setVisitClientName] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitTime, setVisitTime] = useState('11:00 AM');
  const [visitNotes, setVisitNotes] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('client') === '1') {
      setIsClientCatalogView(true);
      const ids = params.get('ids') ? params.get('ids')!.split(',') : [];
      setCatalogIds(ids);
      setCatalogRef(params.get('ref') || 'EMP-001');
    }
  }, []);

  // Auth state
  const [user, setUser] = useState<{ loginId: string; name: string; role: string } | null>(() => {
    const saved = localStorage.getItem('tlc_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dark Mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('tlc_dark') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('tlc_dark', String(darkMode));
  }, [darkMode]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [inventoryType, setInventoryType] = useState<'Commercial' | 'Residential'>('Commercial');
  const [projectType, setProjectType] = useState<'Commercial' | 'Residential'>('Commercial');
  const [managementSubTab, setManagementSubTab] = useState<'tenants' | 'reports' | 'calls' | 'allocation' | 'approvals'>('tenants');

  // More Menu Drawer state
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Real Data states (with LocalStorage Instant Cache)
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>(() => {
    const cached = localStorage.getItem('tlc_cache_inv');
    return cached ? JSON.parse(cached) : [];
  });
  const [projectsList, setProjectsList] = useState<ProjectItem[]>(() => {
    const cached = localStorage.getItem('tlc_cache_proj');
    return cached ? JSON.parse(cached) : [];
  });
  const [crmList, setCrmList] = useState<CRMItem[]>(() => {
    const cached = localStorage.getItem('tlc_cache_crm');
    return cached ? JSON.parse(cached) : [];
  });
  const [tenantsList, setTenantsList] = useState<TenantItem[]>(() => {
    const cached = localStorage.getItem('tlc_cache_ten');
    return cached ? JSON.parse(cached) : [];
  });
  const [brokersList, setBrokersList] = useState<BrokerItem[]>(() => {
    const cached = localStorage.getItem('tlc_cache_bro');
    return cached ? JSON.parse(cached) : [];
  });
  const [dailyReportsList, setDailyReportsList] = useState<ReportItem[]>([]);
  const [callLogsList, setCallLogsList] = useState<CallLogItem[]>([]);
  const [allocationHistoryList, setAllocationHistoryList] = useState<AllocationItem[]>([]);
  const [approvalRequestsList, setApprovalRequestsList] = useState<ApprovalItem[]>([]);

  const [lastSynced, setLastSynced] = useState<string>(() => {
    return localStorage.getItem('tlc_last_sync') || 'Never';
  });

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [responseAlert, setResponseAlert] = useState<string | null>(null);

  // Search & Advanced Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filterLocation, setFilterLocation] = useState<string>('All');
  const [filterTransType, setFilterTransType] = useState<string>('All');
  const [filterPropType, setFilterPropType] = useState<string>('All');
  const [filterFurnishing, setFilterFurnishing] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'Newest' | 'PriceLowToHigh' | 'PriceHighToLow' | 'AreaHighToLow'>('Newest');
  const [activePreset, setActivePreset] = useState<string>('All');
  const [inventoryDisplayLimit, setInventoryDisplayLimit] = useState(25);
  const hasSpeechSupport = typeof window !== 'undefined' && (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));
  const [savedPresets, setSavedPresets] = useState<Array<{ name: string; filterLocation: string; filterTransType: string; filterPropType: string; filterFurnishing: string; filterStatus: string }>>(() => {
    try {
      const saved = localStorage.getItem('tlc_saved_presets');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Multi-select Shortlist Mode
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Smart Matcher Modal state
  const [activeLeadForMatch, setActiveLeadForMatch] = useState<CRMItem | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  // Quick Call Log / Visit Modal
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const [callLogLead, setCallLogLead] = useState<CRMItem | null>(null);
  const [callOutcome, setCallOutcome] = useState('Connected');
  const [callNotes, setCallNotes] = useState('');

  // ROI & EMI Calculator Modal state
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [calcPrincipal, setCalcPrincipal] = useState('10000000');
  const [calcInterest, setCalcInterest] = useState('8.5');
  const [calcTenureYears, setCalcTenureYears] = useState('20');

  // Client-Safe PDF Flyer Modal state
  const [activeFlyerItem, setActiveFlyerItem] = useState<InventoryItem | null>(null);
  const [showFlyerModal, setShowFlyerModal] = useState(false);

  // Duplicate Warning Modal state
  const [duplicateWarning, setDuplicateWarning] = useState<{ existing: InventoryItem; newTitle: string } | null>(null);

  // Today's Follow-ups Quick Filter
  const [onlyTodayFollowUps, setOnlyTodayFollowUps] = useState(false);

  // WA Parser state
  const [rawWAMessage, setRawWAMessage] = useState('');
  const [isParsingWA, setIsParsingWA] = useState(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [parseSuccessMsg, setParseSuccessMsg] = useState('');

  // Phase 4 States
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [newPhotoBase64, setNewPhotoBase64] = useState('');
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [activeDealFinancialsItem, setActiveDealFinancialsItem] = useState<InventoryItem | null>(null);
  const [showDealFinancialsModal, setShowDealFinancialsModal] = useState(false);

  const getBenchmarkBadge = (item: InventoryItem) => {
    const market = item.locationLine.split('•')[0].trim().toLowerCase();
    const type = item.propertyType.toLowerCase();
    const rateMatch = item.ratePerSqft.match(/[\d,]+/);
    if (!rateMatch) return { label: 'Market Rate', color: 'bg-gray-100 text-gray-700' };
    const itemRate = parseFloat(rateMatch[0].replace(/,/g, '')) || 0;
    if (itemRate <= 0) return { label: 'Market Rate', color: 'bg-gray-100 text-gray-700' };

    const peerRates = inventoryList
      .filter(i => i.locationLine.toLowerCase().includes(market) && i.propertyType.toLowerCase() === type)
      .map(i => {
        const m = i.ratePerSqft.match(/[\d,]+/);
        return m ? parseFloat(m[0].replace(/,/g, '')) || 0 : 0;
      })
      .filter(r => r > 0);

    if (peerRates.length < 2) return { label: 'Market Rate', color: 'bg-gray-100 text-gray-700' };

    const avgRate = peerRates.reduce((a, b) => a + b, 0) / peerRates.length;

    if (itemRate < avgRate * 0.9) {
      return { label: 'Below Avg', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    } else if (itemRate > avgRate * 1.15) {
      return { label: 'Premium', color: 'bg-amber-50 text-amber-700 border border-amber-200' };
    }
    return { label: 'Market Rate', color: 'bg-gray-100 text-gray-700 border border-gray-200' };
  };

  const handleUpdateDealStage = async (crmItem: CRMItem, newStage: string) => {
    const updated = { ...crmItem, status: newStage as any };
    try {
      await fetch(`/api/gas?tabName=CRM`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPSERT', tabName: 'CRM', data: updated })
      });
      setCrmList(crmList.map(c => c.id === crmItem.id ? updated : c));
      showToast(`Deal stage updated to ${newStage}`);
    } catch (e) {
      console.error(e);
      showToast('Failed to update deal stage');
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhotoBase64(String(reader.result));
        showToast('Photo attached successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Modals
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [showAddCRMModal, setShowAddCRMModal] = useState(false);
  const [showAddBrokerModal, setShowAddBrokerModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);

  // New Item Forms
  const [newInv, setNewInv] = useState({
    type: 'Commercial' as 'Commercial' | 'Residential',
    title: '',
    location: '',
    propertyType: 'Office Space',
    bhkOrConfig: '',
    furnishing: 'Fully-Furnished',
    budgetOrPrice: '',
    contactPerson: '',
    phone: '',
    notes: ''
  });

  const [newProject, setNewProject] = useState({
    name: '',
    type: 'Commercial' as 'Commercial' | 'Residential',
    location: '',
    developer: '',
    totalUnits: '',
    availableUnits: '',
    priceRange: '',
    status: 'Active',
    notes: ''
  });

  const [newCrm, setNewCrm] = useState({
    clientName: '',
    phone: '',
    type: 'Requirement' as 'Requirement' | 'Follow-Up',
    requirementSummary: '',
    budget: '',
    preferredLocation: '',
    status: 'New' as const,
    notes: '',
    nextFollowUp: new Date().toISOString().split('T')[0]
  });

  const [newTenant, setNewTenant] = useState({
    tenantName: '',
    propertyTitle: '',
    rentAmount: '',
    leaseStart: '',
    leaseEnd: '',
    phone: '',
    status: 'Active'
  });

  const [newBroker, setNewBroker] = useState({
    name: '',
    company: '',
    phone: '',
    category: 'Commercial Broker' as 'Commercial Broker' | 'Residential Broker' | 'Vendor',
    notes: ''
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isAdmin = user && (
    user.role.toLowerCase().includes('admin') || 
    user.role.toLowerCase().includes('super') || 
    user.role.toLowerCase().includes('manager')
  );

  // Fetch all real sheet data from Google Apps Script with LocalStorage Caching
  const fetchAllData = async () => {
    if (!user) return;
    setIsLoadingData(true);
    setResponseAlert(null);
    try {
      const url = `/api/gas?tabName=Commercial%20Inventory&action=get`;
      const res = await fetch(url);
      const json = await res.json();

      if (json && json.status === 'OK' && json.data) {
        const dataObj = json.data;

        const commInv = findTabMatrix(dataObj, 'commercial inventory', 'commercial');
        const resInv = findTabMatrix(dataObj, 'residential inventory', 'residential');
        const parsedInv = [...parseMatrixToObjects(commInv, 'Commercial'), ...parseMatrixToObjects(resInv, 'Residential')];
        setInventoryList(parsedInv);
        localStorage.setItem('tlc_cache_inv', JSON.stringify(parsedInv));

        const commProj = findTabMatrix(dataObj, 'commercial projects', 'commercial projects');
        const resProj = findTabMatrix(dataObj, 'residential projects', 'residential projects');
        const parsedProj = [...parseMatrixToObjects(commProj, 'Project'), ...parseMatrixToObjects(resProj, 'Project')];
        setProjectsList(parsedProj);
        localStorage.setItem('tlc_cache_proj', JSON.stringify(parsedProj));

        const parsedCrm = parseMatrixToObjects(findTabMatrix(dataObj, 'crm', 'leads'), 'CRM') as CRMItem[];
        setCrmList(parsedCrm);
        localStorage.setItem('tlc_cache_crm', JSON.stringify(parsedCrm));

        const parsedTen = parseMatrixToObjects(findTabMatrix(dataObj, 'tenants', 'tenant'), 'Tenant') as TenantItem[];
        setTenantsList(parsedTen);
        localStorage.setItem('tlc_cache_ten', JSON.stringify(parsedTen));

        const parsedBro = parseMatrixToObjects(findTabMatrix(dataObj, 'brokers & vendors', 'brokers', 'vendors'), 'Broker') as BrokerItem[];
        setBrokersList(parsedBro);
        localStorage.setItem('tlc_cache_bro', JSON.stringify(parsedBro));

        setDailyReportsList(parseMatrixToObjects(findTabMatrix(dataObj, 'daily reports', 'reports'), 'Report') as ReportItem[]);
        setCallLogsList(parseMatrixToObjects(findTabMatrix(dataObj, 'call logs', 'calls'), 'CallLog') as CallLogItem[]);
        setAllocationHistoryList(parseMatrixToObjects(findTabMatrix(dataObj, 'allocation history', 'allocation'), 'Allocation') as AllocationItem[]);
        setApprovalRequestsList(parseMatrixToObjects(findTabMatrix(dataObj, 'approval requests', 'approvals'), 'Approval') as ApprovalItem[]);

        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSynced(nowStr);
        localStorage.setItem('tlc_last_sync', nowStr);

        setResponseAlert(null);
      } else {
        setResponseAlert(`Unexpected response format: ${JSON.stringify(json).slice(0, 300)}`);
      }
    } catch (err: any) {
      console.error('Fetch all data error:', err);
      setResponseAlert(`Network or parsing error: ${err.message}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    setResponseAlert(null);

    const tabName = 'Employees';
    const loginUrl = `/api/gas?tabName=${encodeURIComponent(tabName)}&action=get`;

    try {
      const response = await fetch(loginUrl, { method: 'GET', cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Employees data request failed (HTTP ${response.status}). Please check the Google Apps Script deployment.`);
      }
      const json = await response.json();
      if (json?.status && !['OK', 'success'].includes(String(json.status).toLowerCase()) && String(json.status).toUpperCase() !== 'OK') {
        throw new Error('Employees data source returned an error. Check the Google Apps Script deployment and sheet access.');
      }

      let employeesMatrix: any[][] = [];
      if (json?.data && typeof json.data === 'object') {
        employeesMatrix = findTabMatrix(json.data, 'employees', 'employee', 'staff', 'team', 'login');
      } else if (Array.isArray(json)) {
        employeesMatrix = json;
      } else if (Array.isArray(json?.data)) {
        employeesMatrix = json.data;
      }
      if (!employeesMatrix.length) {
        throw new Error('Employees tab is missing or empty in the Google Apps Script response.');
      }
      if (!Array.isArray(employeesMatrix[0])) {
        throw new Error('Employees tab has an unsupported format; expected a header row followed by employee rows.');
      }
      if (employeesMatrix.length < 2) {
        throw new Error('Employees tab has no employee records.');
      }

      const employees = parseMatrixToObjects(employeesMatrix, 'Employee');
      const matchedEmp = employees.find((emp: any) => {
        const id = String(getVal(emp, 'login id', 'loginid', 'email', 'username', 'id') || '').trim().toLowerCase();
        const pass = String(getVal(emp, 'password', 'pass', 'pwd') || '').trim();
        return id === loginId.trim().toLowerCase() && pass === password.trim();
      });

      if (matchedEmp) {
        const empName = getVal(matchedEmp, 'name', 'employee name', 'full name', 'fullname', 'staff name') || 'Team Member';
        const empRole = getVal(matchedEmp, 'role', 'role/designation', 'designation', 'position', 'title') || 'Leasing Executive';

        const loggedUser = {
          loginId: loginId.trim(),
          name: empName,
          role: empRole,
        };
        setUser(loggedUser);
        localStorage.setItem('tlc_user', JSON.stringify(loggedUser));
        showToast('Login successful!');
      } else {
        setLoginError('Invalid Login ID or Password. Please check Employees sheet.');
        setResponseAlert('Employee credentials did not match a row in the Employees tab. Check the Login ID and Password columns.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError(`Connection error: ${err.message}`);
      setResponseAlert(`Login error: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tlc_user');
    showToast('Logged out successfully.');
  };

  // WhatsApp share helper
  const handleShareWhatsApp = (item: InventoryItem) => {
    const text = `🏢 *${item.title.toUpperCase()}* - The Leasing Company\n📍 Location: ${item.locationLine}\n🏷️ Price: ${item.priceBadge}\n🛋️ Furnishing: ${item.furnishing}\n📝 Notes: ${item.notes}\n📞 Contact: ${item.contactPerson} (${item.phone})`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // WhatsApp AI Parser Handler
  const handleParseWA = async () => {
    if (!rawWAMessage.trim()) {
      showToast('Please paste a WhatsApp message first.');
      return;
    }

    setIsParsingWA(true);
    setParseSuccessMsg('');

    try {
      const res = await fetch('/api/parse-wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: rawWAMessage }),
      });
      const data = await res.json();
      if (data.success && data.items) {
        setParsedItems(data.items);
        setParseSuccessMsg(`Successfully extracted ${data.items.length} item(s)! Review and save to database.`);
      } else {
        showToast('Failed to parse message. Please try again.');
      }
    } catch (err) {
      console.error('WA Parse Error:', err);
      showToast('Error communicating with AI parser.');
    } finally {
      setIsParsingWA(false);
    }
  };

  // Check Duplicate before saving property
  const checkForDuplicate = (title: string): InventoryItem | null => {
    const cleanNewTitle = title.trim().toLowerCase();
    return inventoryList.find(item => item.title.trim().toLowerCase() === cleanNewTitle) || null;
  };

  // Save parsed item via POST UPSERT
  const saveParsedItem = async (item: any) => {
    const dup = checkForDuplicate(item.title);
    if (dup) {
      setDuplicateWarning({ existing: dup, newTitle: item.title });
      return;
    }

    const tabName = item.category === 'Commercial Inventory' ? 'Commercial Inventory' :
                    item.category === 'Residential Inventory' ? 'Residential Inventory' : 'CRM';

    const payload = {
      action: 'UPSERT',
      tabName: tabName,
      data: item
    };

    try {
      await fetch(`/api/gas?tabName=${encodeURIComponent(tabName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error('Error syncing to GAS:', e);
    }

    if (tabName.includes('Inventory')) {
      const newInvItem: InventoryItem = {
        id: 'inv-' + Date.now() + Math.random().toString(36).substr(2, 4),
        type: tabName.includes('Commercial') ? 'Commercial' : 'Residential',
        title: item.title || 'Parsed Property',
        locationLine: item.location || 'Pune',
        priceBadge: formatPrice(item.budgetOrPrice || 'On Request'),
        transactionType: 'Lease',
        carpetSqft: '',
        builtUpSqft: '',
        chargeableSqft: '',
        subType: item.bhkOrConfig || '',
        furnishing: item.furnishing || 'Unfurnished',
        possession: '',
        contactPerson: item.contactPerson || 'Broker',
        phone: item.phone || '',
        notes: item.notes || item.title,
        dateAdded: new Date().toISOString().split('T')[0],
        propertyType: item.propertyType || 'Office / Apartment',
        status: 'Available',
        rawPrice: 0,
        rawArea: 0,
        rawAnnualRent: 0,
        ratePerSqft: '',
        yieldPercent: '',
        parking: '',
        deposit: '',
        tenantPreference: ''
      };
      setInventoryList([newInvItem, ...inventoryList]);
      showToast('Saved to Inventory!');
    } else {
      const newCrmItem: CRMItem = {
        id: 'crm-' + Date.now() + Math.random().toString(36).substr(2, 4),
        clientName: item.contactPerson || 'WhatsApp Lead',
        phone: item.phone || '',
        type: item.category === 'Follow-Up' ? 'Follow-Up' : 'Requirement',
        requirementSummary: item.title + ' - ' + (item.notes || ''),
        budget: formatPrice(item.budgetOrPrice || 'Flexible'),
        preferredLocation: item.location || 'Any',
        status: 'New',
        notes: item.notes || '',
        date: new Date().toISOString().split('T')[0]
      };
      setCrmList([newCrmItem, ...crmList]);
      showToast('Saved to CRM Leads!');
    }
  };

  const handleAddInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInv.title || !newInv.location) {
      showToast('Please fill in title and location.');
      return;
    }

    const dup = checkForDuplicate(newInv.title);
    if (dup) {
      setDuplicateWarning({ existing: dup, newTitle: newInv.title });
      return;
    }

    const tabName = newInv.type === 'Commercial' ? 'Commercial Inventory' : 'Residential Inventory';
    const item: InventoryItem = {
      id: 'inv-' + Date.now(),
      type: newInv.type,
      title: newInv.title,
      locationLine: newInv.location,
      priceBadge: formatPrice(newInv.budgetOrPrice || 'On Request'),
      transactionType: 'Lease',
      carpetSqft: '',
      builtUpSqft: '',
      chargeableSqft: '',
      subType: newInv.bhkOrConfig,
      furnishing: newInv.furnishing,
      possession: '',
      contactPerson: newInv.contactPerson,
      phone: newInv.phone,
      notes: newInv.notes,
      dateAdded: new Date().toISOString().split('T')[0],
      propertyType: newInv.propertyType,
      status: 'Available',
      rawPrice: 0,
      rawArea: 0,
      rawAnnualRent: 0,
      ratePerSqft: '',
      yieldPercent: '',
      photoUrl: newPhotoBase64,
      parking: '',
      deposit: '',
      tenantPreference: ''
    };

    try {
      await fetch(`/api/gas?tabName=${encodeURIComponent(tabName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPSERT', tabName, data: item })
      });
    } catch (e) {
      console.error(e);
    }

    setInventoryList([item, ...inventoryList]);
    setShowAddInventoryModal(false);
    setNewPhotoBase64('');
    showToast('Property added successfully!');
  };

  const handleAddProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tabName = newProject.type === 'Commercial' ? 'Commercial Projects' : 'Residential Projects';
    const item: ProjectItem = {
      id: 'proj-' + Date.now(),
      ...newProject,
      priceRange: formatPrice(newProject.priceRange || 'On Request')
    };

    try {
      await fetch(`/api/gas?tabName=${encodeURIComponent(tabName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPSERT', tabName, data: item })
      });
    } catch (e) {
      console.error(e);
    }

    setProjectsList([item, ...projectsList]);
    setShowAddProjectModal(false);
    showToast('Project added successfully!');
  };

  const handleAddCRMSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tabName = 'CRM';
    const item: CRMItem = {
      id: 'crm-' + Date.now(),
      ...newCrm,
      budget: formatPrice(newCrm.budget || 'Flexible'),
      date: new Date().toISOString().split('T')[0]
    };

    try {
      await fetch(`/api/gas?tabName=${encodeURIComponent(tabName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPSERT', tabName, data: item })
      });
    } catch (e) {
      console.error(e);
    }

    setCrmList([item, ...crmList]);
    setShowAddCRMModal(false);
    showToast('Lead added successfully!');
  };

  const handleAddTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tabName = 'Tenants';
    const item: TenantItem = {
      id: 'ten-' + Date.now(),
      ...newTenant,
      rentAmount: formatPrice(newTenant.rentAmount || '0')
    };

    try {
      await fetch(`/api/gas?tabName=${encodeURIComponent(tabName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPSERT', tabName, data: item })
      });
    } catch (e) {
      console.error(e);
    }

    setTenantsList([item, ...tenantsList]);
    setShowAddTenantModal(false);
    showToast('Tenant added successfully!');
  };

  const handleAddBrokerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tabName = 'Brokers & Vendors';
    const item: BrokerItem = {
      id: 'br-' + Date.now(),
      ...newBroker
    };

    try {
      await fetch(`/api/gas?tabName=${encodeURIComponent(tabName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPSERT', tabName, data: item })
      });
    } catch (e) {
      console.error(e);
    }

    setBrokersList([item, ...brokersList]);
    setShowAddBrokerModal(false);
    showToast('Broker added successfully!');
  };

  // Status update handler for inventory items
  const handleUpdateStatus = async (item: InventoryItem, newStatus: string) => {
    const tabName = item.type === 'Commercial' ? 'Commercial Inventory' : 'Residential Inventory';
    const updated = { ...item, status: newStatus };
    try {
      await fetch(`/api/gas?tabName=${encodeURIComponent(tabName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPSERT', tabName, data: updated })
      });
      setInventoryList(inventoryList.map(i => i.id === item.id ? updated : i));
      showToast(`Status updated to ${newStatus}`);
    } catch (e) {
      console.error(e);
      showToast('Failed to update status');
    }
  };

  // CSV Export helper
  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      showToast('No data to export.');
      return;
    }
    const keys = Object.keys(data[0]);
    const csvContent = [
      keys.join(','),
      ...data.map(row => keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV exported successfully!');
  };

  // WhatsApp Shortlist Share (Client-Safe: hides owner name, phone, unit no, source)
  const handleShareShortlist = () => {
    const selectedItems = inventoryList.filter(i => selectedIds.includes(i.id));
    if (selectedItems.length === 0) {
      showToast('No properties selected.');
      return;
    }

    let msg = `🏢 *CURATED PROPERTY SHORTLIST* - The Leasing Company\n\n`;
    selectedItems.forEach((item, index) => {
      msg += `*${index + 1}. ${item.title.toUpperCase()}*\n`;
      msg += `📍 Location: ${item.locationLine.replace(/\s*\(Unit:.*?\)/g, '')}\n`;
      msg += `🏷️ Price: ${item.priceBadge} (${item.transactionType})\n`;
      if (item.carpetSqft) msg += `📐 Carpet Area: ${item.carpetSqft} sq.ft\n`;
      if (item.ratePerSqft) msg += `📊 Rate: ${item.ratePerSqft}\n`;
      if (item.yieldPercent) msg += `📈 Gross Yield: ${item.yieldPercent}\n`;
      if (item.furnishing) msg += `🛋️ Furnishing: ${item.furnishing}\n`;
      if (item.notes) msg += `📝 Notes: ${item.notes}\n`;
      msg += `\n`;
    });
    msg += `Please let us know your preferred options for a site visit!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const isStaleListing = (dateAdded: string) => {
    if (!dateAdded) return false;
    const d = new Date(dateAdded);
    if (isNaN(d.getTime())) return false;
    const diffDays = (Date.now() - d.getTime()) / (1000 * 3600 * 24);
    return diffDays > 30;
  };

  const handleConfirmAvailable = async (item: InventoryItem) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...item, dateAdded: today, status: 'Available' };
    const tabName = item.type === 'Commercial' ? 'Commercial Inventory' : 'Residential Inventory';
    try {
      await fetch(`/api/gas?tabName=${encodeURIComponent(tabName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPSERT', tabName, data: updated })
      });
      setInventoryList(inventoryList.map(i => i.id === item.id ? updated : i));
      showToast('Confirmed available today!');
    } catch (e) {
      console.error('Error confirming available:', e);
      showToast('Failed to update.');
    }
  };

  const handleAskOwnerWA = (item: InventoryItem) => {
    const cleanPhone = (item.phone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Hi, checking if ${item.title} (${item.carpetSqft || item.builtUpSqft || 'Area'} sq.ft) in ${item.locationLine.replace(/\s*\(Unit:.*?\)/g, '')} is still available?`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const startSpeechRecognition = (onResult: (text: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice recognition not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
      showToast(`Heard: "${text}"`);
    };
    recognition.onerror = () => {
      showToast('Voice recognition error.');
    };
    recognition.start();
    showToast('Listening... Speak now 🎤');
  };

  // Find matching properties for CRM Lead
  const getMatchingPropertiesForLead = (lead: CRMItem) => {
    return inventoryList.filter(item => {
      const matchesType = item.type === (lead.requirementSummary.toLowerCase().includes('residential') ? 'Residential' : 'Commercial');
      const matchesLoc = lead.preferredLocation === 'Any' || item.locationLine.toLowerCase().includes(lead.preferredLocation.toLowerCase());
      return matchesLoc;
    });
  };

  // Log Call / Visit handler
  const handleLogCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callLogLead) return;

    const userName = user?.name || 'Executive';
    const callRecord: CallLogItem = {
      id: 'call-' + Date.now(),
      callerName: userName,
      clientName: callLogLead.clientName,
      duration: '5 mins',
      timestamp: new Date().toLocaleString(),
      notes: callNotes,
      outcome: callOutcome
    };

    const reportRecord: ReportItem = {
      id: 'rep-' + Date.now(),
      executiveName: userName,
      callsMade: '1',
      siteVisits: callOutcome === 'Site Visit' ? '1' : '0',
      dealsClosed: callOutcome === 'Deal Closed' ? '1' : '0',
      date: new Date().toISOString().split('T')[0],
      notes: `Call with ${callLogLead.clientName}: ${callNotes}`
    };

    try {
      await Promise.all([
        fetch('/api/gas?tabName=Call%20Logs', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'UPSERT', tabName: 'Call Logs', data: callRecord })
        }),
        fetch('/api/gas?tabName=Daily%20Reports', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'UPSERT', tabName: 'Daily Reports', data: reportRecord })
        })
      ]);

      setCallLogsList([callRecord, ...callLogsList]);
      setDailyReportsList([reportRecord, ...dailyReportsList]);
      setShowCallLogModal(false);
      setCallNotes('');
      showToast('Call logged & daily report updated successfully!');
    } catch (e) {
      console.error(e);
      showToast('Error syncing call log');
    }
  };

  // Auto-generated location micro market chips from inventory
  const uniqueLocations = Array.from(new Set(inventoryList.map(i => i.locationLine.split('•')[0].trim()))).filter(Boolean);

  // Filtered inventory with advanced filters & sorting
  const filteredInventory = inventoryList.filter(item => {
    const matchesType = item.type === inventoryType;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationLine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.propertyType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLoc = filterLocation === 'All' || item.locationLine.toLowerCase().includes(filterLocation.toLowerCase());
    const matchesTrans = filterTransType === 'All' || item.transactionType.toLowerCase() === filterTransType.toLowerCase();
    const matchesPropType = filterPropType === 'All' || item.propertyType.toLowerCase().includes(filterPropType.toLowerCase());
    const matchesFurnish = filterFurnishing === 'All' || item.furnishing.toLowerCase().includes(filterFurnishing.toLowerCase());
    const matchesStatus = filterStatus === 'All' || item.status.toLowerCase() === filterStatus.toLowerCase();

    const matchesPreset = 
      activePreset === 'All' ? true :
      activePreset === 'Ready Possession' ? (item.possession.toLowerCase().includes('ready') || item.status === 'Available') :
      activePreset === 'Pre-Leased' ? (item.transactionType.toLowerCase().includes('pre-leased') || item.yieldPercent) :
      activePreset === 'Under ₹1L Rent' ? (item.rawPrice > 0 && item.rawPrice <= 100000) :
      activePreset === 'Furnished Offices' ? (item.furnishing.toLowerCase().includes('fully furnished') && item.propertyType.toLowerCase().includes('office')) :
      activePreset === '30d+ Needs Check' ? isStaleListing(item.dateAdded) : true;

    return matchesType && matchesSearch && matchesLoc && matchesTrans && matchesPropType && matchesFurnish && matchesStatus && matchesPreset;
  }).sort((a, b) => {
    if (sortBy === 'PriceLowToHigh') return a.rawPrice - b.rawPrice;
    if (sortBy === 'PriceHighToLow') return b.rawPrice - a.rawPrice;
    if (sortBy === 'AreaHighToLow') return b.rawArea - a.rawArea;
    return 0; // Newest default
  });

  const filteredProjects = projectsList.filter(proj => {
    const matchesType = proj.type === projectType;
    const matchesSearch = searchQuery === '' ||
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.developer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredCRM = crmList.filter(crm => {
    if (onlyTodayFollowUps) {
      const today = new Date().toISOString().split('T')[0];
      return crm.nextFollowUp === today || crm.type === 'Follow-Up';
    }
    return true;
  });

  const pendingApprovalsCount = approvalRequestsList.filter(a => a.status === 'Pending').length;
  const todayFollowUpsCount = crmList.filter(c => c.type === 'Follow-Up').length;
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayFollowUpsAlerts = crmList.filter(c => c.nextFollowUp && c.nextFollowUp <= todayDateStr);
  const pendingApprovalsAlerts = approvalRequestsList.filter(a => a.status === 'Pending');
  const totalNotificationsCount = todayFollowUpsAlerts.length + pendingApprovalsAlerts.length;

  const handleScheduleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userName = user?.name || catalogRef || 'Executive';
    const reportRecord: ReportItem = {
      id: 'rep-' + Date.now(),
      executiveName: userName,
      callsMade: '0',
      siteVisits: '1',
      dealsClosed: '0',
      date: visitDate,
      notes: `Site Visit Scheduled for ${visitClientName} at ${visitTargetTitle} (${visitTime}): ${visitNotes}`
    };

    const crmRecord: CRMItem = {
      id: 'crm-' + Date.now(),
      clientName: visitClientName || 'Client',
      phone: '',
      type: 'Follow-Up',
      requirementSummary: `Site Visit: ${visitTargetTitle}`,
      budget: 'As Discussed',
      preferredLocation: 'Any',
      status: 'Site Visit',
      notes: visitNotes,
      date: new Date().toISOString().split('T')[0],
      nextFollowUp: visitDate
    };

    try {
      await Promise.all([
        fetch('/api/gas?tabName=Daily%20Reports', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'UPSERT', tabName: 'Daily Reports', data: reportRecord })
        }),
        fetch('/api/gas?tabName=CRM', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'UPSERT', tabName: 'CRM', data: crmRecord })
        })
      ]);

      setDailyReportsList([reportRecord, ...dailyReportsList]);
      setCrmList([crmRecord, ...crmList]);
      setShowScheduleVisitModal(false);
      setVisitNotes('');
      showToast('Site visit scheduled successfully!');
    } catch (e) {
      console.error(e);
      showToast('Failed to schedule visit.');
    }
  };

  if (!isClientCatalogView && !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-[#121619] text-white' : 'bg-[#F8F7F4] text-[#121619]'}`}>
        <div className={`w-full max-w-md rounded-3xl p-8 shadow-xl border ${darkMode ? 'bg-[#1E2429] border-gray-800' : 'bg-white border-gray-100'}`}>
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#E96932] flex items-center justify-center text-white mb-3 shadow-md">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">The Leasing Company</h1>
            <p className="text-sm opacity-70 mt-1">Employee Portal</p>
          </div>
          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1.5">Login ID</label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g. EMP-001"
                required
                className={`w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2 focus:ring-[#E96932] ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'bg-[#F8F7F4] border-gray-200 text-[#121619]'}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className={`w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2 focus:ring-[#E96932] ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'bg-[#F8F7F4] border-gray-200 text-[#121619]'}`}
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-[#E96932] hover:bg-[#d55a25] text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }
 if (isClientCatalogView) {
                 
    const catalogProperties = inventoryList.filter(i => catalogIds.includes(i.id));
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#121619] text-white' : 'bg-[#F8F7F4] text-[#121619]'} p-4 sm:p-8 font-sans`}>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-orange-500 to-[#E96932] rounded-3xl p-6 text-white shadow-xl space-y-3">
            <h1 className="text-xl font-black uppercase tracking-wide">The Leasing Company</h1>
            <p className="text-xs text-orange-100">Curated Property Shortlist for Client · Ref: {catalogRef}</p>
            <div className="pt-2 flex gap-2">
              <a
                href={`https://wa.me/?text=Hi%20${encodeURIComponent(catalogRef)},%20I%20reviewed%20the%20curated%20property%20shortlist%20and%20would%20like%20to%20schedule%20a%20visit!`}
                target="_blank"
                rel="noreferrer"
                className="bg-white text-[#E96932] px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md hover:bg-orange-50 transition"
              >
                <MessageCircle className="h-4 w-4" /> Schedule Visit / Enquire on WhatsApp
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold opacity-80">Selected Properties ({catalogProperties.length})</h2>
            {catalogProperties.map(item => (
              <div key={item.id} className={`${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-200'} rounded-3xl p-5 border shadow-sm space-y-3`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase bg-orange-100 text-[#E96932] px-2.5 py-0.5 rounded-full">{item.propertyType}</span>
                    <h3 className="text-base font-bold mt-1">{item.title}</h3>
                  </div>
                  <span className="text-sm font-extrabold text-[#E96932]">{item.priceBadge}</span>
                </div>
                <p className="text-xs opacity-75 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#E96932]" />
                  <span>{item.locationLine.replace(/\s*\(Unit:.*?\)/g, '')}</span>
                </p>
                <div className={`${darkMode ? 'bg-[#121619]' : 'bg-gray-50'} rounded-2xl p-3 text-xs opacity-85 space-y-1`}>
                  <div className="flex flex-wrap gap-x-3">
                    {item.carpetSqft && <span><strong>Carpet:</strong> {item.carpetSqft} sq.ft</span>}
                    {item.ratePerSqft && <span className="text-[#E96932]"><strong>Rate:</strong> {item.ratePerSqft}</span>}
                    {item.furnishing && <span><strong>Furnishing:</strong> {item.furnishing}</span>}
                  </div>
                  {item.notes && <p className="text-[11px] mt-1 opacity-75 italic">{item.notes}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-6 text-xs opacity-50">
            Powered by The Leasing Company · PWA
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#121619] text-[#F8F7F4]' : 'bg-[#F8F7F4] text-[#121619]'} pb-28 font-sans transition-colors`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#121619] text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-medium flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-[#E96932]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header with Sync Now (↻) & Last Synced */}
      <header className={`sticky top-0 z-30 ${darkMode ? 'bg-[#121619]/95 border-gray-800' : 'bg-[#F8F7F4]/95 border-gray-200/80'} backdrop-blur-md border-b px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`h-9 w-9 rounded-xl ${darkMode ? 'bg-[#1E2228] text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-200'} border flex items-center justify-center hover:opacity-80 transition shadow-xs relative`}
            title="More Modules"
          >
            <Menu className="h-4 w-4" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#E96932] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
          <div className="h-9 w-9 rounded-xl bg-[#E96932] flex items-center justify-center text-white font-bold shadow-sm">
            TLC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight">The Leasing Company</h1>
              <button
                onClick={fetchAllData}
                disabled={isLoadingData}
                className="flex items-center gap-1 bg-orange-500/10 text-[#E96932] px-2 py-0.5 rounded-md text-[10px] font-semibold hover:bg-orange-500/20 transition"
                title="Sync Now"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingData ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
            <p className="text-[10px] opacity-60">{user?.name || 'User'} · Synced: {lastSynced}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotificationsModal(true)}
            className={`h-9 w-9 rounded-xl ${darkMode ? 'bg-[#1E2228] text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-200'} border flex items-center justify-center hover:opacity-80 transition shadow-xs relative`}
            title="Notifications"
          >
            <Bell className="h-4 w-4 text-[#E96932]" />
            {totalNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {totalNotificationsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`h-9 w-9 rounded-xl ${darkMode ? 'bg-[#1E2228] text-amber-400 border-gray-700' : 'bg-white text-gray-700 border-gray-200'} border flex items-center justify-center transition shadow-xs`}
            title="Toggle Light/Dark Mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className={`h-9 w-9 rounded-xl ${darkMode ? 'bg-[#1E2228] text-gray-300 border-gray-700' : 'bg-white text-gray-700 border-gray-200'} border flex items-center justify-center hover:opacity-85 transition shadow-xs`}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {responseAlert && (
          <div className="bg-red-50 text-red-800 p-4 rounded-2xl text-xs border border-red-200 space-y-1">
            <strong>Apps Script Format Alert:</strong>
            <p className="font-mono">{responseAlert}</p>
          </div>
        )}

        {isLoadingData && (
          <div className="flex items-center justify-center py-6 opacity-75 text-xs gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#E96932]" />
            <span>Fetching live sheets from Google Apps Script...</span>
          </div>
        )}

        {/* TAB 1: INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className={`flex rounded-2xl ${darkMode ? 'bg-[#1E2228]' : 'bg-gray-200/70'} p-1 sticky top-14 z-20 shadow-sm backdrop-blur-md`}>
              <button
                onClick={() => setInventoryType('Commercial')}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition ${
                  inventoryType === 'Commercial'
                    ? `${darkMode ? 'bg-[#121619] text-white' : 'bg-white text-[#121619]'} shadow-sm`
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Commercial Inventory
              </button>
              <button
                onClick={() => setInventoryType('Residential')}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition ${
                  inventoryType === 'Residential'
                    ? `${darkMode ? 'bg-[#121619] text-white' : 'bg-white text-[#121619]'} shadow-sm`
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Residential Inventory
              </button>
            </div>

            {/* Search, Filter Button, Export CSV & Add */}
            <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search location, project, type..."
                  className={`w-full rounded-2xl ${darkMode ? 'bg-[#1E2228] border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-[#121619] placeholder-gray-400'} border pl-10 pr-10 py-2.5 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-[#E96932]`}
                />
                {hasSpeechSupport && (
                  <button
                    type="button"
                    onClick={() => startSpeechRecognition((text) => setSearchQuery(text))}
                    className="absolute right-3.5 top-2.5 text-gray-400 hover:text-[#E96932] transition text-sm"
                    title="Voice Search (Speak in English / Indian accent)"
                  >
                    🎤
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilterSheet(!showFilterSheet)}
                className={`px-3 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition ${showFilterSheet ? 'bg-[#E96932] text-white border-[#E96932]' : darkMode ? 'bg-[#1E2228] border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
              </button>
              <button
                onClick={() => exportCSV(filteredInventory, `${inventoryType}_Inventory.csv`)}
                className={`px-3 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition ${darkMode ? 'bg-[#1E2228] border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}
                title="Export Filtered CSV"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => setShowAddInventoryModal(true)}
                className="bg-[#E96932] text-white px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-md hover:bg-[#d55825] transition shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Quick Filter Preset Chips & Saved Searches */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {['All', 'Ready Possession', 'Pre-Leased', 'Under ₹1L Rent', 'Furnished Offices', '30d+ Needs Check', ...savedPresets.map(p => p.name)].map((preset) => {
                const isActive = activePreset === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => {
                      setActivePreset(preset);
                      if (preset === 'All') {
                        setFilterLocation('All'); setFilterTransType('All'); setFilterPropType('All'); setFilterFurnishing('All'); setFilterStatus('All');
                      } else if (preset === 'Ready Possession') {
                        setFilterStatus('Available');
                      } else if (preset === 'Pre-Leased') {
                        setFilterTransType('Pre-Leased');
                      } else if (preset === 'Furnished Offices') {
                        setFilterFurnishing('Fully Furnished');
                        setFilterPropType('Office');
                      } else {
                        const custom = savedPresets.find(p => p.name === preset);
                        if (custom) {
                          setFilterLocation(custom.filterLocation);
                          setFilterTransType(custom.filterTransType);
                          setFilterPropType(custom.filterPropType);
                          setFilterFurnishing(custom.filterFurnishing);
                          setFilterStatus(custom.filterStatus);
                        }
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition shrink-0 ${
                      isActive
                        ? 'bg-[#E96932] text-white shadow-sm'
                        : darkMode ? 'bg-[#1E2228] text-gray-300 border border-gray-800' : 'bg-white text-gray-700 border border-gray-200'
                    }`}
                  >
                    {preset === '30d+ Needs Check' ? '⚠️ 30d+ Needs Check' : preset}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  const presetName = prompt('Enter a name for this custom filter preset:');
                  if (!presetName) return;
                  const newPreset = {
                    name: presetName,
                    filterLocation,
                    filterTransType,
                    filterPropType,
                    filterFurnishing,
                    filterStatus
                  };
                  const updated = [...savedPresets, newPreset];
                  setSavedPresets(updated);
                  localStorage.setItem('tlc_saved_presets', JSON.stringify(updated));
                  showToast(`Preset "${presetName}" saved!`);
                }}
                className="px-2.5 py-1.5 rounded-xl font-semibold border border-dashed border-[#E96932] text-[#E96932] whitespace-nowrap text-xs flex items-center gap-1"
                title="Save current filters as preset"
              >
                + Save Filter
              </button>
            </div>

            {/* Expandable Advanced Filter Sheet */}
            {showFilterSheet && (
              <div className={`${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-200'} rounded-3xl p-4 border shadow-md space-y-3 animate-in fade-in duration-200 text-xs`}>
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold">Advanced Filters & Sorting</h3>
                  <button onClick={() => { setFilterLocation('All'); setFilterTransType('All'); setFilterPropType('All'); setFilterFurnishing('All'); setFilterStatus('All'); setSortBy('Newest'); }} className="text-[#E96932] text-[11px] font-semibold">Reset All</button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 opacity-80">Transaction Type</label>
                    <select value={filterTransType} onChange={(e) => setFilterTransType(e.target.value)} className={`w-full p-2 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                      <option value="All">All Transactions</option>
                      <option value="Lease">Lease / Rent</option>
                      <option value="Sale">Sale / Resale</option>
                      <option value="Pre-Leased">Pre-Leased</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 opacity-80">Sort By</label>
                    <select value={sortBy} onChange={(e: any) => setSortBy(e.target.value)} className={`w-full p-2 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                      <option value="Newest">Newest First</option>
                      <option value="PriceLowToHigh">Price: Low to High</option>
                      <option value="PriceHighToLow">Price: High to Low</option>
                      <option value="AreaHighToLow">Area: High to Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 opacity-80">Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`w-full p-2 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                      <option value="All">All Statuses</option>
                      <option value="Available">Available</option>
                      <option value="Under Negotiation">Under Negotiation</option>
                      <option value="Leased">Leased</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 opacity-80">Furnishing</label>
                    <select value={filterFurnishing} onChange={(e) => setFilterFurnishing(e.target.value)} className={`w-full p-2 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                      <option value="All">All Furnishing</option>
                      <option value="Fully Furnished">Fully Furnished</option>
                      <option value="Semi Furnished">Semi Furnished</option>
                      <option value="Unfurnished">Unfurnished</option>
                      <option value="Bare Shell">Bare Shell</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 opacity-80">Micro Market / Location</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    <button onClick={() => setFilterLocation('All')} className={`px-2.5 py-1 rounded-lg text-[11px] ${filterLocation === 'All' ? 'bg-[#E96932] text-white' : darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>All Locations</button>
                    {uniqueLocations.map((loc, idx) => (
                      <button key={idx} onClick={() => setFilterLocation(loc)} className={`px-2.5 py-1 rounded-lg text-[11px] ${filterLocation === loc ? 'bg-[#E96932] text-white' : darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>{loc}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Select Shortlist Action Bar */}
            <div className="flex items-center justify-between bg-orange-500/10 border border-[#E96932]/30 px-4 py-2.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSelectMode(!isSelectMode)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${isSelectMode ? 'bg-[#E96932] text-white' : darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}
                >
                  {isSelectMode ? 'Exit Select Mode' : '✨ Client Shortlist Mode'}
                </button>
                {isSelectMode && <span className="text-xs font-semibold opacity-80">{selectedIds.length} selected (max 5)</span>}
              </div>
              {isSelectMode && selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  {selectedIds.length >= 2 && selectedIds.length <= 3 && (
                    <button
                      onClick={() => setShowComparisonModal(true)}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-blue-700 transition"
                    >
                      <Columns className="h-3.5 w-3.5" />
                      <span>Compare ({selectedIds.length})</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const refId = user?.loginId || 'EMP-001';
                      const link = `${window.location.origin}${window.location.pathname}?client=1&ids=${selectedIds.join(',')}&ref=${encodeURIComponent(refId)}`;
                      navigator.clipboard.writeText(link);
                      showToast('Client catalog link copied to clipboard!');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${darkMode ? 'bg-[#121619] border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                  >
                    <FileText className="h-3.5 w-3.5 text-[#E96932]" />
                    <span>Copy Link</span>
                  </button>
                  <button
                    onClick={handleShareShortlist}
                    className="bg-[#25D366] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-[#22bf5b] transition"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {filteredInventory.length === 0 && !isLoadingData ? (
                <div className={`text-center py-12 ${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-100'} rounded-3xl border p-8`}>
                  <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium opacity-80">No properties found matching filters.</p>
                </div>
              ) : (
                <>
                  {filteredInventory.slice(0, inventoryDisplayLimit).map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const benchmark = getBenchmarkBadge(item);
                    return (
                      <div key={item.id} className={`${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-200/80'} rounded-3xl p-5 border shadow-xs hover:shadow-md transition space-y-3 relative`}>
                        {isSelectMode && (
                          <div className="absolute top-4 right-4 z-10">
                            <button
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedIds(selectedIds.filter(id => id !== item.id));
                                } else {
                                  if (selectedIds.length >= 5) {
                                    showToast('You can select up to 5 properties for a client shortlist.');
                                    return;
                                  }
                                  setSelectedIds([...selectedIds, item.id]);
                                }
                              }}
                              className="h-6 w-6 rounded-lg bg-[#E96932] text-white flex items-center justify-center shadow-sm"
                            >
                              {isSelected ? <Check className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                            </button>
                          </div>
                        )}

                        {item.photoUrl && (
                          <img src={item.photoUrl} alt={item.title} className="w-full h-40 object-cover rounded-2xl mb-2 shadow-xs" />
                        )}

                        <div className="flex items-start justify-between gap-2 pr-8">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E96932]/10 text-[#E96932] px-2.5 py-0.5 rounded-full truncate max-w-[160px]">
                                {item.propertyType}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${benchmark.color}`}>
                                {benchmark.label}
                              </span>
                              <select
                                value={item.status}
                                onChange={(e) => handleUpdateStatus(item, e.target.value)}
                                className="text-[10px] font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-lg border-0 cursor-pointer"
                              >
                                <option value="Available">Available</option>
                                <option value="Under Negotiation">Under Negotiation</option>
                                <option value="Leased">Leased</option>
                                <option value="Sold">Sold</option>
                              </select>
                            </div>
                            <h3 className="text-base font-bold truncate">{item.title}</h3>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-extrabold text-[#E96932]">{item.priceBadge}</span>
                            {item.yieldPercent && (
                              <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                                📈 {item.yieldPercent}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs opacity-75">
                          <MapPin className="h-3.5 w-3.5 text-[#E96932] shrink-0" />
                          <span className="truncate">{item.locationLine}</span>
                        </div>

                        {/* Spec Chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {item.furnishing && <span className="text-[10px] bg-orange-500/10 text-[#E96932] px-2 py-0.5 rounded-lg font-semibold">🛋️ {item.furnishing}</span>}
                          {item.parking && <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-lg font-semibold">🅿️ {item.parking}</span>}
                          {item.tenantPreference && <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-lg font-semibold">👥 {item.tenantPreference}</span>}
                        </div>

                        {isStaleListing(item.dateAdded) && (
                          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-semibold justify-between flex-wrap gap-y-2">
                            <div className="flex items-center gap-1.5">
                              <span>⚠️ Verify Availability (30d+ since update)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleConfirmAvailable(item)}
                                className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs hover:bg-emerald-700 transition"
                              >
                                Confirm Available Today
                              </button>
                              <button
                                onClick={() => handleAskOwnerWA(item)}
                                className="bg-[#25D366] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs hover:bg-[#22bf5b] transition flex items-center gap-1"
                              >
                                <MessageCircle className="h-3 w-3" />
                                Ask Owner WA
                              </button>
                            </div>
                          </div>
                        )}

                        <div className={`text-xs ${darkMode ? 'bg-[#121619] border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'} rounded-xl p-3 border space-y-1`}>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {item.carpetSqft && <span><strong>Carpet:</strong> {item.carpetSqft} sq.ft</span>}
                            {item.builtUpSqft && <span><strong>Built-up:</strong> {item.builtUpSqft} sq.ft</span>}
                            {item.chargeableSqft && <span><strong>Chargeable:</strong> {item.chargeableSqft} sq.ft</span>}
                            {item.ratePerSqft && <span className="text-[#E96932]"><strong>Rate:</strong> {item.ratePerSqft}</span>}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] opacity-80 pt-1 border-t border-gray-200/20">
                            {item.subType && <span><strong>Config/BHK:</strong> {item.subType}</span>}
                            {item.possession && <span><strong>Possession:</strong> {item.possession}</span>}
                            {item.deposit && <span><strong>Deposit:</strong> {item.deposit}</span>}
                          </div>
                          {(item.contactPerson || item.phone) && (
                            <div className="pt-1 text-[11px]">
                              <strong>Contact:</strong> {item.contactPerson || ''} {item.phone ? `(${item.phone})` : ''}
                            </div>
                          )}
                          {item.notes && <p className="text-[11px] mt-1 italic opacity-75">{item.notes}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] opacity-50">Added: {item.dateAdded}</span>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <button
                              onClick={() => { setActiveDealFinancialsItem(item); setShowDealFinancialsModal(true); }}
                              className={`h-9 px-2.5 rounded-xl ${darkMode ? 'bg-[#121619] text-gray-200 hover:bg-gray-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} text-xs font-medium flex items-center gap-1 transition`}
                              title="Deal Financials"
                            >
                              <BarChart3 className="h-3.5 w-3.5 text-[#E96932]" />
                              <span>Financials</span>
                            </button>
                            <button
                              onClick={() => {
                                const summary = `🏢 *${item.title.toUpperCase()}* (${item.propertyType})\n📍 Location: ${item.locationLine.replace(/\s*\(Unit:.*?\)/g, '')}\n🏷️ Price: ${item.priceBadge} | Rate: ${item.ratePerSqft}\n🛋️ Furnishing: ${item.furnishing} | Parking: ${item.parking}\n📞 Contact: ${item.contactPerson} (${item.phone})`;
                                navigator.clipboard.writeText(summary);
                                showToast('Property summary copied to clipboard!');
                              }}
                              className={`h-9 px-2.5 rounded-xl ${darkMode ? 'bg-[#121619] text-gray-200 hover:bg-gray-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} text-xs font-medium flex items-center gap-1 transition`}
                              title="Copy Summary"
                            >
                              <Copy className="h-3.5 w-3.5 text-[#E96932]" />
                              <span>Copy</span>
                            </button>
                            <button
                              onClick={() => { setVisitTargetTitle(item.title); setShowScheduleVisitModal(true); }}
                              className={`h-9 px-2.5 rounded-xl ${darkMode ? 'bg-[#121619] text-gray-200 hover:bg-gray-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} text-xs font-medium flex items-center gap-1 transition`}
                              title="Schedule Visit"
                            >
                              <Calendar className="h-3.5 w-3.5 text-[#E96932]" />
                              <span>Visit</span>
                            </button>
                            <button
                              onClick={() => { setActiveFlyerItem(item); setShowFlyerModal(true); }}
                              className={`h-9 px-2.5 rounded-xl ${darkMode ? 'bg-[#121619] text-gray-200 hover:bg-gray-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} text-xs font-medium flex items-center gap-1 transition`}
                            >
                              <Printer className="h-3.5 w-3.5 text-[#E96932]" />
                              <span>Flyer</span>
                            </button>
                            {item.phone && (
                              <a
                                href={`tel:${item.phone}`}
                                className={`h-9 px-2.5 rounded-xl ${darkMode ? 'bg-[#121619] text-gray-200 hover:bg-gray-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} text-xs font-medium flex items-center gap-1 transition`}
                              >
                                <Phone className="h-3.5 w-3.5" />
                                <span>Call</span>
                              </a>
                            )}
                            <button
                              onClick={() => handleShareWhatsApp(item)}
                              className="h-9 px-3 rounded-xl bg-[#25D366] text-white text-xs font-semibold flex items-center gap-1 shadow-sm hover:bg-[#22bf5b] transition"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredInventory.length > inventoryDisplayLimit && (
                    <div className="text-center py-6">
                      <button
                        onClick={() => setInventoryDisplayLimit(prev => prev + 25)}
                        className="px-6 py-3 bg-[#E96932] text-white rounded-2xl text-xs font-bold shadow-md hover:bg-[#d55825] transition"
                      >
                        Load More Properties ({inventoryDisplayLimit} of {filteredInventory.length} shown)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className={`flex rounded-2xl ${darkMode ? 'bg-[#1E2228]' : 'bg-gray-200/70'} p-1 sticky top-14 z-20 shadow-sm backdrop-blur-md`}>
              <button
                onClick={() => setProjectType('Commercial')}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition ${
                  projectType === 'Commercial' ? `${darkMode ? 'bg-[#121619] text-white' : 'bg-white text-[#121619]'} shadow-sm` : 'opacity-70'
                }`}
              >
                Commercial Projects
              </button>
              <button
                onClick={() => setProjectType('Residential')}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition ${
                  projectType === 'Residential' ? `${darkMode ? 'bg-[#121619] text-white' : 'bg-white text-[#121619]'} shadow-sm` : 'opacity-70'
                }`}
              >
                Residential Projects
              </button>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold">{projectType} Projects Directory</h2>
              {isAdmin && (
                <button
                  onClick={() => setShowAddProjectModal(true)}
                  className="bg-[#E96932] text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Project</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filteredProjects.length === 0 ? (
                <div className={`text-center py-12 ${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-100'} rounded-3xl border p-8`}>
                  <Briefcase className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium opacity-80">No projects found in {projectType} Projects.</p>
                </div>
              ) : (
                filteredProjects.map((proj) => (
                  <div key={proj.id} className={`${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-200'} rounded-3xl p-5 border shadow-xs space-y-2`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-[#E96932] px-2.5 py-0.5 rounded-full">
                          {proj.developer}
                        </span>
                        <h3 className="text-base font-bold mt-1">{proj.name}</h3>
                      </div>
                      <span className="text-sm font-extrabold text-[#E96932]">{proj.priceRange}</span>
                    </div>
                    <div className="text-xs opacity-75 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#E96932]" />
                      <span>{proj.location}</span>
                    </div>
                    <div className={`text-xs ${darkMode ? 'bg-[#121619] text-gray-300' : 'bg-gray-50 text-gray-700'} rounded-xl p-3 flex justify-between`}>
                      <span>Total Units: <strong>{proj.totalUnits}</strong></span>
                      <span>Available: <strong className="text-emerald-500">{proj.availableUnits}</strong></span>
                      <span>Status: <strong className="text-[#E96932]">{proj.status}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CRM */}
        {activeTab === 'crm' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold">Client Requirements & CRM</h2>
                <p className="text-xs opacity-70">Live data from "CRM" tab</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => exportCSV(filteredCRM, `CRM_Leads.csv`)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${darkMode ? 'bg-[#1E2228] border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}
                  title="Export Filtered CSV"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => setOnlyTodayFollowUps(!onlyTodayFollowUps)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${onlyTodayFollowUps ? 'bg-[#E96932] text-white border-[#E96932]' : darkMode ? 'bg-[#1E2228] border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}
                >
                  Today's Follow-Ups ({todayFollowUpsCount})
                </button>
                <button
                  onClick={() => setShowAddCRMModal(true)}
                  className="bg-[#E96932] text-white px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-md hover:bg-[#d55825] transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Lead</span>
                </button>
              </div>
            </div>

            {/* Today's Visits & Follow-Ups Banner */}
            <div className={`${darkMode ? 'bg-[#1E2228] border-orange-500/30' : 'bg-orange-50 border-orange-200'} rounded-2xl p-4 border flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#E96932] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold">Today's Visits & Follow-Ups Due ({todayFollowUpsCount})</h4>
                  <p className="text-[11px] opacity-75">Keep track of client site visits and follow-up calls scheduled for today.</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleVisitModal(true)}
                className="bg-[#E96932] text-white px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0"
              >
                + Schedule Visit
              </button>
            </div>

            <div className="space-y-3">
              {filteredCRM.length === 0 ? (
                <div className={`text-center py-12 ${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-100'} rounded-3xl border p-8`}>
                  <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium opacity-80">No CRM leads found.</p>
                </div>
              ) : (
                filteredCRM.map((crm) => {
                  const matchingCount = getMatchingPropertiesForLead(crm).length;
                  return (
                    <div key={crm.id} className={`${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-200/80'} rounded-3xl p-5 border shadow-xs space-y-3`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              crm.type === 'Requirement' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {crm.type}
                            </span>
                            <span className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                              {crm.status}
                            </span>
                          </div>
                          <h3 className="text-base font-bold">{crm.clientName}</h3>
                        </div>
                        <span className="text-xs font-bold text-[#E96932]">{crm.budget}</span>
                      </div>

                      <div className="text-xs opacity-80 space-y-1">
                        <p><span className="font-semibold">Requirement: </span>{crm.requirementSummary}</p>
                        <p><span className="font-semibold">Preferred Location: </span>{crm.preferredLocation}</p>
                        {crm.notes && <p className={`text-[11px] ${darkMode ? 'bg-[#121619]' : 'bg-gray-50'} p-2 rounded-xl mt-1 opacity-75`}>{crm.notes}</p>}
                      </div>

                      {/* Quick WA Templates */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-gray-200/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Quick WA:</span>
                        <a
                          href={`https://wa.me/${crm.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${crm.clientName}, thank you for visiting ${crm.requirementSummary} with The Leasing Company today. Let us know your thoughts or if you'd like to schedule a second visit!`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 px-2.5 py-1 rounded-lg text-[11px] font-bold transition"
                          title="Post-Visit Follow-Up"
                        >
                          💬 Post-Visit
                        </a>
                        <a
                          href={`https://wa.me/${crm.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${crm.clientName}, we found new matching properties for your requirement (${crm.requirementSummary}) in ${crm.preferredLocation}. Let's review them!`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 px-2.5 py-1 rounded-lg text-[11px] font-bold transition"
                          title="New Matching Option Alert"
                        >
                          ✨ Matching Options
                        </a>
                        <a
                          href={`https://wa.me/${crm.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${crm.clientName}, would you like to schedule a site visit for ${crm.requirementSummary} this week? Let us know your preferred day and time.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 px-2.5 py-1 rounded-lg text-[11px] font-bold transition"
                          title="Schedule Site Visit"
                        >
                          📅 Schedule Visit
                        </a>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-gray-200/20">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setActiveLeadForMatch(crm); setShowMatchModal(true); }}
                            className="bg-orange-500/10 text-[#E96932] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-orange-500/20 transition"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Match Properties ({matchingCount})</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setCallLogLead(crm); setShowCallLogModal(true); }}
                            className={`h-9 px-3 rounded-xl ${darkMode ? 'bg-[#121619] text-gray-200 hover:bg-gray-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} text-xs font-medium flex items-center gap-1.5 transition`}
                          >
                            <Phone className="h-3.5 w-3.5" />
                            <span>Log Call</span>
                          </button>
                          <a
                            href={`https://wa.me/${crm.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(crm.clientName)},%20regarding%20your%20property%20requirement...`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-9 px-3.5 rounded-xl bg-[#25D366] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-[#22bf5b] transition"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>Chat</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: WA PARSER */}
        {activeTab === 'parser' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-orange-500 to-[#E96932] rounded-3xl p-6 text-white shadow-lg space-y-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-6 w-6 text-orange-200 animate-spin" />
                <h2 className="text-lg font-bold">AI WhatsApp Message Parser</h2>
              </div>
              <p className="text-xs text-orange-100 leading-relaxed">
                Paste raw broker WhatsApp messages. Gemini automatically extracts and routes to the correct Google Sheet tab.
              </p>
            </div>

            <div className={`${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-200/80'} rounded-3xl p-5 border shadow-xs space-y-4`}>
              <textarea
                rows={5}
                value={rawWAMessage}
                onChange={(e) => setRawWAMessage(e.target.value)}
                placeholder="Paste broker message here e.g. 'BKC prime office space 4000 sqft FF rent 5 Lacs contact Suresh 9820012345...'"
                className={`w-full rounded-2xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-[#121619] placeholder-gray-400'} p-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#E96932]`}
              />

              <button
                onClick={handleParseWA}
                disabled={isParsingWA}
                className="w-full h-12 bg-[#E96932] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-[#d55825] transition disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isParsingWA ? 'AI Parsing & Routing...' : 'Parse Message with AI'}</span>
              </button>
            </div>

            {parseSuccessMsg && (
              <div className="rounded-2xl bg-emerald-50 p-4 text-xs text-emerald-800 font-medium flex items-center gap-3 border border-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{parseSuccessMsg}</span>
              </div>
            )}

            {parsedItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold px-1">Extracted & Cleaned Cards ({parsedItems.length})</h3>
                {parsedItems.map((item, idx) => {
                  const targetTab = item.category === 'Commercial Inventory' ? 'Commercial Inventory' :
                                    item.category === 'Residential Inventory' ? 'Residential Inventory' : 'CRM';
                  return (
                    <div key={idx} className={`${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-200/80'} rounded-3xl p-5 border shadow-xs space-y-3`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-[#E96932] px-2.5 py-0.5 rounded-full">
                          {item.category} (Tab: {targetTab})
                        </span>
                        <span className="text-xs font-bold">{formatPrice(item.budgetOrPrice || 'Price on Request')}</span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold">{item.title}</h4>
                        <p className="text-xs opacity-75 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-[#E96932]" />
                          <span>{item.location} ({item.propertyType})</span>
                        </p>
                      </div>

                      <div className={`${darkMode ? 'bg-[#121619]' : 'bg-gray-50'} rounded-2xl p-3 text-xs opacity-85 space-y-1`}>
                        <p><span className="font-semibold">Config:</span> {item.bhkOrConfig} | <span className="font-semibold">Furnishing:</span> {item.furnishing}</p>
                        {(item.contactPerson || item.phone) && (
                          <p><span className="font-semibold">Contact:</span> {item.contactPerson || ''} {item.phone ? `(${item.phone})` : ''}</p>
                        )}
                        {item.notes && <p className="text-[11px] mt-1 opacity-75">{item.notes}</p>}
                      </div>

                      <button
                        onClick={() => saveParsedItem(item)}
                        className="w-full h-11 bg-[#121619] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-black transition border border-gray-800"
                      >
                        <Plus className="h-4 w-4 text-[#E96932]" />
                        <span>Save to Sheet (Tab: {targetTab})</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BROKERS */}
        {activeTab === 'brokers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Brokers & Vendors</h2>
                <p className="text-xs opacity-70">Live data from "Brokers & Vendors" tab</p>
              </div>
              <button
                onClick={() => setShowAddBrokerModal(true)}
                className="bg-[#E96932] text-white px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-md hover:bg-[#d55825] transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Broker</span>
              </button>
            </div>

            <div className="space-y-3">
              {brokersList.length === 0 ? (
                <div className={`text-center py-12 ${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-100'} rounded-3xl border p-8`}>
                  <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium opacity-80">No brokers found.</p>
                </div>
              ) : (
                brokersList.map((br) => (
                  <div key={br.id} className={`${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-200/80'} rounded-3xl p-5 border shadow-xs space-y-3`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-[#E96932] px-2.5 py-0.5 rounded-full">
                          {br.category}
                        </span>
                        <h3 className="text-base font-bold mt-1">{br.name}</h3>
                        {br.company && <p className="text-xs opacity-70">{br.company}</p>}
                      </div>
                    </div>
                    {br.notes && <p className={`text-xs italic ${darkMode ? 'bg-[#121619]' : 'bg-gray-50'} p-2.5 rounded-xl opacity-75`}>{br.notes}</p>}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {br.phone && (
                        <a
                          href={`tel:${br.phone}`}
                          className={`h-9 px-3 rounded-xl ${darkMode ? 'bg-[#121619] text-gray-200 hover:bg-gray-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} text-xs font-medium flex items-center gap-1.5 transition`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>Call</span>
                        </a>
                      )}
                      <a
                        href={`https://wa.me/${br.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(br.name)},%20connecting%20from%20The%20Leasing%20Company...`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-3.5 rounded-xl bg-[#25D366] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-[#22bf5b] transition"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: OPENSTREETMAP VIEW */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">Property Location Map (OpenStreetMap)</h2>
              <p className="text-xs opacity-70">Interactive live map view of all inventory properties (Zero Google Maps fees)</p>
            </div>
            <PropertyMap items={inventoryList} />
          </div>
        )}

        {/* TAB 7: ADMIN MANAGEMENT */}
        {activeTab === 'management' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Admin & Team Operations</h2>
                <p className="text-xs opacity-70">Restricted to Super Admin / Admin roles</p>
              </div>
            </div>

            <div className={`flex rounded-2xl ${darkMode ? 'bg-[#1E2228]' : 'bg-gray-200/70'} p-1 overflow-x-auto gap-1`}>
              <button
                onClick={() => setManagementSubTab('tenants')}
                className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${managementSubTab === 'tenants' ? `${darkMode ? 'bg-[#121619] text-white' : 'bg-white text-[#121619]'} shadow-sm` : 'opacity-70'}`}
              >
                Tenants
              </button>
              <button
                onClick={() => setManagementSubTab('reports')}
                className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${managementSubTab === 'reports' ? `${darkMode ? 'bg-[#121619] text-white' : 'bg-white text-[#121619]'} shadow-sm` : 'opacity-70'}`}
              >
                Daily Reports
              </button>
              <button
                onClick={() => setManagementSubTab('calls')}
                className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${managementSubTab === 'calls' ? `${darkMode ? 'bg-[#121619] text-white' : 'bg-white text-[#121619]'} shadow-sm` : 'opacity-70'}`}
              >
                Call Logs
              </button>
              <button
                onClick={() => setManagementSubTab('allocation')}
                className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${managementSubTab === 'allocation' ? `${darkMode ? 'bg-[#121619] text-white' : 'bg-white text-[#121619]'} shadow-sm` : 'opacity-70'}`}
              >
                Allocation History
              </button>
              <button
                onClick={() => setManagementSubTab('approvals')}
                className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${managementSubTab === 'approvals' ? `${darkMode ? 'bg-[#121619] text-white' : 'bg-white text-[#121619]'} shadow-sm` : 'opacity-70'}`}
              >
                Approval Requests ({pendingApprovalsCount})
              </button>
            </div>

            {managementSubTab === 'tenants' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold opacity-90">Active Tenants Directory</h3>
                  <button onClick={() => setShowAddTenantModal(true)} className="bg-[#E96932] text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Tenant
                  </button>
                </div>
                {tenantsList.length === 0 ? (
                  <p className="text-xs opacity-60 py-6">No tenant records found.</p>
                ) : (
                  tenantsList.map(t => (
                    <div key={t.id} className={`${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-200'} rounded-3xl p-4 border shadow-xs space-y-2`}>
                      <div className="flex justify-between">
                        <h4 className="font-bold text-sm">{t.tenantName}</h4>
                        <span className="text-xs font-bold text-[#E96932]">{t.rentAmount}/mo</span>
                      </div>
                      <p className="text-xs opacity-75">Property: <strong>{t.propertyTitle}</strong></p>
                      <p className="text-[11px] opacity-50">Lease: {t.leaseStart} to {t.leaseEnd}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {managementSubTab === 'reports' && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold opacity-90">Daily Executive Reports</h3>
                {dailyReportsList.length === 0 ? (
                  <p className="text-xs opacity-60 py-4">No daily reports recorded.</p>
                ) : (
                  dailyReportsList.map(r => (
                    <div key={r.id} className={`${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-200'} rounded-3xl p-4 border shadow-xs space-y-1`}>
                      <div className="flex justify-between">
                        <h4 className="font-bold text-xs">{r.executiveName}</h4>
                        <span className="text-[10px] opacity-50">{r.date}</span>
                      </div>
                      <div className="flex gap-4 text-xs opacity-80 pt-1">
                        <span>Calls: <strong>{r.callsMade}</strong></span>
                        <span>Visits: <strong>{r.siteVisits}</strong></span>
                        <span>Deals: <strong className="text-emerald-500">{r.dealsClosed}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {managementSubTab === 'calls' && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold opacity-90">Team Call Logs</h3>
                {callLogsList.length === 0 ? (
                  <p className="text-xs opacity-60 py-4">No call logs recorded.</p>
                ) : (
                  callLogsList.map(c => (
                    <div key={c.id} className={`${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-200'} rounded-3xl p-4 border shadow-xs space-y-1`}>
                      <div className="flex justify-between">
                        <h4 className="font-bold text-xs">{c.callerName} → {c.clientName}</h4>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{c.outcome}</span>
                      </div>
                      <p className="text-xs opacity-75">{c.notes}</p>
                      <span className="text-[10px] opacity-50">{c.timestamp} · Duration: {c.duration}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {managementSubTab === 'allocation' && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold opacity-90">Property Allocation History</h3>
                {allocationHistoryList.length === 0 ? (
                  <p className="text-xs opacity-60 py-4">No allocation history recorded.</p>
                ) : (
                  allocationHistoryList.map(a => (
                    <div key={a.id} className={`${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-200'} rounded-3xl p-4 border shadow-xs flex justify-between items-center`}>
                      <div>
                        <h4 className="font-bold text-xs">{a.propertyTitle}</h4>
                        <p className="text-xs opacity-70">Assigned to: {a.executiveName}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#E96932]">{a.assignedDate}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {managementSubTab === 'approvals' && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold opacity-90">Pending Approval Requests</h3>
                {approvalRequestsList.length === 0 ? (
                  <p className="text-xs opacity-60 py-4">No approval requests pending.</p>
                ) : (
                  approvalRequestsList.map(app => (
                    <div key={app.id} className={`${darkMode ? 'bg-[#1E2228] border-gray-800' : 'bg-white border-gray-200'} rounded-3xl p-4 border shadow-xs space-y-2`}>
                      <div className="flex justify-between">
                        <h4 className="font-bold text-xs">{app.requestType}</h4>
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{app.status}</span>
                      </div>
                      <p className="text-xs opacity-75">By: {app.requestedBy} · {app.date}</p>
                      <p className={`text-xs ${darkMode ? 'bg-[#121619]' : 'bg-gray-50'} p-2 rounded-xl opacity-85`}>{app.details}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* CLUTTER-FREE 6-TAB BOTTOM NAVIGATION */}
      <nav aria-label="Bottom Navigation" className={`fixed bottom-0 left-0 right-0 z-40 ${darkMode ? 'bg-[#1E2228]/95 border-gray-800' : 'bg-white/95 border-gray-200/80'} backdrop-blur-lg border-t px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl`}>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
            activeTab === 'inventory' ? 'text-[#E96932]' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <Building2 className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Inventory</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
            activeTab === 'projects' ? 'text-[#E96932]' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <Briefcase className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Projects</span>
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
            activeTab === 'crm' ? 'text-[#E96932]' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] font-semibold">CRM</span>
        </button>

        <button
          onClick={() => setActiveTab('parser')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
            activeTab === 'parser' ? 'text-[#E96932]' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-[10px] font-semibold">WA Parser</span>
        </button>

        <button
          onClick={() => setActiveTab('brokers')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
            activeTab === 'brokers' ? 'text-[#E96932]' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <UserCheck className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Brokers</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
            activeTab === 'map' ? 'text-[#E96932]' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <MapIcon className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Map</span>
        </button>
      </nav>

      {/* MORE (☰) MENU DRAWER */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/50 backdrop-blur-xs">
          <div className={`w-72 h-full ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} shadow-2xl p-6 flex flex-col justify-between space-y-6 animate-in slide-in-from-left duration-200`}>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-gray-200/20">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-[#E96932] flex items-center justify-center text-white font-bold text-xs">
                    TLC
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">More Modules & Tools</h3>
                    <p className="text-[10px] opacity-70">Team Operations</p>
                  </div>
                </div>
                <button onClick={() => setShowMoreMenu(false)} className="p-2 opacity-70 hover:opacity-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => { setShowAdminDashboard(true); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold hover:bg-orange-500/10 hover:text-[#E96932] transition"
                >
                  <ShieldCheck className="h-4 w-4 text-[#E96932]" />
                  <span>Executive Dashboard</span>
                </button>

                <button
                  onClick={() => { setShowCalculatorModal(true); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold hover:bg-orange-500/10 hover:text-[#E96932] transition"
                >
                  <Calculator className="h-4 w-4 text-[#E96932]" />
                  <span>ROI & Loan EMI Calculator</span>
                </button>

                <button
                  onClick={() => { setActiveTab('management'); setManagementSubTab('tenants'); setShowMoreMenu(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'management' && managementSubTab === 'tenants' ? 'bg-[#E96932] text-white' : 'hover:opacity-75'}`}
                >
                  <Users className="h-4 w-4" />
                  <span>Tenants Directory</span>
                </button>

                <button
                  onClick={() => { setActiveTab('management'); setManagementSubTab('reports'); setShowMoreMenu(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'management' && managementSubTab === 'reports' ? 'bg-[#E96932] text-white' : 'hover:opacity-75'}`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Daily Reports</span>
                </button>

                <button
                  onClick={() => { setActiveTab('management'); setManagementSubTab('calls'); setShowMoreMenu(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'management' && managementSubTab === 'calls' ? 'bg-[#E96932] text-white' : 'hover:opacity-75'}`}
                >
                  <Phone className="h-4 w-4" />
                  <span>Call Logs</span>
                </button>

                <button
                  onClick={() => { setActiveTab('management'); setManagementSubTab('allocation'); setShowMoreMenu(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'management' && managementSubTab === 'allocation' ? 'bg-[#E96932] text-white' : 'hover:opacity-75'}`}
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Allocation History</span>
                </button>

                <button
                  onClick={() => { setActiveTab('management'); setManagementSubTab('approvals'); setShowMoreMenu(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition ${activeTab === 'management' && managementSubTab === 'approvals' ? 'bg-[#E96932] text-white' : 'hover:opacity-75'}`}
                >
                  <span className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Approval Requests</span>
                  </span>
                  {pendingApprovalsCount > 0 && (
                    <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px]">{pendingApprovalsCount}</span>
                  )}
                </button>
              </div>
            </div>

            <div className="border-t pt-4 border-gray-200/20 space-y-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold ${darkMode ? 'bg-[#121619]' : 'bg-gray-100'} transition`}
              >
                <span>Theme Mode</span>
                <span className="flex items-center gap-1.5">
                  {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-gray-700" />}
                  {darkMode ? 'Dark' : 'Light'}
                </span>
              </button>

              <div className="text-[10px] text-center opacity-50">
                The Leasing Company (TLC-2) · PWA
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowMoreMenu(false)} />
        </div>
      )}

      {/* ROI & LOAN EMI CALCULATOR MODAL */}
      {showCalculatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className={`w-full max-w-md ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-3xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#E96932]" />
                <span>ROI & Loan EMI Calculator</span>
              </h3>
              <button onClick={() => setShowCalculatorModal(false)} className="p-2 opacity-75 hover:opacity-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 opacity-80">Loan / Property Principal (₹)</label>
                <input
                  type="number"
                  value={calcPrincipal}
                  onChange={(e) => setCalcPrincipal(e.target.value)}
                  className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 opacity-80">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcInterest}
                    onChange={(e) => setCalcInterest(e.target.value)}
                    className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 opacity-80">Tenure (Years)</label>
                  <input
                    type="number"
                    value={calcTenureYears}
                    onChange={(e) => setCalcTenureYears(e.target.value)}
                    className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>

              {/* Calculation Results */}
              {(() => {
                const P = parseFloat(calcPrincipal) || 0;
                const r = (parseFloat(calcInterest) || 0) / 12 / 100;
                const n = (parseFloat(calcTenureYears) || 0) * 12;
                let emi = 0;
                if (P > 0 && r > 0 && n > 0) {
                  emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                }
                const totalPayment = emi * n;
                const totalInterest = totalPayment - P;

                return (
                  <div className={`${darkMode ? 'bg-[#121619]' : 'bg-orange-500/5'} p-4 rounded-2xl border border-orange-500/20 space-y-2`}>
                    <div className="flex justify-between">
                      <span className="opacity-75">Monthly EMI:</span>
                      <strong className="text-[#E96932] text-sm">₹{Math.round(emi).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">Total Interest Payable:</span>
                      <strong>₹{Math.round(totalInterest).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex justify-between border-t border-gray-500/20 pt-2">
                      <span className="opacity-75">Total Amount Payable:</span>
                      <strong>₹{Math.round(totalPayment).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                );
              })()}

              {/* Brokerage Estimator */}
              <div className="border-t pt-4 border-gray-500/20 space-y-2">
                <h4 className="font-bold text-xs flex items-center gap-1.5 text-[#E96932]">
                  <TrendingUp className="h-4 w-4" /> Brokerage Estimator
                </h4>
                {(() => {
                  const val = parseFloat(calcPrincipal) || 0;
                  const oneMonthRentComm = val / 12;
                  const saleComm1Pct = val * 0.01;
                  const saleComm2Pct = val * 0.02;
                  return (
                    <div className={`${darkMode ? 'bg-[#121619]' : 'bg-gray-50'} p-3 rounded-2xl text-[11px] space-y-1`}>
                      <div className="flex justify-between">
                        <span>Est. Lease Commission (1 Mo):</span>
                        <strong>₹{Math.round(oneMonthRentComm).toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Est. Sale Commission (1% - 2%):</span>
                        <strong>₹{Math.round(saleComm1Pct).toLocaleString('en-IN')} - ₹{Math.round(saleComm2Pct).toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="flex justify-between text-[10px] opacity-70 border-t pt-1">
                        <span>Co-brokerage Split (50:50):</span>
                        <span>₹{Math.round(saleComm1Pct / 2).toLocaleString('en-IN')} each</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT-SAFE PDF FLYER MODAL */}
      {showFlyerModal && activeFlyerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-lg ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between border-b pb-3 print:hidden">
              <h3 className="text-base font-bold">Client-Safe Property Flyer</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-[#E96932] text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print / PDF
                </button>
                <button onClick={() => setShowFlyerModal(false)} className="p-2 opacity-75 hover:opacity-100"><X className="h-5 w-5" /></button>
              </div>
            </div>

            {/* Branded Printable Flyer Card */}
            <div className="bg-white text-[#121619] rounded-3xl p-6 border-2 border-[#E96932]/30 shadow-lg space-y-4">
              <div className="flex justify-between items-center border-b pb-3 border-gray-200">
                <div>
                  <h2 className="text-lg font-black text-[#E96932] uppercase tracking-wide">The Leasing Company</h2>
                  <p className="text-[11px] text-gray-500">Commercial & Residential Real Estate Specialists</p>
                </div>
                <span className="text-xs font-bold bg-[#E96932]/10 text-[#E96932] px-3 py-1 rounded-full uppercase">
                  {activeFlyerItem.transactionType}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                  {activeFlyerItem.propertyType}
                </span>
                <h1 className="text-xl font-bold mt-1 text-[#121619]">{activeFlyerItem.title}</h1>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-[#E96932]" />
                  <span>{activeFlyerItem.locationLine.replace(/\s*\(Unit:.*?\)/g, '')}</span>
                </p>
              </div>

              <div className="bg-[#F8F7F4] rounded-2xl p-4 border border-gray-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Asking Price / Rent</span>
                  <span className="text-lg font-black text-[#E96932]">{activeFlyerItem.priceBadge}</span>
                </div>
                {activeFlyerItem.yieldPercent && (
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Expected Yield</span>
                    <span className="text-sm font-bold text-emerald-600">{activeFlyerItem.yieldPercent}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                {activeFlyerItem.carpetSqft && <div><strong>Carpet Area:</strong> {activeFlyerItem.carpetSqft} sq.ft</div>}
                {activeFlyerItem.builtUpSqft && <div><strong>Built-up Area:</strong> {activeFlyerItem.builtUpSqft} sq.ft</div>}
                {activeFlyerItem.ratePerSqft && <div><strong>Rate:</strong> {activeFlyerItem.ratePerSqft}</div>}
                {activeFlyerItem.furnishing && <div><strong>Furnishing:</strong> {activeFlyerItem.furnishing}</div>}
                {activeFlyerItem.possession && <div><strong>Possession:</strong> {activeFlyerItem.possession}</div>}
              </div>

              {activeFlyerItem.notes && (
                <div className="text-xs text-gray-700 space-y-1">
                  <strong>Property Highlights:</strong>
                  <p className="bg-gray-50 p-3 rounded-xl italic text-gray-600">{activeFlyerItem.notes}</p>
                </div>
              )}

              <div className="border-t pt-3 border-gray-200 flex justify-between items-center text-[11px] text-gray-500">
                <span>Contact TLC Executive: {user?.name || 'Leasing Team'}</span>
                <span>📞 {user?.loginId || '+91 ...'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DUPLICATE WARNING MODAL */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className={`w-full max-w-md ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-3xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold">Possible Duplicate Found</h3>
            </div>
            <p className="text-xs opacity-80">
              A property with the title <strong>"{duplicateWarning.newTitle}"</strong> already exists in your inventory database.
            </p>
            <div className={`${darkMode ? 'bg-[#121619]' : 'bg-gray-50'} p-3 rounded-2xl text-xs space-y-1`}>
              <p><strong>Existing Property:</strong> {duplicateWarning.existing.title}</p>
              <p><strong>Location:</strong> {duplicateWarning.existing.locationLine}</p>
              <p><strong>Price:</strong> {duplicateWarning.existing.priceBadge}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDuplicateWarning(null)}
                className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Cancel / Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART MATCHER MODAL */}
      {showMatchModal && activeLeadForMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className={`w-full max-w-lg ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto`}>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold">Smart Matching Properties</h3>
                <p className="text-xs opacity-75">For lead: {activeLeadForMatch.clientName} ({activeLeadForMatch.preferredLocation})</p>
              </div>
              <button onClick={() => setShowMatchModal(false)} className="p-2 opacity-75 hover:opacity-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3">
              {getMatchingPropertiesForLead(activeLeadForMatch).length === 0 ? (
                <div className="text-center py-8 opacity-60 text-xs">No matching properties found for this lead's criteria.</div>
              ) : (
                getMatchingPropertiesForLead(activeLeadForMatch).map(prop => (
                  <div key={prop.id} className={`${darkMode ? 'bg-[#121619]' : 'bg-gray-50'} rounded-2xl p-4 border border-gray-200/20 space-y-2`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] bg-orange-100 text-[#E96932] px-2 py-0.5 rounded-full font-bold">{prop.propertyType}</span>
                        <h4 className="font-bold text-sm mt-1">{prop.title}</h4>
                      </div>
                      <span className="text-xs font-bold text-[#E96932]">{prop.priceBadge}</span>
                    </div>
                    <p className="text-xs opacity-75">📍 {prop.locationLine}</p>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          const text = `Hi ${activeLeadForMatch.clientName}, matching property found: *${prop.title}* at ${prop.locationLine}. Price: ${prop.priceBadge}. Let me know if you would like to schedule a site visit!`;
                          window.open(`https://wa.me/${activeLeadForMatch.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="bg-[#25D366] text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <Share2 className="h-3.5 w-3.5" /> Share Match on WA
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK CALL LOG / VISIT MODAL */}
      {showCallLogModal && callLogLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className={`w-full max-w-md ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-3xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold">Log Call / Visit: {callLogLead.clientName}</h3>
              <button onClick={() => setShowCallLogModal(false)} className="p-2 opacity-75 hover:opacity-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleLogCallSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 opacity-80">Outcome</label>
                <select value={callOutcome} onChange={(e) => setCallOutcome(e.target.value)} className={`w-full p-2.5 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                  <option value="Connected">Connected</option>
                  <option value="Site Visit">Site Visit Scheduled / Completed</option>
                  <option value="Deal Closed">Deal Closed</option>
                  <option value="Not Responding">Not Responding</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold opacity-80">Notes / Remarks</label>
                  <button
                    type="button"
                    onClick={() => startSpeechRecognition((text) => setCallNotes(prev => (prev ? prev + ' ' + text : text)))}
                    className="text-xs bg-orange-500/10 text-[#E96932] hover:bg-orange-500/20 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition"
                  >
                    <span>🎤 Dictate</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Client discussed requirement details..."
                  className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <button type="submit" className="w-full h-11 bg-[#E96932] text-white rounded-xl font-semibold shadow-md">
                Save Call Log & Update Daily Report
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALS (Add Property, Add Project, Add CRM, Add Tenant, Add Broker) */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className={`w-full sm:max-w-lg ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add New Property</h3>
              <button onClick={() => setShowAddInventoryModal(false)} className="text-gray-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddInventorySubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold opacity-80">Type</label>
                  <select
                    value={newInv.type}
                    onChange={(e: any) => setNewInv({ ...newInv, type: e.target.value })}
                    className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold opacity-80">Property Type</label>
                  <input
                    type="text"
                    value={newInv.propertyType}
                    onChange={(e) => setNewInv({ ...newInv, propertyType: e.target.value })}
                    placeholder="Office Space / 2 BHK"
                    className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold opacity-80">Project / Building</label>
                <input
                  type="text"
                  required
                  value={newInv.title}
                  onChange={(e) => setNewInv({ ...newInv, title: e.target.value })}
                  placeholder="e.g., EON IT Park"
                  className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold opacity-80">Location / Micro Market</label>
                <input
                  type="text"
                  required
                  value={newInv.location}
                  onChange={(e) => setNewInv({ ...newInv, location: e.target.value })}
                  placeholder="Kharadi, Pune"
                  className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold opacity-80">Price / Rent</label>
                  <input
                    type="text"
                    value={newInv.budgetOrPrice}
                    onChange={(e) => setNewInv({ ...newInv, budgetOrPrice: e.target.value })}
                    placeholder="₹1,50,000/mo"
                    className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold opacity-80">Furnishing</label>
                  <select
                    value={newInv.furnishing}
                    onChange={(e) => setNewInv({ ...newInv, furnishing: e.target.value })}
                    className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                  >
                    <option value="Fully-Furnished">Fully-Furnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold opacity-80">Owner Name</label>
                  <input
                    type="text"
                    value={newInv.contactPerson}
                    onChange={(e) => setNewInv({ ...newInv, contactPerson: e.target.value })}
                    placeholder="Owner Name"
                    className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold opacity-80">Phone</label>
                  <input
                    type="text"
                    value={newInv.phone}
                    onChange={(e) => setNewInv({ ...newInv, phone: e.target.value })}
                    placeholder="+91..."
                    className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold opacity-80">Notes</label>
                <textarea
                  rows={2}
                  value={newInv.notes}
                  onChange={(e) => setNewInv({ ...newInv, notes: e.target.value })}
                  placeholder="Additional remarks..."
                  className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                />
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-[#E96932] text-white rounded-xl text-xs font-semibold shadow-md hover:bg-[#d55825] transition"
              >
                Save Property
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className={`w-full sm:max-w-lg ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Project</h3>
              <button onClick={() => setShowAddProjectModal(false)} className="text-gray-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddProjectSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold opacity-80">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Project Name"
                  className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold opacity-80">Type</label>
                  <select
                    value={newProject.type}
                    onChange={(e: any) => setNewProject({ ...newProject, type: e.target.value })}
                    className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold opacity-80">Developer</label>
                  <input
                    type="text"
                    value={newProject.developer}
                    onChange={(e) => setNewProject({ ...newProject, developer: e.target.value })}
                    placeholder="Developer"
                    className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold opacity-80">Location</label>
                  <input
                    type="text"
                    value={newProject.location}
                    onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                    placeholder="Location"
                    className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold opacity-80">Price Range</label>
                  <input
                    type="text"
                    value={newProject.priceRange}
                    onChange={(e) => setNewProject({ ...newProject, priceRange: e.target.value })}
                    placeholder="₹50L - ₹2Cr"
                    className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                  />
                </div>
              </div>
              <button type="submit" className="w-full h-12 bg-[#E96932] text-white rounded-xl text-xs font-semibold shadow-md">
                Save Project
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add CRM Modal */}
      {showAddCRMModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className={`w-full sm:max-w-lg ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Lead</h3>
              <button onClick={() => setShowAddCRMModal(false)} className="text-gray-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddCRMSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold opacity-80">Client Name</label>
                <input
                  type="text"
                  required
                  value={newCrm.clientName}
                  onChange={(e) => setNewCrm({ ...newCrm, clientName: e.target.value })}
                  placeholder="Client Name"
                  className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold opacity-80">Phone</label>
                <input
                  type="text"
                  value={newCrm.phone}
                  onChange={(e) => setNewCrm({ ...newCrm, phone: e.target.value })}
                  placeholder="+91..."
                  className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold opacity-80">Requirement Summary</label>
                <input
                  type="text"
                  required
                  value={newCrm.requirementSummary}
                  onChange={(e) => setNewCrm({ ...newCrm, requirementSummary: e.target.value })}
                  placeholder="3000 sqft office space"
                  className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                />
              </div>
              <button type="submit" className="w-full h-12 bg-[#E96932] text-white rounded-xl text-xs font-semibold shadow-md">
                Save Lead
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Tenant Modal */}
      {showAddTenantModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className={`w-full sm:max-w-lg ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Tenant</h3>
              <button onClick={() => setShowAddTenantModal(false)} className="text-gray-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddTenantSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold opacity-80">Tenant Name</label>
                <input
                  type="text"
                  required
                  value={newTenant.tenantName}
                  onChange={(e) => setNewTenant({ ...newTenant, tenantName: e.target.value })}
                  placeholder="Tenant Name"
                  className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold opacity-80">Property Title</label>
                <input
                  type="text"
                  required
                  value={newTenant.propertyTitle}
                  onChange={(e) => setNewTenant({ ...newTenant, propertyTitle: e.target.value })}
                  placeholder="Property Title"
                  className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold opacity-80">Rent Amount</label>
                  <input
                    type="text"
                    value={newTenant.rentAmount}
                    onChange={(e) => setNewTenant({ ...newTenant, rentAmount: e.target.value })}
                    placeholder="₹1,00,000/mo"
                    className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold opacity-80">Phone</label>
                  <input
                    type="text"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                    placeholder="+91..."
                    className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                  />
                </div>
              </div>
              <button type="submit" className="w-full h-12 bg-[#E96932] text-white rounded-xl text-xs font-semibold shadow-md">
                Save Tenant
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Broker Modal */}
      {showAddBrokerModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className={`w-full sm:max-w-lg ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Broker</h3>
              <button onClick={() => setShowAddBrokerModal(false)} className="text-gray-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddBrokerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold opacity-80">Broker Name</label>
                <input
                  type="text"
                  required
                  value={newBroker.name}
                  onChange={(e) => setNewBroker({ ...newBroker, name: e.target.value })}
                  placeholder="Full Name"
                  className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold opacity-80">Phone</label>
                <input
                  type="text"
                  required
                  value={newBroker.phone}
                  onChange={(e) => setNewBroker({ ...newBroker, phone: e.target.value })}
                  placeholder="+91..."
                  className={`mt-1 w-full rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'border-gray-300 text-gray-900'} p-3 text-xs`}
                />
              </div>
              <button type="submit" className="w-full h-12 bg-[#E96932] text-white rounded-xl text-xs font-semibold shadow-md">
                Save Broker
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUPER ADMIN EXECUTIVE DASHBOARD MODAL */}
      {showAdminDashboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-lg ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between border-b pb-3 border-gray-200/20">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#E96932]" />
                <span>Super Admin Executive Dashboard</span>
              </h3>
              <button onClick={() => setShowAdminDashboard(false)} className="p-2 opacity-75 hover:opacity-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`${darkMode ? 'bg-[#121619]' : 'bg-orange-500/5'} p-4 rounded-2xl border border-orange-500/20 space-y-1`}>
                <span className="opacity-70 uppercase tracking-wider text-[10px]">Active Inventory</span>
                <p className="text-xl font-black text-[#E96932]">{inventoryList.length}</p>
                <p className="text-[10px] opacity-60">Commercial & Residential</p>
              </div>

              <div className={`${darkMode ? 'bg-[#121619]' : 'bg-blue-500/5'} p-4 rounded-2xl border border-blue-500/20 space-y-1`}>
                <span className="opacity-70 uppercase tracking-wider text-[10px]">CRM Leads</span>
                <p className="text-xl font-black text-blue-600">{crmList.length}</p>
                <p className="text-[10px] opacity-60">Active Requirements & Follow-ups</p>
              </div>

              <div className={`${darkMode ? 'bg-[#121619]' : 'bg-emerald-500/5'} p-4 rounded-2xl border border-emerald-500/20 space-y-1`}>
                <span className="opacity-70 uppercase tracking-wider text-[10px]">Today's Follow-Ups</span>
                <p className="text-xl font-black text-emerald-600">
                  {crmList.filter(c => c.nextFollowUp === new Date().toISOString().split('T')[0]).length}
                </p>
                <p className="text-[10px] opacity-60">Due today</p>
              </div>

              <div className={`${darkMode ? 'bg-[#121619]' : 'bg-purple-500/5'} p-4 rounded-2xl border border-purple-500/20 space-y-1`}>
                <span className="opacity-70 uppercase tracking-wider text-[10px]">Daily Reports / Calls</span>
                <p className="text-xl font-black text-purple-600">{dailyReportsList.length} / {callLogsList.length}</p>
                <p className="text-[10px] opacity-60">Total logs recorded</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold opacity-90">Team Activity Summary</h4>
              <div className={`${darkMode ? 'bg-[#121619]' : 'bg-gray-50'} rounded-2xl p-4 text-xs space-y-2`}>
                {dailyReportsList.slice(0, 5).map((rep, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-500/10 pb-1.5">
                    <div>
                      <strong>{rep.executiveName}</strong>
                      <span className="opacity-60 text-[11px] block">{rep.notes}</span>
                    </div>
                    <span className="text-[10px] opacity-50">{rep.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE SITE VISIT MODAL */}
      {showScheduleVisitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-md ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-3xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#E96932]" />
                <span>Schedule Site Visit</span>
              </h3>
              <button onClick={() => setShowScheduleVisitModal(false)} className="p-2 opacity-75 hover:opacity-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleScheduleVisitSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 opacity-80">Property / Project</label>
                <input
                  type="text"
                  required
                  value={visitTargetTitle}
                  onChange={(e) => setVisitTargetTitle(e.target.value)}
                  placeholder="e.g., EON IT Park Office"
                  className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 opacity-80">Client Name</label>
                <input
                  type="text"
                  required
                  value={visitClientName}
                  onChange={(e) => setVisitClientName(e.target.value)}
                  placeholder="Client Full Name"
                  className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 opacity-80">Date</label>
                  <input
                    type="date"
                    required
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 opacity-80">Time</label>
                  <input
                    type="text"
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    placeholder="11:00 AM"
                    className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 opacity-80">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Meet at lobby..."
                  className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-[#121619] border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <button type="submit" className="w-full h-11 bg-[#E96932] text-white rounded-xl font-semibold shadow-md">
                Confirm & Schedule Visit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS MODAL */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-md ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#E96932]" />
                <span>Notifications & Alerts</span>
              </h3>
              <button onClick={() => setShowNotificationsModal(false)} className="p-2 opacity-75 hover:opacity-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold opacity-80 uppercase tracking-wider text-[11px]">Today's & Overdue Follow-ups ({todayFollowUpsAlerts.length})</h4>
                {todayFollowUpsAlerts.length === 0 ? (
                  <p className="opacity-50">No follow-ups due today.</p>
                ) : (
                  todayFollowUpsAlerts.map(c => (
                    <div key={c.id} className={`${darkMode ? 'bg-[#121619]' : 'bg-gray-50'} p-3 rounded-2xl space-y-1 border border-orange-500/20`}>
                      <div className="flex justify-between">
                        <strong>{c.clientName}</strong>
                        <span className="text-[#E96932] font-semibold">{c.nextFollowUp || 'Today'}</span>
                      </div>
                      <p className="opacity-75">{c.requirementSummary}</p>
                    </div>
                  ))
                )}
              </div>

              {isAdmin && pendingApprovalsAlerts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-500/20">
                  <h4 className="font-bold opacity-80 uppercase tracking-wider text-[11px]">Pending Approvals ({pendingApprovalsAlerts.length})</h4>
                  {pendingApprovalsAlerts.map(app => (
                    <div key={app.id} className={`${darkMode ? 'bg-[#121619]' : 'bg-amber-50'} p-3 rounded-2xl space-y-1 border border-amber-500/20`}>
                      <div className="flex justify-between">
                        <strong>{app.requestType}</strong>
                        <span className="text-amber-600">{app.requestedBy}</span>
                      </div>
                      <p className="opacity-75">{app.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE PROPERTY COMPARISON MODAL */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-4xl ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Columns className="h-5 w-5 text-[#E96932]" />
                <span>Side-by-Side Property Comparison ({selectedIds.length})</span>
              </h3>
              <button onClick={() => setShowComparisonModal(false)} className="p-2 opacity-75 hover:opacity-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className={`${darkMode ? 'bg-[#121619]' : 'bg-gray-100'} border-b border-gray-500/20`}>
                    <th className="p-3 font-bold">Feature</th>
                    {selectedIds.map(id => {
                      const item = inventoryList.find(i => i.id === id);
                      return <th key={id} className="p-3 font-bold text-[#E96932]">{item?.title || 'Property'}</th>;
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-500/10">
                  <tr>
                    <td className="p-3 font-semibold opacity-70">Location / Micro Market</td>
                    {selectedIds.map(id => {
                      const item = inventoryList.find(i => i.id === id);
                      return <td key={id} className="p-3">{item?.locationLine.replace(/\s*\(Unit:.*?\)/g, '')}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold opacity-70">Property Type</td>
                    {selectedIds.map(id => {
                      const item = inventoryList.find(i => i.id === id);
                      return <td key={id} className="p-3">{item?.propertyType}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold opacity-70">Carpet SqFt</td>
                    {selectedIds.map(id => {
                      const item = inventoryList.find(i => i.id === id);
                      return <td key={id} className="p-3">{item?.carpetSqft || 'N/A'}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold opacity-70">Built-up / Est. Built-up</td>
                    {selectedIds.map(id => {
                      const item = inventoryList.find(i => i.id === id);
                      const estBuilt = item?.builtUpSqft || (item?.carpetSqft ? `${Math.round(parseFloat(item.carpetSqft.replace(/,/g, '')) * 1.45)} sq.ft` : 'N/A');
                      return <td key={id} className="p-3">{estBuilt}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold opacity-70">Rate per SqFt</td>
                    {selectedIds.map(id => {
                      const item = inventoryList.find(i => i.id === id);
                      return <td key={id} className="p-3 font-bold text-[#E96932]">{item?.ratePerSqft || 'N/A'}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold opacity-70">Price / Rent</td>
                    {selectedIds.map(id => {
                      const item = inventoryList.find(i => i.id === id);
                      return <td key={id} className="p-3 font-black">{item?.priceBadge}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold opacity-70">Deposit</td>
                    {selectedIds.map(id => {
                      const item = inventoryList.find(i => i.id === id);
                      return <td key={id} className="p-3">{item?.deposit}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold opacity-70">Furnishing</td>
                    {selectedIds.map(id => {
                      const item = inventoryList.find(i => i.id === id);
                      return <td key={id} className="p-3">{item?.furnishing}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold opacity-70">Parking</td>
                    {selectedIds.map(id => {
                      const item = inventoryList.find(i => i.id === id);
                      return <td key={id} className="p-3">{item?.parking}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold opacity-70">Possession</td>
                    {selectedIds.map(id => {
                      const item = inventoryList.find(i => i.id === id);
                      return <td key={id} className="p-3">{item?.possession || 'Immediate'}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  const items = inventoryList.filter(i => selectedIds.includes(i.id));
                  let msg = `📊 *PROPERTY COMPARISON* - The Leasing Company\n\n`;
                  items.forEach((it, idx) => {
                    msg += `*${idx + 1}. ${it.title.toUpperCase()}*\n`;
                    msg += `📍 Location: ${it.locationLine.replace(/\s*\(Unit:.*?\)/g, '')}\n`;
                    msg += `🏷️ Price: ${it.priceBadge} | Rate: ${it.ratePerSqft}\n`;
                    msg += `🛋️ Furnishing: ${it.furnishing} | Parking: ${it.parking}\n\n`;
                  });
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="bg-[#25D366] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm hover:bg-[#22bf5b] transition"
              >
                <Share2 className="h-4 w-4" /> Share Comparison on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEAL FINANCIALS MODAL */}
      {showDealFinancialsModal && activeDealFinancialsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-md ${darkMode ? 'bg-[#1E2228] text-white' : 'bg-white text-[#121619]'} rounded-3xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#E96932]" />
                <span>Deal Financials Breakdown</span>
              </h3>
              <button onClick={() => setShowDealFinancialsModal(false)} className="p-2 opacity-75 hover:opacity-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-1">
                <strong>{activeDealFinancialsItem.title}</strong>
                <p className="opacity-75">{activeDealFinancialsItem.locationLine}</p>
              </div>

              <div className={`${darkMode ? 'bg-[#121619]' : 'bg-gray-50'} p-4 rounded-2xl space-y-2`}>
                <div className="flex justify-between">
                  <span className="opacity-75">Carpet Area:</span>
                  <strong>{activeDealFinancialsItem.carpetSqft || 'N/A'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Built-up / Est. Built-up:</span>
                  <strong>{activeDealFinancialsItem.builtUpSqft || (activeDealFinancialsItem.carpetSqft ? `${Math.round(parseFloat(activeDealFinancialsItem.carpetSqft.replace(/,/g, '')) * 1.45)} sq.ft (Est. 45% loading)` : 'N/A')}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Rate per SqFt:</span>
                  <strong className="text-[#E96932]">{activeDealFinancialsItem.ratePerSqft}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Security Deposit:</span>
                  <strong>{activeDealFinancialsItem.deposit}</strong>
                </div>
                {activeDealFinancialsItem.yieldPercent && (
                  <div className="flex justify-between border-t border-gray-500/20 pt-2">
                    <span className="opacity-75">Gross Yield %:</span>
                    <strong className="text-emerald-600">{activeDealFinancialsItem.yieldPercent}</strong>
                  </div>
                )}
              </div>

              {activeDealFinancialsItem.rawPrice > 0 && activeDealFinancialsItem.transactionType.toLowerCase().includes('lease') && (
                <div className={`${darkMode ? 'bg-[#121619]' : 'bg-gray-50'} p-4 rounded-2xl space-y-2`}>
                  <h4 className="font-bold text-[#E96932]">3-Year Rent Projection (5% Annual Escalation)</h4>
                  {(() => {
                    const yr1 = activeDealFinancialsItem.rawPrice * 12;
                    const yr2 = yr1 * 1.05;
                    const yr3 = yr2 * 1.05;
                    return (
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between"><span>Year 1 Annual Rent:</span><strong>₹{Math.round(yr1).toLocaleString('en-IN')}</strong></div>
                        <div className="flex justify-between"><span>Year 2 Annual Rent (5% +):</span><strong>₹{Math.round(yr2).toLocaleString('en-IN')}</strong></div>
                        <div className="flex justify-between"><span>Year 3 Annual Rent (5% +):</span><strong>₹{Math.round(yr3).toLocaleString('en-IN')}</strong></div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

