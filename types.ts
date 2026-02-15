export interface GameStats {
  stress: number;      
  reputation: number;  
  performance: number; 
  day: number;
}

export type AppId = 'minwon24' | 'excel' | 'messenger' | 'browser' | 'mail' | 'notepad' | 'music' | 'calculator' | 'files' | 'system';

export type DocType = 
  | 'resident_deungbon' 
  | 'resident_chobon'   
  | 'family_relation'   
  | 'family_relation_detail'
  | 'basic_cert'        
  | 'marriage_cert'     
  | 'seal_cert'         
  | 'land_reg'          
  | 'building_reg'      
  | 'tax_local'         
  | 'driver_history'    
  | 'immigration_log'   
  | 'school_univ'       
  | 'school_high'       
  | 'school_middle'     
  | 'school_elem'       
  | 'income_cert'       
  | 'pension_cert'      
  | 'vaccine_cert'      
  | 'health_insurance'  
  | 'none';

export type MissionType = 'issue' | 'excel';
export type DeliveryMethod = 'print' | 'electronic_wallet' | 'pdf' | 'fax';

export interface HistoryRecord {
  date: string;
  category: string; // e.g. '출국', '재산세', '화이자'
  detail: string;   // e.g. '인천공항', '150,000원', '1차'
}

// Detailed profile needed for the form validation
export interface CitizenProfile {
  // Common
  name: string; 
  missionType: MissionType; 

  // For Document Issuance ('issue')
  rrinFront?: string; 
  rrinBack?: string;  
  address?: string;   
  addressDetail?: string; 
  addressOld?: string;
  baseAddress?: string; 
  phoneNumber?: string; 
  copies?: number;      
  targetName?: string; 
  relationship?: string; 
  detailOption?: string; 
  
  // New Realistic Options
  certificateVariant?: 'general' | 'detailed'; // 일반 / 상세
  rrinDisclosure?: 'masked' | 'unmasked';      // 비공개 / 완전공개
  
  // New Fields for Enhanced Realism
  purposeDetail?: string; 
  periodStart?: string;   
  periodEnd?: string;     
  deliveryMethod?: DeliveryMethod; // New: 수령 방법

  requestType: DocType; 
  purpose?: string;   
  
  // For Excel Work ('excel')
  excelTaskDescription?: string; 
  excelData?: { colA: string; colB: string }[]; 

  // For List Selection Docs (Immigration, Tax, Vaccine)
  historyRecords?: HistoryRecord[];

  dialogueHistory: ChatMessage[];
}

export interface PrintedDoc {
  docTypeKey: DocType;
  docLabel: string;
  name: string;
  rrinFront: string;
  rrinBack: string;
  address: string;
  addressDetail: string;
  phoneNumber: string;
  purpose: string;
  purposeDetail: string;
  targetName: string;
  relationship: string;
  copies: number;
  baseAddress: string;
  periodStart: string;
  periodEnd: string;
  options: {
    includePastAddress: boolean;
    includeHouseholdRRIN: boolean;
    includeRelationship: boolean;
    includeMoveInDate: boolean;
    householderName: boolean;
    militaryRecord: boolean;
  };
  certOption: 'general' | 'detailed';
  rrinOption: 'masked' | 'unmasked';
  deliveryMethod: DeliveryMethod;
  detailOption: string;
  issueDate: string;
  // Selected records for list-type docs
  selectedRecords?: HistoryRecord[];
}

export interface ChatMessage {
  sender: 'player' | 'citizen' | 'system';
  text: string;
  timestamp: string;
}

export interface Scenario {
  id: string;
  type: 'tutorial' | 'normal' | 'event';
  citizenName: string;
  profile: CitizenProfile; 
  initialMessage: string; 
  status: 'active' | 'solved' | 'failed';
}

export interface LogEntry {
  id: string;
  day: number;
  message: string;
  type: 'scenario' | 'action' | 'outcome' | 'system';
}

export interface WindowState {
  id: AppId;
  isOpen: boolean;
  isMinimized: boolean;
  title: string;
  zIndex: number;
  x: number; 
  y: number; 
}