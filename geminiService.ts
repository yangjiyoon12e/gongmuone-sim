import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION, DOC_SPECS } from "../constants";
import { Scenario, DocType, DeliveryMethod, HistoryRecord } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const cleanJson = (text: string): string => {
  if (!text) return "";
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return clean;
};

const retryOperation = async <T>(operation: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error);
      lastError = error;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
};

const AVAILABLE_DOCS: DocType[] = [
  'resident_deungbon', 'resident_chobon', 'family_relation', 
  'basic_cert', 'marriage_cert', 
  'seal_cert', 'land_reg', 'building_reg', 'tax_local',
  'driver_history', 'immigration_log',
  'school_univ', 'school_high', 'school_middle', 'school_elem',
  'income_cert', 'pension_cert', 'vaccine_cert',
  'health_insurance'
];

// Helper to generate random consistent identity data
const generateRandomIdentity = () => {
  const year = Math.floor(Math.random() * (2005 - 1950 + 1)) + 1950;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  
  const yearStr = String(year).slice(2);
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  
  let genderDigit = Math.random() < 0.5 ? 1 : 2;
  if (year >= 2000) genderDigit += 2;

  const rrinFront = `${yearStr}${monthStr}${dayStr}`;
  const rrinBack = `${genderDigit}${Math.floor(Math.random() * 900000) + 100000}`;

  const mid = Math.floor(Math.random() * 9000) + 1000;
  const last = Math.floor(Math.random() * 9000) + 1000;
  const phoneNumber = `010-${mid}-${last}`;

  return { rrinFront, rrinBack, phoneNumber };
};

const generateImmigrationHistory = (): HistoryRecord[] => {
  const records: HistoryRecord[] = [];
  const ports = ['인천공항', '김포공항', '부산항', '김해공항'];
  const startYear = 2018;
  const endYear = 2024;
  
  // Generate 3-6 round trips
  const trips = Math.floor(Math.random() * 4) + 3;
  
  for (let i = 0; i < trips; i++) {
    const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
    const month = Math.floor(Math.random() * 11);
    const day = Math.floor(Math.random() * 25) + 1;
    
    const outDate = new Date(year, month, day);
    const inDate = new Date(year, month, day + Math.floor(Math.random() * 10) + 2);
    
    records.push({
      date: outDate.toISOString().split('T')[0],
      category: '출국',
      detail: ports[Math.floor(Math.random() * ports.length)]
    });
    records.push({
      date: inDate.toISOString().split('T')[0],
      category: '입국',
      detail: ports[Math.floor(Math.random() * ports.length)]
    });
  }
  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const generateTaxHistory = (): HistoryRecord[] => {
  const records: HistoryRecord[] = [];
  const taxes = ['자동차세', '재산세(토지)', '재산세(주택)', '주민세', '취득세'];
  
  for (let y = 2020; y <= 2024; y++) {
      taxes.forEach(tax => {
          if (Math.random() > 0.3) {
              const month = Math.floor(Math.random() * 12) + 1;
              const day = Math.floor(Math.random() * 28) + 1;
              const amount = (Math.floor(Math.random() * 50) + 5) * 10000;
              records.push({
                  date: `${y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
                  category: tax,
                  detail: `${amount.toLocaleString()}원`
              });
          }
      });
  }
  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const generateVaccineHistory = (): HistoryRecord[] => {
  const records: HistoryRecord[] = [];
  const vaccines = ['화이자', '모더나', '아스트라제네카', '노바백스'];
  const vaccine = vaccines[Math.floor(Math.random() * vaccines.length)];
  
  const dates = [
      '2021-06-15', '2021-09-20', '2022-02-10', '2022-12-05'
  ];
  
  for (let i = 0; i < dates.length; i++) {
      if (Math.random() > 0.8) break; // Maybe stopped early
      records.push({
          date: dates[i],
          category: vaccine,
          detail: `${i+1}차 접종`
      });
  }
  return records;
};

export const generateCitizenScenario = async (day: number): Promise<Scenario> => {
  if (!apiKey) throw new Error("API Key missing");

  // 30% chance of Excel Work, 70% chance of Document Issue
  const isExcelMission = Math.random() < 0.3;
  const forcedDocType = AVAILABLE_DOCS[Math.floor(Math.random() * AVAILABLE_DOCS.length)];
  const docLabel = DOC_SPECS[forcedDocType].label;
  const hasPeriod = DOC_SPECS[forcedDocType].hasPeriod;
  const isListDoc = DOC_SPECS[forcedDocType].isListSelection;

  // Generate random data client-side to ensure variety
  const randomIdentity = generateRandomIdentity();
  const randomCopies = Math.floor(Math.random() * 3) + 1; 
  
  // Realistic Options
  const randomVariant = Math.random() < 0.5 ? 'general' : 'detailed'; 
  const randomDisclosure = Math.random() < 0.5 ? 'masked' : 'unmasked'; 
  
  // Delivery Method (Most common is Print)
  const deliveryOptions: DeliveryMethod[] = ['print', 'print', 'print', 'electronic_wallet', 'pdf', 'fax'];
  const randomDelivery = deliveryOptions[Math.floor(Math.random() * deliveryOptions.length)];

  const districts = ['종로구', '강남구', '서초구', '마포구', '송파구', '영등포구', '용산구', '성동구'];
  const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
  const randomBaseAddress = `서울특별시 ${randomDistrict} 세종대로 ${Math.floor(Math.random() * 100) + 1}`;
  
  // Specific address details for realism
  const randomAptNum = Math.floor(Math.random() * 20) + 1; // 1~20 dong
  const randomRoomNum = Math.floor(Math.random() * 1500) + 100;
  const randomAddressDetail = `${randomAptNum}동 ${randomRoomNum}호`;

  // Random Period Generation (Last 3 years mostly)
  const currentYear = new Date().getFullYear();
  const randomStartYear = currentYear - Math.floor(Math.random() * 3) - 1;
  const randomStartMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const randomStartDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const periodStart = `${randomStartYear}-${randomStartMonth}-${randomStartDay}`;
  const periodEnd = `${currentYear}-${new Date().getMonth() + 1}-${new Date().getDate()}`;

  let prompt = "";

  if (isExcelMission) {
    prompt = `
      It is Day ${day}. Generate a realistic Korean Office Work scenario.
      MissionType: 'excel'.
      CitizenName: Random Korean Boss Name (e.g. 김과장, 이팀장, 박주임).
      Initial Message: Boss ordering to type data. **MUST explicitly say "I sent the data to your email"** (자료는 메일로 보냈으니 확인해).
      ExcelTaskDescription: Short title of the task (e.g. 2024년 1분기 예산안, 직원 연락망 정리).
      ExcelData: 3-5 pairs of simple Korean data (e.g. Item-Cost, Name-Phone).
      Output JSON.
    `;
  } else {
    prompt = `
      It is Day ${day}. Generate a realistic Korean civil service scenario.
      The citizen MUST want: [${docLabel}] (Code: ${forcedDocType}).
      
      Create a detailed persona:
      - Name (Korean)
      - MissionType: MUST be 'issue'.
      - RequestType: '${forcedDocType}'
      - TargetName, Relationship, DetailOption, Purpose...
      - Copies: ${randomCopies}
      - BaseAddress: "${randomBaseAddress}"
      - CertificateVariant: '${randomVariant}'
      - RrinDisclosure: '${randomDisclosure}'
      - AddressDetail: "${randomAddressDetail}"
      - PurposeDetail: Specific reason (e.g. "전세 대출 신청", "연말정산용", "비자 발급").
      - DeliveryMethod: '${randomDelivery}' (print, electronic_wallet, pdf, fax).
      ${hasPeriod ? `- PeriodStart: "${periodStart}", PeriodEnd: "${periodEnd}"` : ''}
      
      - Initial Message: A natural Korean request. **CRITICAL: The message MUST explicitly mention specific details** needed for the form.
        1. Mention "General/Detailed" and "RRIN Masking" preference.
        2. Mention **SPECIFIC PURPOSE DETAIL** (e.g. "for Housing Loan").
        3. Mention **ADDRESS DETAIL** (e.g., "It's for ${randomAddressDetail}").
        4. Mention **DELIVERY METHOD** (e.g. "그냥 뽑아줘(Print)", "전자지갑으로 쏴줘(Wallet)", "PDF로 저장해줘", "팩스로 보내").
        ${hasPeriod ? `5. Mention PERIOD (e.g., "from ${randomStartYear} to now").` : ''}
        ${isListDoc ? `6. Mention SPECIFIC RECORD/ITEM/YEAR to select (e.g., "tax for 2023", "3rd dose vaccine").` : ''}
      - **MUST BE IN KOREAN**.
      
      Output JSON.
    `;
  }

  try {
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            citizenName: { type: Type.STRING },
            initialMessage: { type: Type.STRING },
            profile: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                missionType: { type: Type.STRING, enum: ['issue', 'excel'] },
                address: { type: Type.STRING },
                addressOld: { type: Type.STRING },
                targetName: { type: Type.STRING },
                relationship: { type: Type.STRING },
                detailOption: { type: Type.STRING },
                purpose: { type: Type.STRING },
                requestType: { type: Type.STRING },
                purposeDetail: { type: Type.STRING },
                deliveryMethod: { type: Type.STRING, enum: ['print', 'electronic_wallet', 'pdf', 'fax'] },
                excelTaskDescription: { type: Type.STRING },
                certificateVariant: { type: Type.STRING, enum: ['general', 'detailed'] },
                rrinDisclosure: { type: Type.STRING, enum: ['masked', 'unmasked'] },
                excelData: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      colA: { type: Type.STRING },
                      colB: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }));

    const data = JSON.parse(cleanJson(response.text || "{}"));
    
    if (!data.profile.requestType) data.profile.requestType = 'none';

    // Generate specific history data if needed
    let historyRecords: HistoryRecord[] = [];
    if (forcedDocType === 'immigration_log') historyRecords = generateImmigrationHistory();
    else if (forcedDocType === 'tax_local') historyRecords = generateTaxHistory();
    else if (forcedDocType === 'vaccine_cert') historyRecords = generateVaccineHistory();

    return {
      id: `sc_${Date.now()}`,
      type: 'normal',
      citizenName: data.citizenName,
      initialMessage: data.initialMessage,
      status: 'active',
      profile: {
        ...data.profile,
        // Inject Randomized Data
        rrinFront: randomIdentity.rrinFront,
        rrinBack: randomIdentity.rrinBack,
        phoneNumber: randomIdentity.phoneNumber,
        copies: randomCopies,
        baseAddress: randomBaseAddress,
        // We use the AI generated preferences if available, otherwise fallback to random to ensure text/logic match
        certificateVariant: data.profile.certificateVariant || randomVariant,
        rrinDisclosure: data.profile.rrinDisclosure || randomDisclosure,
        addressDetail: randomAddressDetail,
        periodStart: hasPeriod ? periodStart : undefined,
        periodEnd: hasPeriod ? periodEnd : undefined,
        // Fallbacks
        targetName: data.profile.targetName || data.profile.name,
        relationship: data.profile.relationship || '본인',
        detailOption: data.profile.detailOption || '기본',
        purposeDetail: data.profile.purposeDetail || '제출용',
        deliveryMethod: data.profile.deliveryMethod || 'print',
        excelData: data.profile.excelData || [],
        historyRecords: historyRecords,
        dialogueHistory: []
      }
    };

  } catch (error) {
    console.error("Gen Scenario Error", error);
    const fallbackId = generateRandomIdentity();
    return {
      id: 'fallback',
      type: 'normal',
      citizenName: '시스템',
      initialMessage: '오류가 발생했습니다. 다음 민원을 불러오세요.',
      status: 'active',
      profile: {
        name: '시스템',
        missionType: 'issue',
        rrinFront: fallbackId.rrinFront,
        rrinBack: fallbackId.rrinBack,
        phoneNumber: fallbackId.phoneNumber,
        address: '오류',
        requestType: 'none',
        targetName: '',
        relationship: '본인',
        detailOption: '기본',
        purpose: '',
        copies: 1,
        certificateVariant: 'general',
        rrinDisclosure: 'masked',
        deliveryMethod: 'print',
        dialogueHistory: []
      }
    };
  }
};

export const getChatReply = async (
  scenario: Scenario, 
  playerMessage: string
): Promise<{ text: string, moodChange: number }> => {
  if (!apiKey) return { text: "...", moodChange: 0 };

  let prompt = "";
  if (scenario.profile.missionType === 'excel') {
    prompt = `
      Roleplay as Boss: ${scenario.citizenName}.
      Task: Excel Data Entry.
      Context: Player said "${playerMessage}".
      Response in Korean.
      If player asks for data, repeat: "Check the email I sent" (메일 확인해보게).
    `;
  } else {
    // Map delivery method to Korean for the prompt context
    const methodMap: Record<string, string> = {
      print: '프린터 출력 (Print)',
      electronic_wallet: '전자문서지갑 (Electronic Wallet)',
      pdf: 'PDF 저장',
      fax: '팩스 전송'
    };
    const method = methodMap[scenario.profile.deliveryMethod || 'print'];

    prompt = `
      Roleplay as Citizen: ${scenario.citizenName}.
      Want: ${DOC_SPECS[scenario.profile.requestType as DocType]?.label}
      Info: ${JSON.stringify(scenario.profile)}
      
      Preferences:
      - Copies: ${scenario.profile.copies}
      - Phone: ${scenario.profile.phoneNumber}
      - AddressDetail: ${scenario.profile.addressDetail}
      - PurposeDetail: ${scenario.profile.purposeDetail}
      - Period: ${scenario.profile.periodStart} ~ ${scenario.profile.periodEnd} (if applicable)
      - Delivery Method: ${method}
      
      Context: Player said "${playerMessage}".
      
      Guidelines:
      - If asked for "detailed purpose", say "${scenario.profile.purposeDetail}".
      - If asked for "delivery method" or "how to receive", say "Please ${method}".
      - If asked for "address detail", say "${scenario.profile.addressDetail}".
      - If asked for specific records/dates for History Logs (Tax/Immigration/Vaccine), specify what to select.
      - Be annoyed if asked repeatedly.
      - **Response MUST be in KOREAN**.
    `;
  }
  
  prompt += `Output JSON { "text": string, "moodChange": number }.`;

  try {
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            moodChange: { type: Type.INTEGER }
          }
        }
      }
    }));
    
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (e) {
    return { text: "...", moodChange: 0 };
  }
};