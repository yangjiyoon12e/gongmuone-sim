import { GameStats, AppId, Scenario, DocType } from './types';

export const INITIAL_STATS: GameStats = {
  stress: 10,
  reputation: 50,
  performance: 50,
  day: 1,
};

export const MAX_STATS = 100;
export const MIN_STATS = 0;

export const APPS: { id: AppId; name: string; icon: string; color: string }[] = [
  { id: 'minwon24', name: '새올행정', icon: 'Briefcase', color: 'bg-indigo-700' }, 
  { id: 'excel', name: '한셀 2024', icon: 'Table', color: 'bg-green-600' },
  { id: 'messenger', name: '바로톡', icon: 'MessageCircle', color: 'bg-yellow-500' },
  { id: 'mail', name: '공직자메일', icon: 'Mail', color: 'bg-sky-600' }, 
  { id: 'browser', name: '인터넷', icon: 'Globe', color: 'bg-blue-400' },
  { id: 'files', name: '내 컴퓨터', icon: 'FolderOpen', color: 'bg-indigo-500' }, 
  { id: 'notepad', name: '메모장', icon: 'FileText', color: 'bg-slate-500' }, 
  { id: 'calculator', name: '계산기', icon: 'Calculator', color: 'bg-orange-500' }, 
  { id: 'music', name: 'K-Melon', icon: 'Music', color: 'bg-green-500' }, 
];

// Option keys for rendering checkboxes
export type SpecOption = 'past_address' | 'household_rrin' | 'relationship' | 'move_in_date' | 'householder' | 'military';

export const DOC_SPECS: Record<DocType, { 
  label: string; 
  required: string[]; 
  hasPeriod?: boolean; 
  hasVariant?: boolean; // Show General/Detailed (일반/상세)
  options?: SpecOption[]; // List of checkboxes to show
  isListSelection?: boolean; // If true, shows a list of records to select
  listHeaders?: string[]; // Column headers for the selection table
}> = {
  resident_deungbon: { 
    label: '주민등록표(등본)', 
    required: ['name', 'rrin', 'address', 'phoneNumber', 'copies', 'purposeDetail'],
    options: ['past_address', 'household_rrin', 'relationship', 'move_in_date', 'householder']
  },
  resident_chobon: { 
    label: '주민등록표(초본)', 
    required: ['name', 'rrin', 'address', 'detailOption', 'phoneNumber', 'copies', 'purposeDetail'],
    options: ['past_address', 'move_in_date', 'military']
  },
  family_relation: { 
    label: '가족관계증명서', 
    required: ['name', 'rrin', 'targetName', 'relationship', 'baseAddress', 'phoneNumber', 'copies', 'purposeDetail'],
    hasVariant: true,
    options: ['household_rrin']
  },
  family_relation_detail: { 
    label: '가족관계(상세)', 
    required: ['name', 'rrin', 'targetName', 'relationship', 'detailOption', 'baseAddress', 'phoneNumber', 'copies', 'purposeDetail'],
    hasVariant: true,
    options: ['household_rrin']
  },
  basic_cert: { 
    label: '기본증명서', 
    required: ['name', 'rrin', 'purpose', 'baseAddress', 'phoneNumber', 'copies', 'purposeDetail'],
    hasVariant: true
  },
  marriage_cert: { 
    label: '혼인관계증명서', 
    required: ['name', 'rrin', 'targetName', 'baseAddress', 'phoneNumber', 'copies', 'purposeDetail'],
    hasVariant: true,
    options: ['household_rrin']
  },
  seal_cert: { 
    label: '인감증명서', 
    required: ['name', 'rrin', 'purpose', 'phoneNumber', 'copies', 'purposeDetail'] 
  },
  land_reg: { 
    label: '토지(임야)대장', 
    required: ['address', 'targetName', 'copies'],
    options: ['householder'] // Re-purposed for Owner name disclosure
  },
  building_reg: { 
    label: '일반건축물대장', 
    required: ['address', 'copies'],
    options: ['householder'] // Re-purposed for Owner name disclosure
  },
  tax_local: { 
    label: '지방세납세증명서', 
    required: ['name', 'rrin', 'address', 'purpose', 'phoneNumber', 'copies', 'purposeDetail'], 
    isListSelection: true,
    listHeaders: ['납세일자', '세목', '금액']
  },
  driver_history: { 
    label: '운전경력증명서', 
    required: ['name', 'rrin', 'purpose', 'phoneNumber', 'copies', 'purposeDetail'] 
  },
  immigration_log: { 
    label: '출입국사실증명', 
    required: ['name', 'rrin', 'purpose', 'phoneNumber', 'copies', 'purposeDetail'], 
    isListSelection: true,
    listHeaders: ['일자', '구분', '항구/공항']
  },
  school_univ: { 
    label: '재학증명서(대)', 
    required: ['name', 'rrin', 'purpose', 'phoneNumber', 'copies', 'purposeDetail'] 
  },
  school_high: { 
    label: '재학증명서(고)', 
    required: ['name', 'rrin', 'purpose', 'phoneNumber', 'copies', 'purposeDetail'] 
  },
  school_middle: { 
    label: '재학증명서(중)', 
    required: ['name', 'rrin', 'purpose', 'phoneNumber', 'copies', 'purposeDetail'] 
  },
  school_elem: { 
    label: '재학증명서(초)', 
    required: ['name', 'rrin', 'purpose', 'phoneNumber', 'copies', 'purposeDetail'] 
  },
  income_cert: { 
    label: '소득금액증명', 
    required: ['name', 'rrin', 'purpose', 'phoneNumber', 'copies', 'purposeDetail', 'period'], 
    hasPeriod: true 
  },
  pension_cert: { 
    label: '연금가입증명', 
    required: ['name', 'rrin', 'phoneNumber', 'copies', 'purposeDetail'] 
  },
  vaccine_cert: { 
    label: '예방접종증명', 
    required: ['name', 'rrin', 'purpose', 'phoneNumber', 'copies', 'purposeDetail'],
    isListSelection: true,
    listHeaders: ['접종일자', '백신명', '차수'] 
  },
  health_insurance: { 
    label: '건강보험자격득실', 
    required: ['name', 'rrin', 'phoneNumber', 'copies', 'purposeDetail'] 
  },
  none: { label: '선택 안함', required: [] }
};

export const SYSTEM_INSTRUCTION = `
You are the AI Game Master for a Korean Civil Servant Simulator.
The player communicates via a chat messenger ("BaroTalk").
You play the role of the citizen OR the strict Boss (Gwajang/Team Leader).

**CRITICAL LANGUAGE RULE**: 
All character dialogue and messages MUST be in KOREAN (한국어).

Scenario Types:
1. **Civil Complaint (Issuing Documents)**:
   - Citizen needs a document.
   - They MUST specify detailed requirements because the form is complex.
   - Required details to mention or imply: 
     * Specific purpose (e.g., "for bank loan", "for visa").
     * Detailed address info (e.g., "Apartment 101").
     * **For List Docs (Immigration/Tax/Vaccine)**: The citizen MUST mention specific records to select (e.g. "2023년도 재산세 내역", "3차 접종 증명", "작년 일본 다녀온 기록").

2. **Office Work (Excel Task)**:
   - The Boss (Kim Gwajang, Lee Juim, etc.) gives a list of data to type into Excel.
`;

// Hardcoded Tutorial Scenario
export const TUTORIAL_SCENARIO: Scenario = {
  id: 'tutorial_01',
  type: 'tutorial',
  citizenName: '김팀장',
  status: 'active',
  initialMessage: '신규! 업무 테스트다. 내 "주민등록초본"을 떼주게. "과거주소변동" 사항을 꼭 "포함"하고, 용도는 "경력증명용"이라고 적어. 상세 내용은 "인사과 제출"로 하고. 연락처는 "010-1234-5678" 입력해. "1통"만 뽑아와.',
  profile: {
    name: '김팀장',
    missionType: 'issue',
    rrinFront: '800101',
    rrinBack: '1234567',
    address: '서울특별시 종로구 세종대로 209', 
    addressDetail: '2층 인사과', // Added
    addressOld: '서울특별시 종로구 세종로 77-6',
    baseAddress: '서울특별시 종로구 세종대로 209', 
    phoneNumber: '010-1234-5678',
    copies: 1, 
    requestType: 'resident_chobon',
    targetName: '김팀장',
    relationship: '본인',
    detailOption: '포함', 
    purpose: '회사제출용',
    purposeDetail: '인사과 제출', // Added
    dialogueHistory: []
  }
};

export const PLAYER_PROFILE = {
  name: '김공무',
  rank: '7급 주무관',
  rrinFront: '920315',
  rrinBack: '1847291',
  department: '종합민원실',
  idCardNumber: '2024-007293'
};