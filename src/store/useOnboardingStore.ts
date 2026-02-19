import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type IdentityType = 'PERSON' | 'INSTITUTION';
export type TaxIdType = 'SSN' | 'ITIN' | 'EIN' | 'FOREIGN_TIN' | 'NONE';

interface PersonInfo {
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  phone: string;
  nationality: string;
}

interface AddressInfo {
  street1: string;
  street2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface TaxInfo {
  tax_id_type: TaxIdType;
  tax_id: string;
  tax_country: string;
}

interface DocumentInfo {
  document_type: string;
  front_file?: File;
  back_file?: File;
  selfie_file?: File;
  document_ids: string[];
}

interface InstitutionInfo {
  name: string;
  entity_type: string;
  registration_number: string;
  country_of_incorporation: string;
  description: string;
  website: string;
}

interface OnboardingState {
  currentStep: number;
  identityType: IdentityType;
  personInfo: PersonInfo;
  institutionInfo: InstitutionInfo;
  address: AddressInfo;
  taxInfo: TaxInfo;
  documents: DocumentInfo;
  termsAccepted: boolean;
  identityId: string | null;
  accountId: string | null;
  profileId: string | null;

  setStep: (step: number) => void;
  setIdentityType: (type: IdentityType) => void;
  setPersonInfo: (info: Partial<PersonInfo>) => void;
  setInstitutionInfo: (info: Partial<InstitutionInfo>) => void;
  setAddress: (addr: Partial<AddressInfo>) => void;
  setTaxInfo: (tax: Partial<TaxInfo>) => void;
  setDocuments: (docs: Partial<DocumentInfo>) => void;
  setTermsAccepted: (accepted: boolean) => void;
  setIdentityId: (id: string) => void;
  setAccountId: (id: string) => void;
  setProfileId: (id: string) => void;
  reset: () => void;
}

const initialPersonInfo: PersonInfo = { first_name: '', middle_name: '', last_name: '', date_of_birth: '', email: '', phone: '', nationality: '' };
const initialAddress: AddressInfo = { street1: '', street2: '', city: '', state: '', postal_code: '', country: 'US' };
const initialTaxInfo: TaxInfo = { tax_id_type: 'SSN', tax_id: '', tax_country: 'US' };
const initialDocs: DocumentInfo = { document_type: 'PASSPORT', document_ids: [] };
const initialInstitution: InstitutionInfo = { name: '', entity_type: '', registration_number: '', country_of_incorporation: '', description: '', website: '' };

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      identityType: 'PERSON',
      personInfo: initialPersonInfo,
      institutionInfo: initialInstitution,
      address: initialAddress,
      taxInfo: initialTaxInfo,
      documents: initialDocs,
      termsAccepted: false,
      identityId: null,
      accountId: null,
      profileId: null,

      setStep: (step) => set({ currentStep: step }),
      setIdentityType: (type) => set({ identityType: type }),
      setPersonInfo: (info) => set((s) => ({ personInfo: { ...s.personInfo, ...info } })),
      setInstitutionInfo: (info) => set((s) => ({ institutionInfo: { ...s.institutionInfo, ...info } })),
      setAddress: (addr) => set((s) => ({ address: { ...s.address, ...addr } })),
      setTaxInfo: (tax) => set((s) => ({ taxInfo: { ...s.taxInfo, ...tax } })),
      setDocuments: (docs) => set((s) => ({ documents: { ...s.documents, ...docs } })),
      setTermsAccepted: (accepted) => set({ termsAccepted: accepted }),
      setIdentityId: (id) => set({ identityId: id }),
      setAccountId: (id) => set({ accountId: id }),
      setProfileId: (id) => set({ profileId: id }),
      reset: () => set({ currentStep: 1, identityType: 'PERSON', personInfo: initialPersonInfo, institutionInfo: initialInstitution, address: initialAddress, taxInfo: initialTaxInfo, documents: initialDocs, termsAccepted: false, identityId: null, accountId: null, profileId: null }),
    }),
    {
      name: 'aureum-onboarding',
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { documents, ...rest } = state;
        return { ...rest, documents: { document_type: state.documents.document_type, document_ids: state.documents.document_ids } };
      },
    }
  )
);
