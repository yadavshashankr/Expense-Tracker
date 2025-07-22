import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

// Add expense for a user (and mirrored for counterparty)
export async function addExpense(userEmail, expense, senderName) {
  const senderRef = collection(db, 'users', userEmail, 'expenses');
  await addDoc(senderRef, expense);

  if (expense.userEmail && expense.userEmail !== userEmail) {
    const receiverRef = collection(db, 'users', expense.userEmail, 'expenses');
    const mirroredExpense = {
      ...expense,
      name: senderName || userEmail,
      type: expense.type === 'credit' ? 'debit' : 'credit'
    };
    await addDoc(receiverRef, mirroredExpense);
  }
}

// Get all expenses for a user (ordered by timestamp desc)
export async function getExpenses(userEmail) {
  const expensesRef = collection(db, 'users', userEmail, 'expenses');
  const q = query(expensesRef, orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  return { expenses: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
}

// Update an expense by document ID
export async function updateExpense(userEmail, expenseId, updatedExpense) {
  const expenseDoc = doc(db, 'users', userEmail, 'expenses', expenseId);
  await updateDoc(expenseDoc, updatedExpense);
}

// Delete an expense by document ID
export async function deleteExpense(userEmail, expenseId) {
  const expenseDoc = doc(db, 'users', userEmail, 'expenses', expenseId);
  await deleteDoc(expenseDoc);
}

// Stub for ensureUserSheet (not needed in Firestore, but for API compatibility)
export async function ensureUserSheet(userEmail) {
  return { sheetId: userEmail };
}

// Stub for testConnection (for API compatibility)
export async function testConnection() {
  return { success: true, message: 'Firestore connection successful' };
} 