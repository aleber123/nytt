import { collection, doc, setDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './config';

const DRIVER_REPORTS_COLLECTION = 'driverReports';

export interface DriverReport {
  id?: string;
  driverId: string;
  date: string; // YYYY-MM-DD
  hoursWorked: number;
  parkingCost: number;
  embassyCost: number;
  otherCost: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface SaveDriverReportParams {
  driverId: string;
  date: string; // YYYY-MM-DD
  hoursWorked: string;
  parkingCost: string;
  embassyCost: string;
  otherCost: string;
  notes: string;
}

export const saveDriverDailyReport = async (params: SaveDriverReportParams): Promise<void> => {
  const { driverId, date, hoursWorked, parkingCost, embassyCost, otherCost, notes } = params;

  if (!date) {
    throw new Error('Date is required for driver report');
  }

  const cleanDriverId = driverId || 'default-driver';


  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const hours = hoursWorked ? parseFloat(hoursWorked.replace(',', '.')) : 0;
  const parking = parkingCost ? parseInt(parkingCost, 10) || 0 : 0;
  const embassy = embassyCost ? parseInt(embassyCost, 10) || 0 : 0;
  const other = otherCost ? parseInt(otherCost, 10) || 0 : 0;

  const now = Timestamp.now();

  // Use deterministic document ID per driver + date so that the same day can be overwritten
  const docId = `${cleanDriverId}_${date}`;
  const ref = doc(collection(db, DRIVER_REPORTS_COLLECTION), docId);

  const payload: DriverReport = {
    driverId: cleanDriverId,
    date,
    hoursWorked: isNaN(hours) ? 0 : hours,
    parkingCost: isNaN(parking) ? 0 : parking,
    embassyCost: isNaN(embassy) ? 0 : embassy,
    otherCost: isNaN(other) ? 0 : other,
    notes: notes?.trim() || '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    throw error;
  }
};

export interface DriverMonthlySummary {
  driverId: string;
  year: number;
  month: number; // 1-12
  totalHours: number;
  totalParking: number;
  totalEmbassy: number;
  totalOther: number;
  reports: DriverReport[];
}

export const getDriverMonthlySummary = async (
  driverId: string,
  year: number,
  month: number
): Promise<DriverMonthlySummary> => {
  const cleanDriverId = driverId || 'default-driver';

  const monthStr = String(month).padStart(2, '0');
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-31`;

  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const colRef = collection(db, DRIVER_REPORTS_COLLECTION);
  const q = query(
    colRef,
    where('driverId', '==', cleanDriverId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(q);

  const reports: DriverReport[] = [];
  let totalHours = 0;
  let totalParking = 0;
  let totalEmbassy = 0;
  let totalOther = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as DriverReport;
    const report: DriverReport = {
      ...data,
      id: docSnap.id,
    };

    reports.push(report);
    totalHours += report.hoursWorked || 0;
    totalParking += report.parkingCost || 0;
    totalEmbassy += report.embassyCost || 0;
    totalOther += report.otherCost || 0;
  });

  const summary: DriverMonthlySummary = {
    driverId: cleanDriverId,
    year,
    month,
    totalHours,
    totalParking,
    totalEmbassy,
    totalOther,
    reports,
  };

  return summary;
};
