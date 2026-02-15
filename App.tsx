import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_STATS, MAX_STATS, APPS, TUTORIAL_SCENARIO, DOC_SPECS, PLAYER_PROFILE } from './constants';
import { GameStats, Scenario, AppId, WindowState, ChatMessage, DocType, DeliveryMethod, PrintedDoc, HistoryRecord } from './types';
import { generateCitizenScenario, getChatReply } from './geminiService';
import { StatsDisplay } from './StatBar';
import { 
  Briefcase, Table, MessageCircle, Globe, Mail, FileText, Music,
  X, Minus, Square, Send, User, Loader2, Power, Bell, 
  Printer, Check, Users, FileQuestion, FileSpreadsheet, Save, Play, Pause, SkipForward,
  ArrowLeft, Trash2, Reply, Calculator, FolderOpen, Image as ImageIcon,
  RotateCcw, Search, ExternalLink, MoreHorizontal, UserCheck, Angry, Smile, LogOut,
  ShieldCheck, MapPin, AlertCircle, FileCheck, Building2, Syringe, Banknote, Landmark,
  Eye, EyeOff, Calendar, Smartphone, FileDown, Copy, CreditCard
} from 'lucide-react';

// Email Interface
interface EmailData {
  id: number;
  sender: string;
  time: string;
  title: string;
  body: string;
  read: boolean;
  isSpam: boolean;
}

const App: React.FC = () => {
  // --- State ---
  const [gameStarted, setGameStarted] = useState(false);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  
  // Apps Windows State (With Initial Positions)
  const [windows, setWindows] = useState<WindowState[]>([
    { id: 'minwon24', isOpen: false, isMinimized: false, title: '새올행정시스템', zIndex: 10, x: 50, y: 30 },
    { id: 'excel', isOpen: false, isMinimized: false, title: '한셀 2024', zIndex: 11, x: 100, y: 60 },
    { id: 'messenger', isOpen: false, isMinimized: false, title: '바로톡', zIndex: 12, x: 800, y: 100 },
    { id: 'browser', isOpen: false, isMinimized: false, title: '인터넷', zIndex: 13, x: 150, y: 150 },
    { id: 'mail', isOpen: false, isMinimized: false, title: '공직자메일', zIndex: 14, x: 200, y: 200 },
    { id: 'notepad', isOpen: false, isMinimized: false, title: '메모장', zIndex: 15, x: 900, y: 200 },
    { id: 'music', isOpen: false, isMinimized: false, title: 'K-Melon', zIndex: 16, x: 900, y: 500 },
    { id: 'calculator', isOpen: false, isMinimized: false, title: '계산기', zIndex: 17, x: 400, y: 300 },
    { id: 'files', isOpen: false, isMinimized: false, title: '내 컴퓨터', zIndex: 18, x: 300, y: 100 },
  ]);
  const [activeWindowId, setActiveWindowId] = useState<AppId | null>(null);
  
  // Dragging State
  const [dragTarget, setDragTarget] = useState<AppId | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Minwon24 Form State (Complex)
  const [selectedDoc, setSelectedDoc] = useState<DocType>('resident_deungbon');
  const [formData, setFormData] = useState({
    name: "", rrinFront: "", rrinBack: "", address: "", addressDetail: "",
    phoneNumber: "", purpose: "", purposeDetail: "",
    targetName: "", relationship: "본인",
    copies: 1, 
    baseAddress: "",
    periodStart: "", periodEnd: ""
  });
  
  // Realistic Options State
  const [certOption, setCertOption] = useState<'general' | 'detailed'>('general'); // 일반 / 상세
  const [rrinOption, setRrinOption] = useState<'masked' | 'unmasked'>('masked'); // 비공개 / 공개
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('print'); // 수령 방법

  // Detailed Options (Checkboxes)
  const [complexOptions, setComplexOptions] = useState({
      includePastAddress: false, // 과거 주소 변동
      includeHouseholdRRIN: false, // 세대원 뒷자리
      includeRelationship: true, // 관계
      includeMoveInDate: true, // 전입일
      householderName: true, // 세대주 성명
      militaryRecord: false, // 병역 사항
  });
  
  // Immigration Selection State
  const [selectedHistoryRecords, setSelectedHistoryRecords] = useState<HistoryRecord[]>([]);

  const [processingIssue, setProcessingIssue] = useState(false);
  const [minwonLoading, setMinwonLoading] = useState(false); // Security loading fake
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [targetSearchField, setTargetSearchField] = useState<'address' | 'baseAddress'>('address');
  const [printedDoc, setPrintedDoc] = useState<PrintedDoc | null>(null);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false); // Player info modal

  // Browser State
  const [browserUrl, setBrowserUrl] = useState("http://www.portal.go.kr");
  const [browserSearch, setBrowserSearch] = useState("");
  const [browserContent, setBrowserContent] = useState<string>("home");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  
  // Excel State
  const [excelData, setExcelData] = useState<string[][]>(Array(15).fill("").map(() => Array(5).fill("")));

  // Calculator State
  const [calcInput, setCalcInput] = useState("0");
  const [calcMemory, setCalcMemory] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [resetCalc, setResetCalc] = useState(false);

  // New Apps State
  const [notepadContent, setNotepadContent] = useState("");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const playList = ["노동요 - 빠른 비트 모음", "퇴근하고 싶다 - Ballad Ver.", "민원인 대응용 명상음악", "월급날 - EDM Remix"];
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);

  // Mail State
  const [emails, setEmails] = useState<EmailData[]>([
      { id: 1, sender: '인사과', time: '09:00', title: '전 직원 필독: 점심시간 준수 안내', body: '안녕하십니까, 인사과입니다.\n\n최근 점심시간(12:00~13:00)을 준수하지 않고 13:05분에 복귀하는 사례가 빈번하게 적발되고 있습니다.\n\n시민들의 불편이 접수되고 있으니, 전 직원은 12:55분까지 자리에 착석하여 업무 준비를 마쳐주시기 바랍니다.\n\n불시 점검 예정입니다.', read: false, isSpam: false },
      { id: 2, sender: '김팀장', time: '어제', title: '이번 달 실적 저조자 명단 (참고)', body: '수고가 많습니다.\n\n첨부파일 확인하시고 본인이 해당된다 싶으면 이번 주말에 나와서라도 처리하세요.\n\n특히 신규 직원들은 민원 처리 속도가 너무 느립니다. 분발하세요.\n\n- 김팀장 드림', read: true, isSpam: false },
      { id: 3, sender: '스팸차단', time: '어제', title: '[광고] 김미영 팀장입니다.', body: '고객님! 최저 금리 2.5%로 대출 가능하십니다.\n\n기존 대출 상환 조건 없이 5000만원까지 즉시 송금.\n\n지금 바로 전화주세요.', read: true, isSpam: true },
  ]);
  const [selectedMail, setSelectedMail] = useState<EmailData | null>(null);
  const [replyingMail, setReplyingMail] = useState<EmailData | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const [notifications, setNotifications] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState("");

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [currentScenario?.profile.dialogueHistory]);

  // --- Window Management ---
  const bringToFront = (id: AppId) => {
      setWindows(prev => {
          const maxZ = Math.max(...prev.map(w => w.zIndex));
          return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w);
      });
      setActiveWindowId(id);
      setIsStartMenuOpen(false);
  };
  const toggleWindow = (id: AppId) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: true, isMinimized: false } : w));
    bringToFront(id);
    
    // Fake security loading for Minwon24
    if (id === 'minwon24' && !windows.find(w => w.id === 'minwon24')?.isOpen) {
        setMinwonLoading(true);
        setTimeout(() => setMinwonLoading(false), 2000);
    }
  };
  const closeWindow = (id: AppId) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: false } : w));
    if (activeWindowId === id) setActiveWindowId(null);
  };
  const minimizeWindow = (id: AppId) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    setActiveWindowId(null);
  };

  // --- Drag Logic ---
  const handleMouseDown = (e: React.MouseEvent, id: AppId) => {
      bringToFront(id);
      const win = windows.find(w => w.id === id);
      if (win) {
          setDragTarget(id);
          setDragOffset({
              x: e.clientX - win.x,
              y: e.clientY - win.y
          });
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (dragTarget) {
          setWindows(prev => prev.map(w => {
              if (w.id === dragTarget) {
                  return { ...w, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
              }
              return w;
          }));
      }
  };

  const handleMouseUp = () => {
      setDragTarget(null);
  };

  // --- Game Logic ---
  const startGame = (skipTutorial: boolean = false) => {
    setGameStarted(true);
    setStats(INITIAL_STATS);
    setGameOver(false);
    if (skipTutorial) {
        setNotifications(["실무에 투입되었습니다. 건투를 빕니다."]);
        loadNextScenario();
    } else {
        startTutorial();
    }
  };

  const startTutorial = () => {
    const scenario = { ...TUTORIAL_SCENARIO };
    scenario.profile.dialogueHistory = [{
      sender: 'citizen',
      text: scenario.initialMessage,
      timestamp: new Date().toLocaleTimeString()
    }];
    setCurrentScenario(scenario);
    setNotifications(["[튜토리얼] 김팀장님의 메시지가 도착했습니다."]);
    toggleWindow('messenger');
  };

  const loadNextScenario = async () => {
    const scenario = await generateCitizenScenario(stats.day);
    scenario.profile.dialogueHistory = [{
        sender: 'citizen',
        text: scenario.initialMessage,
        timestamp: new Date().toLocaleTimeString()
    }];
    setCurrentScenario(scenario);
    
    // Add Email Logic for Excel Missions
    if (scenario.profile.missionType === 'excel') {
        const dataRows = scenario.profile.excelData?.map(row => `- ${row.colA} : ${row.colB}`).join('\n') || "데이터 없음";
        const newEmail: EmailData = {
            id: Date.now(),
            sender: scenario.citizenName,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            title: `[업무] ${scenario.profile.excelTaskDescription || '자료 정리 건'}`,
            body: `수고가 많아요.\n\n${scenario.initialMessage}\n\n[정리할 데이터]\n${dataRows}\n\n오타 없이 한셀에 입력해서 보고하세요.\nA열, B열에 맞춰서 입력하면 됩니다.`,
            read: false,
            isSpam: false
        };
        setEmails(prev => [newEmail, ...prev]);
        setNotifications([`📧 새 메일이 도착했습니다: ${scenario.citizenName}`]);
    } else {
        setNotifications([`[새 업무] ${scenario.citizenName}님이 대화 요청.`]);
    }

    setSelectedDoc('resident_deungbon'); 
    resetForm();
    setExcelData(Array(15).fill("").map(() => Array(5).fill(""))); 
  };

  // Force skip current scenario
  const skipScenario = () => {
      setCurrentScenario(null);
      // Small penalty for skipping?
      setStats(prev => ({ ...prev, stress: Math.min(MAX_STATS, prev.stress + 5) }));
      loadNextScenario(); // Immediate load
  };

  const resetForm = () => {
    setFormData({ 
        name: "", rrinFront: "", rrinBack: "", address: "", addressDetail: "",
        phoneNumber: "", purpose: "", purposeDetail: "",
        targetName: "", relationship: "본인",
        copies: 1,
        baseAddress: "",
        periodStart: "", periodEnd: ""
    });
    setComplexOptions({
        includePastAddress: false,
        includeHouseholdRRIN: false,
        includeRelationship: true,
        includeMoveInDate: true,
        householderName: true,
        militaryRecord: false,
    });
    setCertOption('general');
    setRrinOption('masked');
    setDeliveryMethod('print');
    setPrintedDoc(null);
    setSelectedHistoryRecords([]);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentScenario) return;

    const newMessage: ChatMessage = { sender: 'player', text: chatInput, timestamp: new Date().toLocaleTimeString() };
    const updatedScenario = { ...currentScenario };
    updatedScenario.profile.dialogueHistory.push(newMessage);
    setCurrentScenario(updatedScenario);
    setChatInput("");
    setIsTyping(true);

    if (currentScenario.type === 'tutorial') {
        setTimeout(() => {
             let replyText = "자네 뭐하나? '새올행정'을 켜서 초본을 발급하게.";
             if (newMessage.text.includes("주소")) replyText = "주소는 '세종대로 209'야. 구 주소는 '세종로 77-6'이고.";
             else if (newMessage.text.includes("포함") || newMessage.text.includes("과거")) replyText = "그래, 과거 주소 변동 이력을 꼭 '포함' 시켜주게.";
             updatedScenario.profile.dialogueHistory.push({ sender: 'citizen', text: replyText, timestamp: new Date().toLocaleTimeString() });
             setCurrentScenario({...updatedScenario});
             setIsTyping(false);
        }, 1000);
        return;
    }

    try {
        const reply = await getChatReply(currentScenario, newMessage.text);
        updatedScenario.profile.dialogueHistory.push({ sender: 'citizen', text: reply.text, timestamp: new Date().toLocaleTimeString() });
        setStats(prev => ({ ...prev, stress: prev.stress - reply.moodChange }));
        setCurrentScenario({...updatedScenario});
    } catch (error) { console.error(error); } finally { setIsTyping(false); }
  };

  // -- Document Issue Logic --
  const handleIssueDocument = () => {
      // Special case: Player issuing their own doc
      const isSelfIssue = formData.name === PLAYER_PROFILE.name && formData.rrinFront === PLAYER_PROFILE.rrinFront;
      
      if (isSelfIssue) {
          setProcessingIssue(true);
          setTimeout(() => {
              setProcessingIssue(false);
              setPrintedDoc({ 
                  docTypeKey: selectedDoc,
                  docLabel: DOC_SPECS[selectedDoc].label, 
                  ...formData, 
                  options: { ...complexOptions },
                  certOption,
                  rrinOption,
                  deliveryMethod,
                  detailOption: "본인발급", 
                  issueDate: new Date().toLocaleDateString(),
                  selectedRecords: selectedHistoryRecords
              });
          }, 2000);
          return;
      }

      if (!currentScenario || currentScenario.profile.missionType !== 'issue') {
          alert("지금은 문서 발급 업무가 아닙니다.");
          return;
      }
      setProcessingIssue(true);
      
      // Map complex options to the legacy check string
      let derivedDetailOption = "기본";
      if (complexOptions.includePastAddress) derivedDetailOption = "포함";
      if (!complexOptions.includePastAddress && currentScenario.profile.detailOption === "미포함") derivedDetailOption = "미포함";

      setTimeout(() => {
          setProcessingIssue(false);
          setPrintedDoc({ 
              docTypeKey: selectedDoc,
              docLabel: DOC_SPECS[selectedDoc].label, 
              ...formData, 
              // Store checkboxes and new realistic options
              options: { ...complexOptions },
              certOption,
              rrinOption,
              deliveryMethod,
              detailOption: derivedDetailOption, // Legacy field for compatibility
              issueDate: new Date().toLocaleDateString(),
              selectedRecords: selectedHistoryRecords
          });
      }, 2000);
  };

  const handlePrintConfirm = () => {
      if (!currentScenario || !printedDoc) return;
      
      // Special case: Self issue outcome
      if (printedDoc.name === PLAYER_PROFILE.name) {
          setNotifications(["[시스템] 본인 증명서 발급이 완료되었습니다."]);
          setPrintedDoc(null);
          resetForm();
          return;
      }

      const target = currentScenario.profile;
      
      let isValid = true;
      let failReason = "";

      if (printedDoc.docTypeKey !== target.requestType) {
          isValid = false; 
          const targetSpec = DOC_SPECS[target.requestType as DocType] as any;
          failReason = `[서류 불일치] 민원인은 '${targetSpec?.label || target.requestType}'를 원합니다.`;
      }
      
      // Validate specs if doc type matches
      if (isValid) {
          const spec = DOC_SPECS[printedDoc.docTypeKey];
          spec.required.forEach(field => {
              if (!isValid) return;
              let match = false;
              if (field === 'name') match = printedDoc.name.trim() === target.name;
              else if (field === 'rrin') match = printedDoc.rrinFront === target.rrinFront && printedDoc.rrinBack === target.rrinBack;
              else if (field === 'address') match = printedDoc.address.replace(/\s/g, '') === target.address?.replace(/\s/g, '') && 
                                                    printedDoc.addressDetail.replace(/\s/g, '') === (target.addressDetail || '').replace(/\s/g, ''); 
              else if (field === 'purpose') match = printedDoc.purpose.trim().length > 0;
              else if (field === 'purposeDetail') match = printedDoc.purposeDetail.trim() === target.purposeDetail?.trim();
              else if (field === 'targetName') match = printedDoc.targetName.trim() === target.targetName;
              else if (field === 'relationship') match = printedDoc.relationship === target.relationship;
              else if (field === 'detailOption') match = printedDoc.detailOption === target.detailOption;
              else if (field === 'phoneNumber') match = printedDoc.phoneNumber?.replace(/-/g, '') === target.phoneNumber?.replace(/-/g, '');
              else if (field === 'copies') match = printedDoc.copies === target.copies;
              else if (field === 'baseAddress') match = printedDoc.baseAddress?.replace(/\s/g, '') === target.baseAddress?.replace(/\s/g, '');
              else if (field === 'period') match = printedDoc.periodStart === target.periodStart && printedDoc.periodEnd === target.periodEnd;

              if (!match) { 
                  isValid = false; 
                  // Friendly error message mapping
                  const labelMap: any = { 
                      name: "성명", rrin: "주민번호", address: "주소/상세주소", purpose: "용도", purposeDetail: "상세용도", targetName: "대상자", 
                      relationship: "관계", detailOption: "상세옵션", phoneNumber: "연락처", copies: "부수", baseAddress: "등록기준지", period: "기간"
                  };
                  failReason = `[정보 불일치] ${labelMap[field] || field} 항목이 요청과 다릅니다.`; 
              }
          });
          
          // Strict Validation for Certificate Variant and RRIN
          if (isValid) {
              if (target.certificateVariant && printedDoc.certOption !== target.certificateVariant) {
                  isValid = false;
                  failReason = `[옵션 불일치] 민원인은 '${target.certificateVariant === 'detailed' ? '상세(Detailed)' : '일반(General)'}' 증명서를 원합니다.`;
              }
              if (target.rrinDisclosure && printedDoc.rrinOption !== target.rrinDisclosure) {
                  isValid = false;
                  failReason = `[주민번호 공개 불일치] 민원인은 주민번호 '${target.rrinDisclosure === 'unmasked' ? '완전공개' : '비공개'}'를 원합니다.`;
              }
              if (target.deliveryMethod && printedDoc.deliveryMethod !== target.deliveryMethod) {
                  isValid = false;
                  const methodMap: any = { print: '프린터 출력', electronic_wallet: '전자문서지갑', pdf: 'PDF 저장', fax: '팩스 전송' };
                  failReason = `[수령 방법 불일치] 민원인은 '${methodMap[target.deliveryMethod] || target.deliveryMethod}' 방식으로 받기를 원합니다.`;
              }
              // List Selection Validation
              if (DOC_SPECS[printedDoc.docTypeKey].isListSelection) {
                  if (!printedDoc.selectedRecords || printedDoc.selectedRecords.length === 0) {
                      isValid = false;
                      failReason = `[기록 미선택] 발급할 기록을 선택하지 않았습니다.`;
                  }
              }
          }
      }

      const updated = { ...currentScenario };
      if (isValid) {
          updated.profile.dialogueHistory.push({ sender: 'citizen', text: "감사합니다. 수고 많으시네요.", timestamp: new Date().toLocaleTimeString() });
          setCurrentScenario(updated);
          setPrintedDoc(null);
          setStats(prev => ({ ...prev, reputation: Math.min(MAX_STATS, prev.reputation + 10), performance: Math.min(MAX_STATS, prev.performance + 10), day: prev.day + 1 }));
          toggleWindow('messenger');
          // FAST TRANSITION: 500ms
          setTimeout(() => { setCurrentScenario(null); loadNextScenario(); }, 500);
      } else {
          updated.profile.dialogueHistory.push({ sender: 'citizen', text: `이게 아니잖아요! ${failReason.replace(/\[.*?\] /, '')} 다시 확인해주세요.`, timestamp: new Date().toLocaleTimeString() });
          setCurrentScenario(updated);
          setPrintedDoc(null);
          setStats(prev => ({ ...prev, stress: prev.stress + 10, reputation: prev.reputation - 5 }));
          toggleWindow('messenger');
      }
  };

  // -- Excel Logic --
  const handleExcelReport = () => {
      if (!currentScenario || currentScenario.profile.missionType !== 'excel') {
          alert("지금은 보고할 내용이 없거나 일반 민원 업무 중입니다.");
          return;
      }
      const expectedData = currentScenario.profile.excelData || [];
      let correctCount = 0;
      expectedData.forEach(pair => {
          const found = excelData.some(row => {
               const rowStr = row.join(" ").replace(/\s+/g, "");
               return rowStr.includes(pair.colA.replace(/\s+/g, "")) && rowStr.includes(pair.colB.replace(/\s+/g, ""));
          });
          if (found) correctCount++;
      });

      const updated = { ...currentScenario };
      if (correctCount >= expectedData.length) {
          updated.profile.dialogueHistory.push({ sender: 'citizen', text: "음, 확인했네. 수고했어. 다음 업무 준비하게.", timestamp: new Date().toLocaleTimeString() });
          setCurrentScenario(updated);
          setStats(prev => ({ ...prev, performance: Math.min(MAX_STATS, prev.performance + 15), reputation: Math.min(MAX_STATS, prev.reputation + 5), day: prev.day + 1 }));
          toggleWindow('messenger');
          // FAST TRANSITION: 500ms
          setTimeout(() => { setCurrentScenario(null); loadNextScenario(); }, 500);
      } else {
          updated.profile.dialogueHistory.push({ sender: 'citizen', text: "자네, 눈이 어떻게 된 건가? 데이터가 틀렸잖아. 메일 다시 확인해봐!", timestamp: new Date().toLocaleTimeString() });
          setCurrentScenario(updated);
          setStats(prev => ({ ...prev, stress: prev.stress + 10 }));
          toggleWindow('messenger');
      }
  };

  const renderDocumentPreview = () => {
    if (!printedDoc) return null;
    const listHeaders = DOC_SPECS[printedDoc.docTypeKey]?.listHeaders || ['일자', '내용', '비고'];

    return (
      <div className="border border-slate-300 p-4 min-h-[400px] text-sm font-serif">
        <table className="w-full border-collapse border border-slate-400 mb-4">
          <tbody>
            <tr>
              <td className="border border-slate-400 bg-slate-100 p-2 w-24 font-bold">성명</td>
              <td className="border border-slate-400 p-2">{printedDoc.name}</td>
              <td className="border border-slate-400 bg-slate-100 p-2 w-24 font-bold">주민등록번호</td>
              <td className="border border-slate-400 p-2">
                 {printedDoc.rrinFront}-{printedDoc.rrinOption === 'masked' ? '******' : printedDoc.rrinBack}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-400 bg-slate-100 p-2 font-bold">주소</td>
              <td colSpan={3} className="border border-slate-400 p-2">
                {printedDoc.address} {printedDoc.addressDetail}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-400 bg-slate-100 p-2 font-bold">용도</td>
              <td colSpan={3} className="border border-slate-400 p-2">
                {printedDoc.purpose} ({printedDoc.purposeDetail})
              </td>
            </tr>
            {/* Dynamic fields based on checkboxes */}
            {printedDoc.options?.includePastAddress && (
               <tr><td colSpan={4} className="border border-slate-400 p-2 text-xs text-slate-500">[포함] 과거 주소 변동 사항</td></tr>
            )}
             {printedDoc.options?.militaryRecord && (
               <tr><td colSpan={4} className="border border-slate-400 p-2 text-xs text-slate-500">[포함] 병역 사항</td></tr>
            )}
            {printedDoc.periodStart && (
               <tr>
                 <td className="border border-slate-400 bg-slate-100 p-2 font-bold">기간</td>
                 <td colSpan={3} className="border border-slate-400 p-2">{printedDoc.periodStart} ~ {printedDoc.periodEnd}</td>
               </tr>
            )}
            
            {/* List Records Table in Preview */}
            {DOC_SPECS[printedDoc.docTypeKey]?.isListSelection && printedDoc.selectedRecords && (
                <tr>
                    <td colSpan={4} className="p-0 border border-slate-400">
                        <table className="w-full text-center text-xs">
                            <thead className="bg-slate-100 font-bold">
                                <tr>
                                    <td className="p-1 border-b border-r border-slate-300">{listHeaders[0]}</td>
                                    <td className="p-1 border-b border-r border-slate-300">{listHeaders[1]}</td>
                                    <td className="p-1 border-b border-slate-300">{listHeaders[2]}</td>
                                </tr>
                            </thead>
                            <tbody>
                                {printedDoc.selectedRecords.map((rec, i) => (
                                    <tr key={i}>
                                        <td className="p-1 border-b border-r border-slate-200">{rec.date}</td>
                                        <td className="p-1 border-b border-r border-slate-200">{rec.category}</td>
                                        <td className="p-1 border-b border-slate-200">{rec.detail}</td>
                                    </tr>
                                ))}
                                {printedDoc.selectedRecords.length === 0 && <tr><td colSpan={3} className="p-4">기록 없음</td></tr>}
                            </tbody>
                        </table>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMessenger = () => {
    const messages = currentScenario?.profile.dialogueHistory || [];
    return (
        <div className="flex flex-col h-full bg-[#b2c7d9]">
            <div className="p-2 bg-[#9bbbd4] flex items-center justify-between border-b border-white/30">
                <div className="font-bold text-sm text-slate-800 flex items-center gap-1">
                    <User className="bg-white rounded-full p-0.5" size={16}/>
                    {currentScenario?.citizenName || '대기중...'}
                </div>
                <button onClick={skipScenario} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded shadow flex items-center gap-1">
                    <SkipForward size={12}/> 다음 민원인
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={chatScrollRef}>
                {!currentScenario && <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-slate-500"/></div>}
                {messages.length === 0 && currentScenario && <div className="text-center text-xs text-slate-500 mt-10">대화 내용이 없습니다.</div>}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'player' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender !== 'player' && <div className="w-8 h-8 bg-slate-300 rounded-full mr-2 flex items-center justify-center text-xs font-bold">{currentScenario?.citizenName[0]}</div>}
                        <div className={`max-w-[70%] p-2 rounded text-sm shadow-sm ${msg.sender === 'player' ? 'bg-[#ffec42] text-black' : 'bg-white text-black'}`}>
                            {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-500 self-end ml-1">{msg.timestamp}</span>
                    </div>
                ))}
                {isTyping && <div className="text-xs text-slate-500 ml-10">입력 중...</div>}
            </div>
            <form onSubmit={handleChatSubmit} className="bg-white p-2 flex gap-2 border-t border-slate-300">
                <input 
                    type="text" 
                    className="flex-1 border border-slate-300 bg-slate-50 px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={currentScenario ? "메시지를 입력하세요..." : "대기 중..."}
                    disabled={!currentScenario}
                />
                <button type="submit" disabled={!currentScenario} className={`px-4 py-1 text-sm font-bold text-black border border-slate-300 ${!currentScenario ? 'bg-slate-200' : 'bg-[#ffec42] hover:bg-[#ebd93d]'}`}>전송</button>
            </form>
        </div>
    );
  };

  const renderMinwon24 = () => {
    if (minwonLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-white">
           <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
           <p className="text-slate-600 font-bold">보안 프로그램 구동 중...</p>
           <p className="text-xs text-slate-400 mt-2">AnySign4PC / Veraport / TouchenKey</p>
        </div>
      );
    }
    
    return (
      <div className="flex h-full bg-white flex-col">
         {/* Header */}
         <div className="h-12 bg-indigo-700 flex items-center px-4 justify-between shrink-0">
             <div className="text-white font-bold text-lg flex items-center gap-2">
                 <Briefcase size={20}/> 대한민국 정부 민원포털
             </div>
             <div onClick={() => setShowPlayerProfile(true)} className="text-indigo-200 text-xs cursor-pointer hover:text-white hover:underline flex items-center gap-1">
                 <User size={12}/> 로그인: {PLAYER_PROFILE.name} ({PLAYER_PROFILE.rank})
             </div>
         </div>
         
         <div className="flex flex-1 overflow-hidden">
             {/* Sidebar */}
             <div className="w-48 bg-slate-100 border-r border-slate-200 overflow-y-auto shrink-0">
                 {Object.entries(DOC_SPECS).map(([key, spec]) => (
                     <div 
                        key={key} 
                        onClick={() => { setSelectedDoc(key as DocType); resetForm(); }}
                        className={`p-3 text-sm cursor-pointer border-b border-slate-200 hover:bg-slate-200 ${selectedDoc === key ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-l-indigo-700' : 'text-slate-600'}`}
                     >
                         {spec.label}
                     </div>
                 ))}
             </div>
             
             {/* Content */}
             <div className="flex-1 p-6 overflow-y-auto bg-slate-50 relative">
                 <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2 border-slate-300">{DOC_SPECS[selectedDoc].label} 발급신청</h2>
                 
                 <div className="space-y-4 max-w-2xl">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">성명 (Name)</label>
                            <input className="border p-1 text-sm rounded bg-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">주민등록번호 (RRIN)</label>
                            <div className="flex gap-2 items-center">
                                <input className="border p-1 text-sm rounded w-24 bg-white" value={formData.rrinFront} onChange={e => setFormData({...formData, rrinFront: e.target.value})} maxLength={6} />
                                <span>-</span>
                                <input className="border p-1 text-sm rounded w-24 bg-white" value={formData.rrinBack} onChange={e => setFormData({...formData, rrinBack: e.target.value})} maxLength={7} type="password" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500">주소 (Address)</label>
                        <div className="flex gap-2">
                             <input className="border p-1 text-sm rounded flex-1 bg-gray-100" readOnly value={formData.address} placeholder="주소 검색을 이용하세요" />
                             <button onClick={() => { setShowAddressSearch(true); setTargetSearchField('address'); }} className="bg-slate-600 text-white px-2 rounded text-xs">검색</button>
                        </div>
                        <input className="border p-1 text-sm rounded bg-white mt-1" value={formData.addressDetail} onChange={e => setFormData({...formData, addressDetail: e.target.value})} placeholder="상세주소 (동/호수)" />
                    </div>

                    {/* Conditional Fields based on DOC_SPECS */}
                    {DOC_SPECS[selectedDoc].required.includes('targetName') && (
                         <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500">대상자 성명</label>
                                <input className="border p-1 text-sm rounded bg-white" value={formData.targetName} onChange={e => setFormData({...formData, targetName: e.target.value})} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500">관계</label>
                                <select className="border p-1 text-sm rounded bg-white" value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})}>
                                    <option value="본인">본인</option>
                                    <option value="배우자">배우자</option>
                                    <option value="자녀">자녀</option>
                                    <option value="부모">부모</option>
                                </select>
                            </div>
                         </div>
                    )}
                    
                    {DOC_SPECS[selectedDoc].hasPeriod && (
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">기간 (Period)</label>
                            <div className="flex gap-2 items-center text-sm">
                                <input type="date" className="border p-1 rounded" value={formData.periodStart} onChange={e => setFormData({...formData, periodStart: e.target.value})} />
                                ~
                                <input type="date" className="border p-1 rounded" value={formData.periodEnd} onChange={e => setFormData({...formData, periodEnd: e.target.value})} />
                            </div>
                        </div>
                    )}

                    {/* Generic List Selection */}
                    {DOC_SPECS[selectedDoc].isListSelection && (
                        <div className="flex flex-col gap-1 border p-2 rounded bg-yellow-50">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><Globe size={12}/> 발급 대상 기록 선택 (Select Records)</label>
                            <div className="max-h-32 overflow-y-auto bg-white border">
                                <table className="w-full text-xs text-center">
                                    <thead className="bg-slate-100 font-bold sticky top-0">
                                        <tr>
                                            <td className="p-1">선택</td>
                                            <td className="p-1">{DOC_SPECS[selectedDoc].listHeaders?.[0] || '일자'}</td>
                                            <td className="p-1">{DOC_SPECS[selectedDoc].listHeaders?.[1] || '내용'}</td>
                                            <td className="p-1">{DOC_SPECS[selectedDoc].listHeaders?.[2] || '비고'}</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(currentScenario?.profile.historyRecords || []).map((rec, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="p-1">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedHistoryRecords.some(r => r.date === rec.date && r.category === rec.category)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedHistoryRecords([...selectedHistoryRecords, rec]);
                                                            } else {
                                                                setSelectedHistoryRecords(selectedHistoryRecords.filter(r => !(r.date === rec.date && r.category === rec.category)));
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-1">{rec.date}</td>
                                                <td className="p-1">{rec.category}</td>
                                                <td className="p-1">{rec.detail}</td>
                                            </tr>
                                        ))}
                                        {(!currentScenario?.profile.historyRecords?.length) && <tr><td colSpan={4} className="p-2 text-slate-400">조회된 기록 없음</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500">용도 (Purpose)</label>
                        <select className="border p-1 text-sm rounded bg-white mb-1" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})}>
                            <option value="">선택하세요</option>
                            <option value="금융기관제출용">금융기관제출용</option>
                            <option value="관공서제출용">관공서제출용</option>
                            <option value="회사제출용">회사제출용</option>
                            <option value="기타">기타</option>
                        </select>
                        <input className="border p-1 text-sm rounded bg-white" value={formData.purposeDetail} onChange={e => setFormData({...formData, purposeDetail: e.target.value})} placeholder="상세 용도 입력 (예: 전세자금대출)" />
                    </div>
                    
                    {/* Realistic Complex Options */}
                    <div className="bg-white p-3 rounded border border-slate-200 text-sm">
                        <div className="font-bold mb-2 text-indigo-700">발급 옵션</div>
                        
                        {/* Variant Radios */}
                        {DOC_SPECS[selectedDoc].hasVariant && (
                            <div className="mb-2 flex gap-4">
                                <label className="flex items-center gap-1"><input type="radio" name="cert" checked={certOption === 'general'} onChange={() => setCertOption('general')} /> 일반</label>
                                <label className="flex items-center gap-1"><input type="radio" name="cert" checked={certOption === 'detailed'} onChange={() => setCertOption('detailed')} /> 상세</label>
                            </div>
                        )}

                        {/* RRIN Disclosure */}
                        <div className="mb-2 flex gap-4">
                            <label className="flex items-center gap-1"><input type="radio" name="rrin" checked={rrinOption === 'masked'} onChange={() => setRrinOption('masked')} /> 주민번호 뒷자리 비공개</label>
                            <label className="flex items-center gap-1"><input type="radio" name="rrin" checked={rrinOption === 'unmasked'} onChange={() => setRrinOption('unmasked')} /> 완전 공개</label>
                        </div>
                        
                        {/* Dynamic Checkboxes based on DOC_SPECS.options */}
                        {DOC_SPECS[selectedDoc].options && DOC_SPECS[selectedDoc].options!.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                                {DOC_SPECS[selectedDoc].options!.includes('past_address') && (
                                    <label className="flex items-center gap-1 text-slate-700"><input type="checkbox" checked={complexOptions.includePastAddress} onChange={e => setComplexOptions({...complexOptions, includePastAddress: e.target.checked})}/> 과거주소변동사항</label>
                                )}
                                {DOC_SPECS[selectedDoc].options!.includes('household_rrin') && (
                                    <label className="flex items-center gap-1 text-slate-700"><input type="checkbox" checked={complexOptions.includeHouseholdRRIN} onChange={e => setComplexOptions({...complexOptions, includeHouseholdRRIN: e.target.checked})}/> 세대원 이름/번호 공개</label>
                                )}
                                {DOC_SPECS[selectedDoc].options!.includes('relationship') && (
                                    <label className="flex items-center gap-1 text-slate-700"><input type="checkbox" checked={complexOptions.includeRelationship} onChange={e => setComplexOptions({...complexOptions, includeRelationship: e.target.checked})}/> 관계 표기</label>
                                )}
                                {DOC_SPECS[selectedDoc].options!.includes('move_in_date') && (
                                    <label className="flex items-center gap-1 text-slate-700"><input type="checkbox" checked={complexOptions.includeMoveInDate} onChange={e => setComplexOptions({...complexOptions, includeMoveInDate: e.target.checked})}/> 전입일 표기</label>
                                )}
                                {DOC_SPECS[selectedDoc].options!.includes('householder') && (
                                    <label className="flex items-center gap-1 text-slate-700"><input type="checkbox" checked={complexOptions.householderName} onChange={e => setComplexOptions({...complexOptions, householderName: e.target.checked})}/> 세대주/소유자 성명</label>
                                )}
                                {DOC_SPECS[selectedDoc].options!.includes('military') && (
                                    <label className="flex items-center gap-1 text-slate-700"><input type="checkbox" checked={complexOptions.militaryRecord} onChange={e => setComplexOptions({...complexOptions, militaryRecord: e.target.checked})}/> 병역사항 포함</label>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500">수령 방법 (Delivery)</label>
                        <select className="border p-1 text-sm rounded bg-white" value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value as DeliveryMethod)}>
                            <option value="print">프린터 출력 (기본)</option>
                            <option value="electronic_wallet">전자문서지갑 전송</option>
                            <option value="pdf">PDF 파일 저장</option>
                            <option value="fax">팩스 전송</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">연락처</label>
                            <input className="border p-1 text-sm rounded bg-white" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} placeholder="010-0000-0000"/>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">발급 부수</label>
                            <input 
                                type="text" 
                                className="border p-1 text-sm rounded bg-white" 
                                value={formData.copies || ''} 
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === '') setFormData({...formData, copies: 0});
                                    else {
                                        const num = parseInt(val);
                                        if (!isNaN(num)) setFormData({...formData, copies: num});
                                    }
                                }} 
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleIssueDocument}
                        disabled={processingIssue}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded shadow mt-4 flex justify-center items-center gap-2"
                    >
                        {processingIssue ? <Loader2 className="animate-spin" /> : <Printer />} 
                        발급 신청 (Issue)
                    </button>
                 </div>
                 
                 {/* Address Search Modal Overlay */}
                 {showAddressSearch && (
                     <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                         <div className="bg-white p-4 rounded shadow-xl border w-80">
                             <div className="font-bold mb-2">주소 검색</div>
                             <div className="flex gap-2 mb-2">
                                 <input className="border p-1 flex-1" value={addressSearchQuery} onChange={e => setAddressSearchQuery(e.target.value)} placeholder="도로명 입력" />
                                 <button onClick={() => { setSearchResults(['서울특별시 종로구 세종대로 209', '서울특별시 종로구 세종로 77-6', '서울특별시 강남구 테헤란로 152']); }} className="bg-blue-500 text-white px-2 rounded">검색</button>
                             </div>
                             <div className="max-h-40 overflow-y-auto space-y-1">
                                 {searchResults.map((addr, i) => (
                                     <div key={i} className="p-1 hover:bg-blue-50 cursor-pointer text-sm" onClick={() => {
                                         if (targetSearchField === 'address') setFormData({...formData, address: addr});
                                         else setFormData({...formData, baseAddress: addr});
                                         setShowAddressSearch(false);
                                     }}>{addr}</div>
                                 ))}
                             </div>
                             <button onClick={() => setShowAddressSearch(false)} className="mt-2 w-full border p-1 rounded text-xs hover:bg-gray-100">닫기</button>
                         </div>
                     </div>
                 )}
             </div>
         </div>
      </div>
    );
  };

  const renderExcel = () => {
    return (
      <div className="flex flex-col h-full bg-white">
         <div className="bg-green-700 text-white p-2 text-sm font-bold flex gap-4 items-center">
             <FileSpreadsheet size={16} /> 한셀 2024 - [통합문서1]
             <div className="flex gap-2 ml-4">
                 <button className="p-1 hover:bg-green-600 rounded"><Save size={14}/></button>
                 <button className="p-1 hover:bg-green-600 rounded"><Printer size={14}/></button>
             </div>
             <div className="ml-auto">
                 <button onClick={handleExcelReport} className="px-3 py-1 bg-green-800 text-white font-bold hover:bg-green-900 flex items-center gap-1 rounded text-xs"><Send size={12}/> 상사에게 보고</button>
             </div>
         </div>
         <div className="flex-1 overflow-auto">
             <table className="w-full border-collapse text-xs">
                 <thead>
                     <tr className="bg-slate-100 text-slate-600">
                         <th className="border w-10"></th>
                         {['A', 'B', 'C', 'D', 'E'].map(col => <th key={col} className="border p-1 w-24 text-center">{col}</th>)}
                     </tr>
                 </thead>
                 <tbody>
                     {excelData.map((row, rIndex) => (
                         <tr key={rIndex}>
                             <td className="bg-slate-100 border text-center font-bold text-slate-500">{rIndex + 1}</td>
                             {row.map((cell, cIndex) => (
                                 <td key={cIndex} className="border p-0">
                                     <input 
                                         className="w-full h-full p-1 border-none focus:outline-none focus:bg-blue-50"
                                         value={cell}
                                         onChange={(e) => {
                                             const newData = [...excelData];
                                             newData[rIndex][cIndex] = e.target.value;
                                             setExcelData(newData);
                                         }}
                                     />
                                 </td>
                             ))}
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      </div>
    );
  };

  const renderBrowser = () => {
    return (
        <div className="flex flex-col h-full bg-white">
            <div className="bg-slate-200 p-2 flex gap-2 items-center border-b">
                <button className="p-1 hover:bg-slate-300 rounded"><ArrowLeft size={16}/></button>
                <button className="p-1 hover:bg-slate-300 rounded"><RotateCcw size={16}/></button>
                <input className="flex-1 border p-1 text-sm rounded" value={browserUrl} onChange={e=>setBrowserUrl(e.target.value)} />
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {browserContent === 'home' && (
                    <div className="flex flex-col items-center mt-20 gap-4">
                        <h1 className="text-4xl font-bold text-blue-600">Portal</h1>
                        <div className="flex gap-2 w-full max-w-md">
                            <input className="border-2 border-blue-500 rounded-full px-4 py-2 flex-1" placeholder="검색어 입력" value={browserSearch} onChange={e=>setBrowserSearch(e.target.value)}/>
                            <button className="bg-blue-500 text-white rounded-full px-4 font-bold">검색</button>
                        </div>
                        <div className="mt-10 grid grid-cols-3 gap-4 text-center text-sm text-slate-600">
                             <div className="p-4 border rounded hover:bg-slate-50 cursor-pointer">뉴스</div>
                             <div className="p-4 border rounded hover:bg-slate-50 cursor-pointer">증권</div>
                             <div className="p-4 border rounded hover:bg-slate-50 cursor-pointer">부동산</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderNotepad = () => {
    return (
        <textarea 
            className="w-full h-full p-2 resize-none focus:outline-none font-mono text-sm"
            value={notepadContent}
            onChange={(e) => setNotepadContent(e.target.value)}
        />
    );
  };

  const renderMail = () => {
      return (
          <div className="flex flex-col h-full bg-white">
              <div className="bg-slate-100 p-2 border-b flex justify-between items-center">
                  <span className="font-bold text-sm">받은 편지함 ({emails.filter(e=>!e.read).length})</span>
                  <button className="text-xs bg-blue-500 text-white px-2 py-1 rounded" onClick={() => { setSelectedMail(null); setReplyingMail(null); }}>목록</button>
              </div>
              <div className="flex-1 overflow-hidden flex">
                  {!selectedMail ? (
                      <div className="w-full overflow-y-auto">
                          {emails.map(email => (
                              <div key={email.id} onClick={() => { setSelectedMail(email); setEmails(prev => prev.map(e => e.id === email.id ? {...e, read: true} : e))}} className={`p-3 border-b cursor-pointer hover:bg-blue-50 ${!email.read ? 'bg-blue-50 font-bold' : ''}`}>
                                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                                      <span>{email.sender}</span>
                                      <span>{email.time}</span>
                                  </div>
                                  <div className="text-sm truncate">{email.title}</div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="w-full flex flex-col p-4 overflow-y-auto">
                          <h2 className="font-bold text-lg mb-2">{selectedMail.title}</h2>
                          <div className="text-xs text-slate-500 mb-4 border-b pb-2">보낸사람: {selectedMail.sender} | {selectedMail.time}</div>
                          <div className="whitespace-pre-wrap text-sm flex-1">{selectedMail.body}</div>
                          <div className="mt-4 pt-4 border-t flex gap-2">
                              <button onClick={() => setReplyingMail(selectedMail)} className="px-3 py-1 bg-slate-200 rounded text-sm hover:bg-slate-300">답장</button>
                              <button onClick={() => { setEmails(prev => prev.filter(e => e.id !== selectedMail.id)); setSelectedMail(null); }} className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200">삭제</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const renderMusic = () => {
    const currentTrack = playList[currentTrackIndex];
    return (
        <div className="flex flex-col h-full bg-slate-900 text-white p-4 items-center justify-center">
             <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-4 animate-pulse shadow-[0_0_15px_rgba(74,222,128,0.5)]"></div>
             <div className="text-center mb-6">
                 <h3 className="font-bold text-lg">{currentTrack}</h3>
                 <p className="text-xs text-slate-400">Various Artists</p>
             </div>
             <div className="flex items-center gap-6">
                 <button onClick={() => setCurrentTrackIndex((prev) => (prev - 1 + playList.length) % playList.length)}><SkipForward className="rotate-180" /></button>
                 <button onClick={() => setMusicPlaying(!musicPlaying)} className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 text-black">
                     {musicPlaying ? <Pause fill="black" /> : <Play fill="black" className="ml-1"/>}
                 </button>
                 <button onClick={() => setCurrentTrackIndex((prev) => (prev + 1) % playList.length)}><SkipForward /></button>
             </div>
        </div>
    );
  };

  const renderCalculator = () => {
      const btns = ['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'];
      return (
          <div className="flex flex-col h-full bg-slate-200">
                  <div className="h-16 bg-white border-b p-2 text-right text-2xl font-mono flex items-center justify-end overflow-hidden">
                      {calcInput}
                  </div>
                  <div className="grid grid-cols-4 gap-1 p-1 flex-1">
                      {btns.map(btn => (
                          <button 
                            key={btn} 
                            onClick={() => {
                                if(btn === 'C') { setCalcInput("0"); setCalcOp(null); setCalcMemory(null); }
                                else if(btn === '=') {
                                    if(calcOp && calcMemory !== null) {
                                        const current = parseFloat(calcInput);
                                        let res = 0;
                                        if(calcOp === '+') res = calcMemory + current;
                                        if(calcOp === '-') res = calcMemory - current;
                                        if(calcOp === '*') res = calcMemory * current;
                                        if(calcOp === '/') res = calcMemory / current;
                                        setCalcInput(String(res));
                                        setCalcOp(null);
                                        setCalcMemory(null);
                                        setResetCalc(true);
                                    }
                                } else if (['+','-','*','/'].includes(btn)) {
                                    setCalcMemory(parseFloat(calcInput));
                                    setCalcOp(btn);
                                    setResetCalc(true);
                                } else {
                                    if (resetCalc) {
                                        setCalcInput(btn);
                                        setResetCalc(false);
                                    } else {
                                        setCalcInput(calcInput === "0" ? btn : calcInput + btn);
                                    }
                                }
                            }}
                            className={`font-bold rounded ${['C'].includes(btn) ? 'bg-red-200 text-red-800' : ['=','+','-','*','/'].includes(btn) ? 'bg-orange-200 text-orange-800' : 'bg-white hover:bg-slate-100'}`}
                          >
                              {btn}
                          </button>
                      ))}
                  </div>
              </div>
          );
  };

  const renderFiles = () => {
      const files = [
          { name: '내 문서', type: 'folder' },
          { name: '사진', type: 'folder' },
          { name: '업무 자료', type: 'folder' },
          { name: '이력서.hwp', type: 'file' },
          { name: '예산안.xlsx', type: 'file' },
      ];
      return (
          <div className="bg-white h-full p-4 grid grid-cols-4 gap-4 content-start">
              {files.map((f, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer p-2 hover:bg-blue-50 rounded">
                      {f.type === 'folder' ? <FolderOpen className="text-yellow-500" size={32}/> : <FileText className="text-blue-400" size={32}/>}
                      <span className="text-xs text-center truncate w-full group-hover:text-blue-600">{f.name}</span>
                  </div>
              ))}
          </div>
      );
  };

  const renderStartMenu = () => {
    if (!isStartMenuOpen) return null;
    return (
        <div className="absolute bottom-10 left-0 w-64 bg-white border-2 border-slate-400 shadow-xl z-[60] flex flex-col animate-slide-up">
            <div className="h-16 bg-blue-600 flex items-center px-4 gap-3 text-white cursor-pointer hover:bg-blue-700" onClick={() => setShowPlayerProfile(true)}>
                <div className="w-10 h-10 bg-white rounded-full border-2 border-blue-300 overflow-hidden">
                    <User size={40} className="text-slate-400 mt-1"/>
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm">{PLAYER_PROFILE.name}</span>
                    <span className="text-xs text-blue-200">내 정보 보기</span>
                </div>
            </div>
            <div className="flex-1 py-2 bg-white">
                 {APPS.map(app => (
                     <div key={app.id} onClick={() => toggleWindow(app.id)} className="px-4 py-2 hover:bg-blue-100 cursor-pointer flex items-center gap-3 text-sm text-slate-800">
                         {/* Icons for menu */}
                         {app.id === 'minwon24' ? <Briefcase size={16} className="text-indigo-600"/> : 
                          app.id === 'messenger' ? <MessageCircle size={16} className="text-yellow-600"/> : 
                          app.id === 'excel' ? <Table size={16} className="text-green-600"/> : 
                          app.id === 'mail' ? <Mail size={16} className="text-sky-600"/> :
                          app.id === 'notepad' ? <FileText size={16} className="text-slate-600"/> :
                          app.id === 'music' ? <Music size={16} className="text-green-500"/> :
                          app.id === 'calculator' ? <Calculator size={16} className="text-orange-500"/> :
                          app.id === 'files' ? <FolderOpen size={16} className="text-indigo-500"/> :
                          <Globe size={16} className="text-blue-500"/>}
                         {app.name}
                     </div>
                 ))}
            </div>
            <div className="bg-blue-100 p-2 flex justify-end border-t border-blue-200">
                <button onClick={() => setGameStarted(false)} className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 font-bold"><LogOut size={12}/> 시스템 종료</button>
            </div>
        </div>
    );
  };

  const renderPlayerProfile = () => {
    if (!showPlayerProfile) return null;
    return (
        <div className="absolute inset-0 z-[100] bg-black/50 flex items-center justify-center animate-fade-in" onClick={() => setShowPlayerProfile(false)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-full relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                <div className="relative pt-12 flex flex-col items-center">
                    <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg mb-4">
                        <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                             <User size={48} className="text-slate-400 translate-y-2"/>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">{PLAYER_PROFILE.name}</h2>
                    <p className="text-blue-600 font-bold text-sm mb-6">{PLAYER_PROFILE.rank} / {PLAYER_PROFILE.department}</p>
                    
                    <div className="w-full grid grid-cols-1 gap-3 text-sm">
                         <div className="bg-slate-50 p-3 rounded border border-slate-200 flex justify-between">
                             <span className="text-slate-500">공무원증 번호</span>
                             <span className="font-mono font-bold">{PLAYER_PROFILE.idCardNumber}</span>
                         </div>
                         <div className="bg-slate-50 p-3 rounded border border-slate-200 flex justify-between group">
                             <span className="text-slate-500">주민등록번호</span>
                             <div className="flex items-center gap-2">
                                <span className="font-mono font-bold">{PLAYER_PROFILE.rrinFront}-{PLAYER_PROFILE.rrinBack}</span>
                                <button onClick={() => navigator.clipboard.writeText(PLAYER_PROFILE.rrinFront+PLAYER_PROFILE.rrinBack)} className="text-slate-400 hover:text-blue-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={12}/></button>
                             </div>
                         </div>
                    </div>
                    <button onClick={() => setShowPlayerProfile(false)} className="mt-6 text-slate-400 text-xs underline hover:text-slate-600">닫기</button>
                </div>
            </div>
        </div>
    );
  };

  if (!gameStarted) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="max-w-md text-center space-y-6 animate-fade-in">
             <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Briefcase size={48} />
             </div>
             <h1 className="text-4xl font-bold tracking-tight">GovOS v14.0</h1>
             <p className="text-slate-400">K-공무원 시뮬레이터: 리얼리티 패치</p>
             <div className="flex gap-4 justify-center">
                 <button onClick={() => startGame(false)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-full transition-all flex items-center gap-2">
                    <FileQuestion size={18} /> 튜토리얼 진행
                 </button>
                 <button onClick={() => startGame(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-blue-900/50">
                    <Power size={20} /> 바로 실무 투입
                 </button>
             </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#008080] overflow-hidden flex flex-col relative font-sans select-none" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div className="flex-1 relative p-4 grid grid-cols-1 gap-4 content-start w-32 z-0">
        {APPS.map(app => (
             <div key={app.id} onDoubleClick={() => toggleWindow(app.id)} onClick={() => toggleWindow(app.id)} className="flex flex-col items-center gap-1 group cursor-pointer w-24 p-2 rounded hover:bg-white/20 transition-colors">
                <div className={`${app.color} w-12 h-12 rounded-lg flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform`}>
                    {app.id === 'minwon24' ? <Briefcase className="text-white"/> : 
                     app.id === 'messenger' ? <MessageCircle className="text-white"/> : 
                     app.id === 'excel' ? <Table className="text-white"/> : 
                     app.id === 'mail' ? <Mail className="text-white"/> :
                     app.id === 'notepad' ? <FileText className="text-white"/> :
                     app.id === 'music' ? <Music className="text-white"/> :
                     app.id === 'calculator' ? <Calculator className="text-white"/> :
                     app.id === 'files' ? <FolderOpen className="text-white"/> :
                     <Globe className="text-white"/>}
                </div>
                <span className="text-white text-xs drop-shadow-md text-center bg-black/20 px-1 rounded truncate w-full">{app.name}</span>
             </div>
        ))}
      </div>
      <div className="absolute top-4 right-4 w-64 md:w-80 z-0"><StatsDisplay stats={stats} /></div>

      {printedDoc && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white p-8 max-w-lg w-full shadow-2xl animate-scale-in relative min-h-[600px] flex flex-col">
                  {/* Paper Border Effect */}
                  <div className="border-4 border-double border-slate-800 p-6 flex-1 flex flex-col relative">
                      
                      {/* Title */}
                      <h1 className="text-3xl font-black text-center mb-8 font-serif underline decoration-4 decoration-double">{printedDoc.docLabel}</h1>
                      
                      {/* Dynamic Preview */}
                      {renderDocumentPreview()}

                      {/* Content Body */}
                      <div className="flex-1 p-4 text-center font-serif leading-loose">
                          위와 같이 신청하였음을 증명합니다.
                          <br/><br/>
                          <span className="text-lg">{printedDoc.issueDate}</span>
                      </div>

                      {/* Footer / Seal */}
                      <div className="mt-8 text-center text-2xl font-black font-serif relative">
                          대한민국 시장/군수/구청장
                          <div className="absolute -top-4 right-8 opacity-80 border-4 border-red-600 rounded-sm text-red-600 p-1 text-sm font-bold w-20 h-20 flex items-center justify-center rotate-3 mix-blend-multiply">
                              관인<br/>생략
                          </div>
                      </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex justify-center gap-2">
                      <button onClick={() => setPrintedDoc(null)} className="px-4 py-2 bg-slate-200 font-bold hover:bg-slate-300 transition-colors">파쇄 (취소)</button>
                      <button onClick={handlePrintConfirm} className="px-6 py-2 bg-blue-600 text-white font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg"><Send size={16}/> 민원인에게 교부</button>
                  </div>
              </div>
          </div>
      )}

      {renderPlayerProfile()}

      {windows.map(win => {
          if (!win.isOpen || win.isMinimized) return null;
          
          return (
              <div key={win.id} className="absolute bg-[#ece9d8] border-2 border-slate-600 shadow-2xl flex flex-col" 
                   style={{
                       zIndex: win.zIndex, 
                       top: win.y, 
                       left: win.x, 
                       width: win.id==='messenger'?'350px': win.id==='notepad' ? '300px' : win.id==='music' ? '300px' : win.id==='calculator' ? '250px' : win.id === 'files' ? '400px' : '700px', 
                       height: win.id==='notepad' ? '400px' : win.id==='music' ? '250px' : win.id==='calculator' ? '350px' : win.id === 'files' ? '300px' : '600px'
                   }} 
                   onMouseDown={() => bringToFront(win.id)}>
                  <div 
                      className={`p-1 px-2 flex justify-between items-center cursor-move ${activeWindowId === win.id ? 'bg-gradient-to-r from-blue-800 to-blue-500 text-white' : 'bg-slate-400'}`}
                      onMouseDown={(e) => handleMouseDown(e, win.id)}
                  >
                      <span className="font-bold text-sm pointer-events-none flex items-center gap-2">
                          {win.title}
                      </span>
                      <div className="flex gap-1"><button onClick={(e)=>{e.stopPropagation();minimizeWindow(win.id)}} className="w-5 h-5 bg-[#ece9d8] text-black flex items-center justify-center border-white border hover:bg-slate-200"><Minus size={12}/></button><button onClick={(e)=>{e.stopPropagation();closeWindow(win.id)}} className="w-5 h-5 bg-[#ff4d4d] text-white flex items-center justify-center border-white border hover:bg-red-600"><X size={12}/></button></div>
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                      {win.id === 'messenger' && renderMessenger()}
                      {win.id === 'minwon24' && renderMinwon24()}
                      {win.id === 'excel' && renderExcel()}
                      {win.id === 'browser' && renderBrowser()}
                      {win.id === 'notepad' && renderNotepad()}
                      {win.id === 'mail' && renderMail()}
                      {win.id === 'music' && renderMusic()}
                      {win.id === 'calculator' && renderCalculator()}
                      {win.id === 'files' && renderFiles()}
                  </div>
              </div>
          )
      })}
      
      {renderStartMenu()}

      <div className="h-10 bg-[#245DDA] border-t-2 border-[#3E80EE] flex items-center px-2 gap-1 z-50 shadow-lg absolute bottom-0 w-full">
         <button onClick={() => setIsStartMenuOpen(!isStartMenuOpen)} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-r-xl font-bold italic border-r-2 border-b-2 border-green-800 shadow-md active:border-none active:translate-y-[1px]">시작</button>
         {windows.map(win => win.isOpen && <button key={win.id} onClick={() => win.isMinimized ? toggleWindow(win.id) : bringToFront(win.id)} className={`w-32 px-2 py-1 text-xs truncate rounded flex items-center gap-1 shadow-sm ${activeWindowId === win.id && !win.isMinimized ? 'bg-[#1b46a8] text-white font-bold' : 'bg-[#3b80f0] text-white hover:bg-[#4b90ff]'}`}>{APPS.find(a => a.id === win.id)?.name}</button>)}
         {notifications.length > 0 && <div className="ml-auto bg-[#1b46a8] text-white px-3 py-1 rounded text-xs animate-pulse cursor-pointer shadow-md border border-blue-400" onClick={() => toggleWindow('messenger')}><Bell size={12}/> {notifications[0]}</div>}
      </div>
      
      {gameOver && <div className="absolute inset-0 z-50 bg-blue-800 text-white flex flex-col items-center justify-center"><h2 className="text-2xl mb-4">GAME OVER</h2><p>{gameOverReason}</p><button onClick={() => startGame(false)} className="bg-white text-blue-900 px-4 py-2 mt-4 font-bold">재시작</button></div>}
    </div>
  );
};

export default App;
