interface Medication {
	medicalCondition: MedicalCondition;
	medicine: string;
	duration: number;
}

interface FeedbackAndSupport {
	id: string;
	// Add other relevant fields
}

interface Transaction {
	id: string;
	// Add other relevant fields
}

interface Order {
	id: string;
	// Add other relevant fields
}

export interface User {
	name: string;
	mobileNumber: string;
	email: string;
	password: string;
	gender: Gender | undefined; // Consider using a union type if you have predefined options
	yogaLevel: string; // Consider using a union type if you have predefined levels
	age: number | undefined;
	sleepTime: number | undefined;
	height: number | undefined;
	weight: number | undefined;
	menstrualFlow: MenstrualFlow | undefined;
	extraData?: Record<string, any>; // For JSON field
	medications?: Medication[];
	medicalConditions: MedicalCondition[];
	feedback_and_supports?: FeedbackAndSupport[];
	transactions?: Transaction[];
	orders?: Order[];
}

export enum Gender {
	Male = 'Male',
	Female = 'Female',
	Other = 'Other'
}
export enum YogaLevel {
	Beginner = 'beginner',
	Intermediate = 'intermediate',
	Advanced = 'advanced'
}

export enum MedicalCondition {
	Inhaler = 'inhaler',
	Cholesterol = 'cholesterol',
	Diabetes = 'diabetes',
	HeartIssue = 'heartIssue',
	PCOS = 'pcos',
	Thyroid = 'thyroid',
	HighBP = 'highBP',
	SpineIssue = 'spineIssue',
	None = 'none'
}

export enum MenstrualFlowType {
	Regular = 'regular',
	Irregular = 'irregular'
}
