export type Profile = {
  id: string;
  full_name: string;
  blood_type: string;
  allergies: string;
  conditions: string;
  medications: string;
  emergency_contacts: string;
  updated_at: string;
};

export type Medication = {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  time: string;
  active: boolean;
  created_at?: string;
};
