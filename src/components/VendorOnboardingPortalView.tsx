import React, { useState } from 'react';
import { SmartLotLogo } from './core/SmartLotLogo';
import { CustomSelect, SelectOption } from './core/CustomSelect';
import { 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  FileText, 
  Upload, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Globe, 
  Award, 
  Check, 
  AlertCircle,
  FileCheck2,
  Lock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface VendorOnboardingPortalProps {
  initialCompanyName?: string;
  initialEmail?: string;
  initialCategory?: string;
  schemeId?: string;
  schemeName?: string;
  onSubmitRegistration: (vendorData: {
    name: string;
    email: string;
    category: string;
    phone: string;
    abn: string;
    licenseNo: string;
    website?: string;
    yearsOfExperience: number;
    insuranceExpiry: string;
    docName?: string;
  }) => void;
  onBack: () => void;
}

export function VendorOnboardingPortalView({
  initialCompanyName = '',
  initialEmail = '',
  initialCategory = 'Lift & Vertical Transport',
  schemeId = 'SP103',
  schemeName = 'Cavalier Grand Residences',
  onSubmitRegistration,
  onBack
}: VendorOnboardingPortalProps) {
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [email, setEmail] = useState(initialEmail);
  const [category, setCategory] = useState(initialCategory);
  const [phone, setPhone] = useState('');
  const [abn, setAbn] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [website, setWebsite] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('5');
  const [insuranceExpiry, setInsuranceExpiry] = useState('2027-12-31');
  const [docName, setDocName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const categoryOptions: SelectOption[] = [
    { value: 'Lift & Vertical Transport', label: 'Lift & Vertical Transport' },
    { value: 'Plumbing & Drainage', label: 'Plumbing & Drainage' },
    { value: 'Electrical & Lighting', label: 'Electrical & Lighting' },
    { value: 'Fire & Safety Services', label: 'Fire & Safety Services' },
    { value: 'Roofing & Waterproofing', label: 'Roofing & Waterproofing' },
    { value: 'Mechanical & Acoustic Services', label: 'Mechanical & Acoustic Services' },
    { value: 'General Building Maintenance', label: 'General Building Maintenance' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !email.trim()) return;

    onSubmitRegistration({
      name: companyName.trim(),
      email: email.trim(),
      category,
      phone: phone.trim() || '02 9000 1111',
      abn: abn.trim() || '51 824 931 002',
      licenseNo: licenseNo.trim() || 'LIC-NSW-39812A',
      website: website.trim() || undefined,
      yearsOfExperience: Number(yearsOfExperience) || 5,
      insuranceExpiry,
      docName: docName || 'Certificate_of_Currency_2026.pdf'
    });

    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col justify-between font-sans selection:bg-[#0055FF] selection:text-white antialiased">
      {/* Top Navigation Bar */}
      <header className="border-b border-white/10 bg-black/60 backdrop-blur-xl px-4 sm:px-8 py-3.5 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SmartLotLogo size={28} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">
                SmartLot
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-[#00D4B2] text-[10px] font-black tracking-wider uppercase">
                Trade Portal
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium block">
              NSW Strata Accredited Contractor Onboarding
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
            <Lock size={12} />
            <span>256-Bit Encrypted Portal</span>
          </div>
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Exit Portal</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Building Scheme Invitation Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e1628] via-[#090d16] to-[#0d101b] border border-blue-500/25 p-6 md:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold tracking-widest text-[#00D4B2] uppercase bg-[#00D4B2]/10 border border-[#00D4B2]/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Sparkles size={11} /> Official Invitation
                </span>
                <span className="text-[11px] text-gray-400 font-medium">Scheme Plan: {schemeId}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {schemeName}
              </h1>
              <p className="text-xs text-gray-300 max-w-xl leading-relaxed">
                You have been invited by the Strata Management Agency to complete your credential verification and become an approved trade contractor for this property.
              </p>
            </div>

            {/* Compliance Guarantee Badge */}
            <div className="shrink-0 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Mandatory Standard</span>
                <span className="text-xs font-black text-white">$20,000,000 PL Cover</span>
                <span className="text-[10px] text-emerald-400 block font-semibold">NSW Compliant</span>
              </div>
            </div>
          </div>

          {/* Stepped Process Visual */}
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="flex items-center gap-2 text-left">
              <span className="w-6 h-6 rounded-full bg-[#0055FF] text-white font-black text-[11px] flex items-center justify-center shrink-0">1</span>
              <div>
                <span className="block font-bold text-white text-[11px]">Contractor Details</span>
                <span className="text-[10px] text-gray-400 hidden sm:block">ABN & Speciality</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-left">
              <span className="w-6 h-6 rounded-full bg-[#0055FF] text-white font-black text-[11px] flex items-center justify-center shrink-0">2</span>
              <div>
                <span className="block font-bold text-white text-[11px]">Certificate Upload</span>
                <span className="text-[10px] text-gray-400 hidden sm:block">Currency & Expiry</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-left">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">3</span>
              <div>
                <span className="block font-bold text-white text-[11px]">Manager Sign-Off</span>
                <span className="text-[10px] text-gray-400 hidden sm:block">Direct Approval</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card or Success State */}
        {isSubmitted ? (
          <div className="bg-[#0e121b] border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5 shadow-lg">
              <CheckCircle2 size={44} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">Application Received for Review</h2>
              <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{companyName}</strong>. Your contractor application and Certificate of Currency have been submitted to the Strata Manager's review portal.
              </p>
            </div>

            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl max-w-md mx-auto text-xs text-gray-300 text-left space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Scheme:</span>
                <span className="font-bold text-white">{schemeName} ({schemeId})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Trade Speciality:</span>
                <span className="font-bold text-white">{category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Review Status:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Pending Manager Review
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[11px]">
                <span className="text-gray-400">Uploaded Doc:</span>
                <span className="font-mono text-emerald-400 font-bold truncate max-w-[200px]">{docName || 'Certificate_of_Currency_2026.pdf'}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onBack}
                className="px-8 py-3 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs shadow-xl transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Return to SmartLot Portal</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#0e121b] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-white/10 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Accredited Contractor Registration</h2>
                <p className="text-xs text-gray-400">
                  Please verify your credentials and upload your current Certificate of Currency.
                </p>
              </div>
              <span className="text-[11px] text-gray-500 font-medium">Fields with <span className="text-red-400">*</span> are mandatory</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: BUSINESS & CONTACT INFORMATION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00D4B2] uppercase tracking-wider">
                  <Building2 size={14} />
                  <span>1. Business & Contact Information</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Registered Company Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g. Apex Electrical Solutions Pty Ltd"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white placeholder-gray-500 outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Business Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="service@apexcontractor.com.au"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-[#0055FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Direct Contact Phone <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="02 9844 2001 or 0412 000 111"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-[#0055FF]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Company Website
                    </label>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        placeholder="https://apexcontractor.com.au"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-[#0055FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Years in Trade / Experience <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Award size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="number"
                        required
                        min="0"
                        value={yearsOfExperience}
                        onChange={e => setYearsOfExperience(e.target.value)}
                        placeholder="e.g. 8"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-[#0055FF]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: LICENSING & TRADE CREDENTIALS */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00D4B2] uppercase tracking-wider">
                  <Award size={14} />
                  <span>2. Licensing & Trade Credentials</span>
                </div>

                <div>
                  <CustomSelect
                    label="Trade Speciality *"
                    options={categoryOptions}
                    value={category}
                    onChange={setCategory}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Trade Licence Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={licenseNo}
                      onChange={e => setLicenseNo(e.target.value)}
                      placeholder="LIC-NSW-39812A"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-white placeholder-gray-500 outline-none focus:border-[#0055FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Australian Business Number (ABN) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={abn}
                      onChange={e => setAbn(e.target.value)}
                      placeholder="51 824 931 002"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-white placeholder-gray-500 outline-none focus:border-[#0055FF]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: INSURANCE COMPLIANCE & CERTIFICATE */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00D4B2] uppercase tracking-wider">
                    <ShieldCheck size={14} />
                    <span>3. Public Liability Insurance Verification</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Min $20M Required
                  </span>
                </div>

                {/* Drag and Drop Zone */}
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setDocName(e.dataTransfer.files[0].name);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    isDragging 
                      ? 'border-[#0055FF] bg-blue-500/10' 
                      : docName 
                      ? 'border-emerald-500/40 bg-emerald-500/5' 
                      : 'border-white/15 bg-white/[0.02] hover:border-white/30'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center mx-auto mb-3">
                    {docName ? <FileCheck2 size={24} className="text-emerald-400" /> : <Upload size={22} className="text-[#00D4B2]" />}
                  </div>

                  {docName ? (
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                        <Check size={14} className="text-emerald-400" />
                        <span>{docName}</span>
                      </div>
                      <p className="text-[11px] text-emerald-400 font-medium">Ready for compliance audit</p>
                      <div className="pt-2">
                        <label className="text-[11px] font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer">
                          Click to replace file
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.png,.jpg"
                            className="hidden"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                setDocName(e.target.files[0].name);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">
                        Upload Certificate of Currency (Public Liability)
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Drag and drop your PDF or image certificate here, or browse files
                      </p>
                      <div className="pt-2">
                        <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white inline-flex items-center gap-2 cursor-pointer transition-all">
                          <Upload size={13} className="text-[#00D4B2]" />
                          <span>Select Document (PDF/JPG)</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.png,.jpg"
                            className="hidden"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                setDocName(e.target.files[0].name);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Insurance Policy Expiry Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={insuranceExpiry}
                    onChange={e => setInsuranceExpiry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-bold outline-none focus:border-[#0055FF]"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Schemes require active, non-expired coverage for job dispatch and contractor badge accreditation.
                  </span>
                </div>
              </div>

              {/* SECTION 4: SUBMIT ACTION */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <Lock size={12} className="text-emerald-400" />
                  <span>Submitted directly to Strata Scheme Managers for verification.</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Submit Application for Review</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 px-6 text-center text-xs text-gray-500">
        SmartLot Accredited Trade Verification System • NSW Strata Schemes Management Act Compliant
      </footer>
    </div>
  );
}
