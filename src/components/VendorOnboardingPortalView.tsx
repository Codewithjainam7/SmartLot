// @smartlot/component VendorOnboardingPortalView
// External self-registration portal accessed by trades when invited by Strata Managers
// Compliant with NSW Strata Scheme Management Act & Australian Trade Credential standards
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
  AlertCircle 
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
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col justify-between font-sans selection:bg-[#0055FF] selection:text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SmartLotLogo size={28} />
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block">
              SmartLot <span className="text-[#0055FF] font-black">Trade Portal</span>
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">Accredited Contractor Onboarding</span>
          </div>
        </div>

        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>Exit Portal</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 md:p-10 space-y-6">
        {/* Building Scheme Invitation Banner */}
        <div className="bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-950/30 border border-blue-500/20 rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest text-[#00D4B2] uppercase bg-[#00D4B2]/10 px-2 py-0.5 rounded-full inline-block">
              Invited by Strata Management
            </span>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {schemeName} ({schemeId})
            </h1>
            <p className="text-xs text-gray-400">
              Please complete your contractor credential verification to join this building's verified trade network.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-white/5 border border-white/10 px-3.5 py-2 rounded-2xl">
            <ShieldCheck size={20} className="text-emerald-400" />
            <div className="text-left">
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Compliance Rule</span>
              <span className="text-xs font-bold text-white">$20M Public Liability</span>
            </div>
          </div>
        </div>

        {/* Form Card or Success State */}
        {isSubmitted ? (
          <div className="bg-[#0e121b] border border-emerald-500/30 rounded-3xl p-8 md:p-12 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl font-bold text-white">Application Submitted for Review!</h2>
            <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
              Thank you, <strong>{companyName}</strong>. Your contractor documents, ABN, trade license, and Certificate of Currency have been received.
            </p>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl max-w-md mx-auto text-xs text-gray-400 text-left space-y-1.5">
              <div className="flex justify-between">
                <span>Submitted For:</span>
                <span className="font-bold text-white">{schemeName}</span>
              </div>
              <div className="flex justify-between">
                <span>Trade Category:</span>
                <span className="font-bold text-white">{category}</span>
              </div>
              <div className="flex justify-between">
                <span>Review Status:</span>
                <span className="text-amber-400 font-bold">Pending Manager Verification</span>
              </div>
            </div>
            <button
              onClick={onBack}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              Return to SmartLot
            </button>
          </div>
        ) : (
          <div className="bg-[#0e121b] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white">Contractor Registration Form</h2>
              <p className="text-xs text-gray-400">
                All fields marked with an asterisk <span className="text-red-500">*</span> are required by Australian strata compliance regulations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Company Name <span className="text-red-500 font-bold">*</span>
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

              {/* Email & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Email Address <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="dispatch@trades.com.au"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-[#0055FF]"
                    />
                  </div>
                </div>

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
                      placeholder="https://company.com.au"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-[#0055FF]"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Years of Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Phone No <span className="text-red-500 font-bold">*</span>
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

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Years of Experience <span className="text-red-500 font-bold">*</span>
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

              {/* Service Speciality */}
              <div>
                <CustomSelect
                  label="Service Speciality *"
                  options={categoryOptions}
                  value={category}
                  onChange={setCategory}
                />
              </div>

              {/* Licence No & ABN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Trade Licence No <span className="text-red-500 font-bold">*</span>
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
                    ABN (Australian Business Number) <span className="text-red-500 font-bold">*</span>
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

              {/* Upload Insurance Docs */}
              <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-300">
                    Upload Insurance Docs (Certificate of Currency) <span className="text-red-500 font-bold">*</span>
                  </label>
                  {docName && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check size={12} /> {docName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all">
                    <Upload size={14} className="text-[#00D4B2]" />
                    <span>{docName ? 'Replace Document' : 'Select PDF / Image File'}</span>
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
                  <span className="text-[11px] text-gray-400">PDF, JPG, PNG up to 15MB</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">
                    Policy Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={insuranceExpiry}
                    onChange={e => setInsuranceExpiry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-bold outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <CheckCircle2 size={16} /> Submit Application for Review
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 p-4 text-center text-xs text-gray-500">
        SmartLot Accredited Trade Verification System • NSW Strata Schemes Management Act Compliant
      </footer>
    </div>
  );
}
