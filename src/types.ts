export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface User {
  id: number;
  name: string;
  email: string;
  blood_group: BloodGroup;
  address: string;
  role: 'donor' | 'hospital' | 'admin';
}

export interface BloodStock {
  blood_group: BloodGroup;
  quantity_ml: number;
  last_updated: string;
}

export interface BloodRequest {
  id: number;
  requester_id: number;
  requester_name: string;
  blood_group_needed: BloodGroup;
  quantity_ml: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
