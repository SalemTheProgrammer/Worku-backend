export interface Language {
  name: string;
  level: string;
}

export interface Location {
  country: string;
  city: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  professionalStatus?: string;
  availability?: string;
  remoteWork?: boolean;
  location?: Location;
  languages?: Language[];
}