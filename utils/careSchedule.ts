function calculateNextWatering(fromDate: Date, frequencyDays: number | string): Date {
   const next = new Date(fromDate);
   next.setDate(next.getDate() + Number(frequencyDays || 7));
   return next;
}

export { calculateNextWatering };